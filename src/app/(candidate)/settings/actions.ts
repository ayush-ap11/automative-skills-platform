"use server";

import { createClient } from "@/lib/supabase/server";

export interface SettingsActionResult {
  success?: boolean;
  error?: string;
}

export async function updatePassword(newPassword: string): Promise<SettingsActionResult> {
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
