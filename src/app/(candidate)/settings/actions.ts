"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limiter";

export interface SettingsActionResult {
  success?: boolean;
  error?: string;
}

export async function updatePassword(newPassword: string): Promise<SettingsActionResult> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`pwd-change:${ip}`, 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: rateLimit.error };
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message || "Failed to update password." };

  return { success: true };
}

export async function toggleEmailNotifications(enabled: boolean): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase
    .from("profiles")
    .update({ email_notifications_enabled: enabled })
    .eq("id", user.id);

  if (error) return { error: error.message || "Failed to update notification preferences." };

  return { success: true };
}

export async function revokeConsent(consentId: string): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cp) return { error: "Candidate profile not found." };

  const { error } = await supabase
    .from("consents")
    .update({ granted: false })
    .eq("id", consentId)
    .eq("candidate_profile_id", cp.id);

  if (error) return { error: error.message || "Failed to revoke consent." };

  return { success: true };
}

export async function deleteCandidateAccount(): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "candidate") {
    return { error: "Only candidate accounts can request self-deletion." };
  }

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const adminClient = createAdminClient();

  if (cp) {
    // 1. Delete all storage artifacts associated with this candidate
    const buckets = ["candidate-documents", "verbal-answers", "candidate-reports"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await adminClient.storage.from(bucket).list(cp.id);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${cp.id}/${f.name}`);
          await adminClient.storage.from(bucket).remove(filePaths);
        }
      } catch {
        // Continue cleaning remaining buckets
      }
    }

    // 2. Scrub personal data from candidate profile
    await adminClient
      .from("candidate_profiles")
      .update({
        usi: null,
        work_rights_status: null,
        current_role: "[ANONYMIZED]",
        specialisations: [],
        vehicle_categories: [],
      })
      .eq("id", cp.id);
  }

  // 3. Scrub personal data from profiles
  await adminClient
    .from("profiles")
    .update({
      full_name: "[DELETED CANDIDATE]",
      preferred_name: null,
      mobile: null,
      state: null,
      email: `deleted-${user.id}@anonymized.invalid`,
    })
    .eq("id", user.id);

  // 4. Log immutable account deletion event
  try {
    await adminClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "candidate_account_deleted",
      entity_type: "profiles",
      entity_id: user.id,
      previous_value: null,
      new_value: { status: "deleted", anonymized_at: new Date().toISOString() },
    });
  } catch {
    // Non-blocking
  }

  // 5. Delete from Supabase Auth
  const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (delErr) {
    return { error: delErr.message || "Failed to remove user account." };
  }

  // 6. Sign out caller session
  await supabase.auth.signOut();

  return { success: true };
}
