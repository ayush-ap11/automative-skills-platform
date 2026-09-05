"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SubmitAssessmentResult {
  success?: boolean;
  error?: string;
  message?: string;
  missingSections?: string[];
}

export async function submitAssessment(assessmentId: string): Promise<SubmitAssessmentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized", message: "User session expired. Please log in again." };
  }

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cp) {
    return { error: "unauthorized", message: "Candidate profile not found." };
  }

  const adminClient = createAdminClient();

  // 1. Verify assessment ownership & status
  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, status, template_id, candidate_profile_id, assigned_examiner_id")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!assessment || assessment.candidate_profile_id !== cp.id) {
    return { error: "unauthorized", message: "Assessment record not found." };
  }

  if (["submitted", "under_review", "completed"].includes(assessment.status)) {
    return {
      error: "invalid_status",
      message: "Assessment has already been submitted.",
    };
  }

  // 2. Server-side mandatory questions re-check
  const { data: sections } = await adminClient
    .from("assessment_sections")
    .select("id, title, order_index")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const sectionIds = (sections || []).map((s) => s.id);
  const { data: mandatoryQuestions } = await adminClient
    .from("questions")
    .select("id, section_id, mandatory")
    .in("section_id", sectionIds)
    .eq("mandatory", true);

  const { data: answers } = await adminClient
    .from("candidate_answers")
    .select("question_id, selected_option_ids, answer_text, verbal_answers(id)")
    .eq("assessment_id", assessmentId);

  const answeredIds = new Set(
    (answers || [])
      .filter(
        (a: any) =>
          (a.selected_option_ids && a.selected_option_ids.length > 0) ||
          (a.answer_text && a.answer_text.trim().length > 0) ||
          (a.verbal_answers &&
            (Array.isArray(a.verbal_answers)
              ? a.verbal_answers.length > 0
              : !!a.verbal_answers?.id))
      )
      .map((a: any) => a.question_id)
  );
  const missingSections: string[] = [];

  for (const sec of sections || []) {
    const secMandatory = (mandatoryQuestions || []).filter((q) => q.section_id === sec.id);
    const hasUnanswered = secMandatory.some((q) => !answeredIds.has(q.id));
    if (hasUnanswered) {
      missingSections.push(sec.title);
    }
  }

  if (missingSections.length > 0) {
    return { error: "incomplete", missingSections };
  }

  // 3. Atomically update assessment status and log submission
  const { data: updated, error: updateError } = await adminClient
    .from("assessments")
    .update({ status: "submitted" })
    .eq("id", assessmentId)
    .in("status", ["in_progress", "not_started"])
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return {
      error: "submission_failed",
      message: "Could not finalize submission. Please try again.",
    };
  }

  // 4. Notify assigned examiner if assigned
  if (assessment.assigned_examiner_id) {
    await adminClient.from("notifications").insert({
      recipient_id: assessment.assigned_examiner_id,
      type: "assessment_submitted",
      title: "Assessment Submitted",
      message: "New assessment submitted for review",
      is_read: false,
    });
  }

  // 5. Immutable audit log entry
  await adminClient.from("audit_logs").insert({
    actor_id: user.id,
    action: "assessment_submitted",
    entity_type: "assessments",
    entity_id: assessmentId,
    previous_value: { status: assessment.status },
    new_value: { status: "submitted" },
  });

  revalidatePath("/assessments");
  revalidatePath(`/assessments/${assessmentId}/review`);
  revalidatePath(`/assessments/${assessmentId}/status`);
  revalidatePath("/candidate/dashboard");

  return { success: true };
}
