"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function startAssessment(assessmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!cp) {
    return { error: "Candidate profile not found" };
  }

  const { data: assessment, error: fetchErr } = await supabase
    .from("assessments")
    .select("id, status, candidate_profile_id")
    .eq("id", assessmentId)
    .eq("candidate_profile_id", cp.id)
    .single();

  if (fetchErr || !assessment) {
    return { error: "Assessment not found or unauthorized" };
  }

  if (assessment.status === "not_started") {
    const adminClient = createAdminClient();
    const { error: updateErr } = await adminClient
      .from("assessments")
      .update({ status: "in_progress" })
      .eq("id", assessmentId);

    if (updateErr) {
      return { error: updateErr.message };
    }
  }

  revalidatePath("/assessments");
  revalidatePath(`/assessments/${assessmentId}/instructions`);
  return { success: true };
}
