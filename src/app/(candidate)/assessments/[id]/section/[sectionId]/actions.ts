"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveAnswer(
  assessmentId: string,
  questionId: string,
  payload: { selectedOptionIds?: string[]; answerText?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) return { error: "Candidate profile not found" };

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, candidate_profile_id")
    .eq("id", assessmentId)
    .eq("candidate_profile_id", cp.id)
    .single();
  if (!assessment) return { error: "Assessment unauthorized or not found" };

  const { data: question } = await supabase
    .from("questions")
    .select("id, question_type, marks, question_options(id, is_correct)")
    .eq("id", questionId)
    .single();
  if (!question) return { error: "Question not found" };

  let isCorrect: boolean | null = null;
  let marksAwarded: number | null = null;
  const selected = payload.selectedOptionIds || [];
  const options = (question.question_options as any[]) || [];

  if (
    ["multiple_choice", "true_false", "scenario"].includes(question.question_type) ||
    (question.question_type === "image_based" && options.length > 0 && selected.length > 0)
  ) {
    const correctOption = options.find((o) => o.is_correct);
    if (correctOption) {
      isCorrect = selected.length === 1 && selected[0] === correctOption.id;
      marksAwarded = isCorrect ? Number(question.marks) : 0;
    }
  } else if (question.question_type === "multiple_answer") {
    const correctIds = options.filter((o) => o.is_correct).map((o) => o.id).sort();
    const userIds = [...selected].sort();
    isCorrect = correctIds.length === userIds.length && correctIds.every((id, i) => id === userIds[i]);
    marksAwarded = isCorrect ? Number(question.marks) : 0;
  }

  const { data: existing } = await supabase
    .from("candidate_answers")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("question_id", questionId)
    .maybeSingle();

  const answerPayload = {
    selected_option_ids: selected,
    answer_text: payload.answerText?.trim() || null,
    is_correct: isCorrect,
    marks_awarded: marksAwarded,
    answered_at: new Date().toISOString(),
  };

  const op = existing
    ? await supabase.from("candidate_answers").update(answerPayload).eq("id", existing.id)
    : await supabase.from("candidate_answers").insert({ assessment_id: assessmentId, question_id: questionId, ...answerPayload });

  if (op.error) return { error: op.error.message };
  return { success: true };
}

export async function completeSection(assessmentId: string, sectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const { data: questions } = await supabase
    .from("questions")
    .select("id, mandatory")
    .eq("section_id", sectionId)
    .eq("mandatory", true);

  const { data: answers } = await supabase
    .from("candidate_answers")
    .select("question_id, selected_option_ids, answer_text")
    .eq("assessment_id", assessmentId);

  const answerMap = new Map((answers || []).map((a) => [a.question_id, a]));
  const missingQuestionIds: string[] = [];

  for (const q of questions || []) {
    const ans = answerMap.get(q.id);
    const hasOptions = (ans?.selected_option_ids || []).length > 0;
    const hasText = Boolean(ans?.answer_text && ans.answer_text.trim().length > 0);
    if (!ans || (!hasOptions && !hasText)) {
      missingQuestionIds.push(q.id);
    }
  }

  if (missingQuestionIds.length > 0) {
    return { success: false, missingQuestionIds };
  }
  return { success: true };
}
