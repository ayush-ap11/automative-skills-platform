"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateEVReadiness } from "@/lib/ai/ev-readiness-calculation";
import { generateAndStoreReport } from "@/lib/pdf/generate-and-store-report";

export async function saveDraft(assessmentId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: a } = await supabase
    .from("assessments")
    .select("id, status")
    .eq("id", assessmentId)
    .eq("assigned_examiner_id", user.id)
    .maybeSingle();

  if (!a) return { error: "Assessment not found or not assigned to you" };
  const adminSupabase = createAdminClient();
  if (a.status !== "under_review" && a.status !== "completed") {
    const { error } = await adminSupabase.from("assessments").update({ status: "under_review" }).eq("id", assessmentId);
    if (error) return { error: error.message };
  }
  return { success: true };
}

export async function finalizeOutcome(
  assessmentId: string,
  outcome: "competent" | "not_yet_competent"
): Promise<{ success?: boolean; error?: string; missingQuestions?: number[]; blockingQuestions?: number[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, template_id, candidate_profile_id, candidate_profiles (profile_id)")
    .eq("id", assessmentId)
    .eq("assigned_examiner_id", user.id)
    .maybeSingle();
  if (!assessment) return { error: "Assessment not found or not assigned to you" };

  const { data: sections } = await supabase
    .from("assessment_sections")
    .select("id, order_index, questions (id, mandatory, safety_critical, created_at)")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const orderedQuestions: Array<{ id: string; num: number; mandatory: boolean; safetyCritical: boolean }> = [];
  let count = 1;
  for (const s of (sections || []).sort((a, b) => a.order_index - b.order_index)) {
    for (const q of (s.questions || []).sort((a, b) => (a.created_at > b.created_at ? 1 : -1))) {
      orderedQuestions.push({ id: q.id, num: count++, mandatory: q.mandatory, safetyCritical: q.safety_critical });
    }
  }

  const adminSupabase = createAdminClient();
  const { data: answers } = await adminSupabase.from("candidate_answers").select("id, question_id").eq("assessment_id", assessmentId);
  const answerIds = (answers || []).map((a) => a.id);
  const { data: reviews } = await adminSupabase
    .from("examiner_reviews")
    .select("candidate_answer_id, decision, final_score")
    .in("candidate_answer_id", answerIds);

  const reviewMap = new Map((reviews || []).map((r) => [r.candidate_answer_id, r]));
  const answerMap = new Map((answers || []).map((a) => [a.question_id, a]));

  const missingQuestions: number[] = [];
  for (const q of orderedQuestions) {
    if (!q.mandatory) continue;
    const ans = answerMap.get(q.id);
    if (!ans || !reviewMap.get(ans.id)) missingQuestions.push(q.num);
  }
  if (missingQuestions.length > 0) return { error: "incomplete", missingQuestions };

  if (outcome === "competent") {
    const blockingQuestions: number[] = [];
    for (const q of orderedQuestions) {
      if (!q.safetyCritical) continue;
      const ans = answerMap.get(q.id);
      const rev = ans ? reviewMap.get(ans.id) : null;
      if (!rev || rev.decision === "request_reassessment") blockingQuestions.push(q.num);
    }
    if (blockingQuestions.length > 0) return { error: "safety_block", blockingQuestions };
  }

  const scores = (reviews || []).map((r) => Number(r.final_score)).filter((s) => !isNaN(s));
  const overall_score = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  await adminSupabase
    .from("assessments")
    .update({ status: "completed", outcome, overall_score, completed_at: new Date().toISOString() })
    .eq("id", assessmentId);

  try {
    await calculateEVReadiness(assessmentId);
  } catch (err) {
    console.error("[EV Readiness Calculation Error]", err);
  }

  try {
    await generateAndStoreReport(assessmentId);
  } catch (err) {
    console.error("[Report Generation Error]", err);
  }

  const candidateUserId = (assessment.candidate_profiles as any)?.profile_id;
  if (candidateUserId) {
    await adminSupabase.from("notifications").insert({
      recipient_id: candidateUserId,
      type: "assessment_reviewed",
      title: "Assessment Reviewed",
      message: "Your assessment has been reviewed by your examiner.",
    });
  }

  await adminSupabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "assessment_finalized",
    entity_type: "assessment",
    entity_id: assessmentId,
    new_value: { outcome, overall_score },
  });

  return { success: true };
}
