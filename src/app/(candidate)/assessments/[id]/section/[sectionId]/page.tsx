import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionItem, AnswerDraft, VerbalQuestionItem, ExistingVerbalAnswer } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";
import { QuestionRunner } from "@/components/candidate/QuestionRunner";
import { VerbalAssessmentRunner } from "@/components/candidate/VerbalAssessmentRunner";

export const dynamic = "force-dynamic";

const NON_VERBAL_TYPES = ["multiple_choice", "multiple_answer", "true_false", "scenario", "short_answer", "image_based"];

interface SectionPageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default async function SectionRunnerPage({ params }: SectionPageProps) {
  const { id, sectionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) redirect("/assessments");

  const { data: assessment } = await supabase.from("assessments").select("id, template_id, candidate_profile_id").eq("id", id).single();
  if (!assessment || assessment.candidate_profile_id !== cp.id) redirect("/assessments");

  const { data: section } = await supabase.from("assessment_sections").select("id, title, template_id").eq("id", sectionId).eq("template_id", assessment.template_id).single();
  if (!section) redirect(`/assessments/${id}/take`);

  const { data: verbalCheck } = await supabase.from("questions").select("id").eq("section_id", sectionId).eq("question_type", "verbal").limit(1);
  const isVerbal = (verbalCheck || []).length > 0;

  if (isVerbal) {
    const { data: rawVerbal } = await supabase.from("questions").select("id, section_id, question_text, mandatory, time_limit_seconds").eq("section_id", sectionId).eq("question_type", "verbal").order("created_at", { ascending: true });
    const verbalQuestions: VerbalQuestionItem[] = (rawVerbal || []).map((q: any) => ({
      id: q.id, section_id: q.section_id, question_text: q.question_text, mandatory: q.mandatory, time_limit_seconds: q.time_limit_seconds,
    }));
    const existingVerbal: Record<string, ExistingVerbalAnswer> = {};
    if (verbalQuestions.length > 0) {
      const { data: caData } = await supabase.from("candidate_answers").select("question_id, verbal_answers(audio_storage_path, duration_seconds, transcripts(transcript_text))").eq("assessment_id", id).in("question_id", verbalQuestions.map((q) => q.id));
      for (const ca of caData || []) {
        const va = (ca as any).verbal_answers?.[0] || (ca as any).verbal_answers;
        if (va) {
          existingVerbal[ca.question_id] = { question_id: ca.question_id, audio_storage_path: va.audio_storage_path, duration_seconds: va.duration_seconds || 0, transcript_text: va.transcripts?.[0]?.transcript_text || null };
        }
      }
    }
    return <VerbalAssessmentRunner assessmentId={id} sectionId={sectionId} sectionTitle={section.title} questions={verbalQuestions} existingAnswers={existingVerbal} />;
  }

  const { data: rawQuestions } = await supabase.from("questions").select("id, section_id, question_text, question_type, mandatory, image_url, time_limit_seconds, question_options(id, option_text, order_index)").eq("section_id", sectionId).in("question_type", NON_VERBAL_TYPES).order("created_at", { ascending: true });
  const questions: QuestionItem[] = (rawQuestions || []).map((q: any) => ({
    id: q.id, section_id: q.section_id, question_text: q.question_text, question_type: q.question_type, mandatory: q.mandatory, image_url: q.image_url, time_limit_seconds: q.time_limit_seconds, options: (q.question_options || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
  }));

  const initialAnswers: Record<string, AnswerDraft> = {};
  if (questions.length > 0) {
    const { data: answers } = await supabase.from("candidate_answers").select("question_id, selected_option_ids, answer_text").eq("assessment_id", id).in("question_id", questions.map((q) => q.id));
    for (const ans of answers || []) {
      initialAnswers[ans.question_id] = { selectedOptionIds: ans.selected_option_ids || [], answerText: ans.answer_text || "" };
    }
  }

  return <QuestionRunner assessmentId={id} sectionId={sectionId} sectionTitle={section.title} questions={questions} initialAnswers={initialAnswers} />;
}
