"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/utils/generate-password";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || !profile.organisation_id) {
    return { error: "Forbidden: Admin access required" };
  }
  return { supabase, user, orgId: profile.organisation_id };
}

export async function getAdminDocumentUrl(documentId: string): Promise<{ signedUrl?: string; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { data: doc } = await auth.supabase
    .from("documents")
    .select(`
      id, storage_path, candidate_profile_id,
      candidate_profiles!inner(
        profiles!inner(organisation_id)
      )
    `)
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { error: "Document not found" };
  const docOrgId = (doc.candidate_profiles as any)?.profiles?.organisation_id;
  if (docOrgId !== auth.orgId) return { error: "Access denied: outside organization" };

  const admin = createAdminClient();
  const { data: signed, error: signErr } = await admin.storage
    .from("candidate-documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (signErr || !signed?.signedUrl) return { error: signErr?.message || "Failed to generate URL" };
  return { signedUrl: signed.signedUrl };
}

export async function reassignExaminer(
  assessmentId: string,
  newExaminerId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error };
  const { supabase, user, orgId } = auth;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, assigned_examiner_id, organisation_id")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!assessment) return { error: "Assessment not found" };
  if (assessment.organisation_id !== orgId) return { error: "Access denied: assessment outside organisation" };

  const { data: newExaminer } = await supabase
    .from("profiles")
    .select("id, role, organisation_id")
    .eq("id", newExaminerId)
    .maybeSingle();

  if (!newExaminer || newExaminer.role !== "examiner" || newExaminer.organisation_id !== orgId) {
    return { error: "Invalid examiner: must be an active examiner in your organisation" };
  }

  const oldExaminerId = assessment.assigned_examiner_id;

  const { error: updateErr } = await supabase
    .from("assessments")
    .update({ assigned_examiner_id: newExaminerId, updated_at: new Date().toISOString() })
    .eq("id", assessmentId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("notifications").insert({
    recipient_id: newExaminerId,
    type: "assessment_assigned",
    title: "Assessment Assigned",
    message: "A candidate assessment has been reassigned to you.",
    is_read: false,
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "examiner_reassigned",
    entity_type: "assessments",
    entity_id: assessmentId,
    previous_value: { examiner_id: oldExaminerId },
    new_value: { examiner_id: newExaminerId },
  });

  return { success: true };
}

export async function resetCandidatePassword(profileId: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: target } = await supabase
    .from("profiles")
    .select("id, organisation_id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!target || target.organisation_id !== orgId || target.role !== "candidate") {
    return { error: "Candidate not found or outside organisation." };
  }

  try {
    const newPassword = generateTemporaryPassword();
    const adminClient = createAdminClient();
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(profileId, {
      password: newPassword,
    });
    if (updateErr) return { error: updateErr.message };

    return { success: true, newPassword };
  } catch (err: any) {
    return { error: err?.message || "Failed to reset candidate password." };
  }
}
