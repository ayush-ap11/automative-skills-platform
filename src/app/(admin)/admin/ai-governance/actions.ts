"use server";

import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) return { error: "Forbidden: Admin only" };

  return { supabase, user, orgId: profile.organisation_id };
}

export async function updateBlindAssessmentMode(enabled: boolean): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: existing } = await supabase.from("system_settings").select("id").eq("organisation_id", orgId).maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("system_settings")
      .update({ blind_assessment_mode: Boolean(enabled), updated_at: new Date().toISOString() })
      .eq("organisation_id", orgId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("system_settings")
      .insert({ organisation_id: orgId, blind_assessment_mode: Boolean(enabled) });
    if (error) return { error: error.message };
  }

  return { success: true };
}
