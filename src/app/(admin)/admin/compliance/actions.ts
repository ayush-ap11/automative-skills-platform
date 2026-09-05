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

export async function updateFrameworkVersion(version: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;
  const v = version.trim();
  if (!v) return { error: "Framework version cannot be empty." };

  const { data: existing } = await supabase.from("system_settings").select("id").eq("organisation_id", orgId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("system_settings").update({ framework_version: v, updated_at: new Date().toISOString() }).eq("organisation_id", orgId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("system_settings").insert({ organisation_id: orgId, framework_version: v });
    if (error) return { error: error.message };
  }
  return { success: true };
}

export async function upsertStateRequirement(id: string | null, state: string, appliesTo: string, requirementText: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error };
  const { supabase } = auth;

  const st = state.trim();
  const text = requirementText.trim();
  if (!st || !text) return { error: "State and Requirement text are required." };

  const payload = {
    state: st as any,
    applies_to: appliesTo.trim() || null,
    requirement_text: text,
  };

  if (id) {
    const { error } = await supabase.from("state_requirements").update(payload).eq("id", id);
    if (error) return { error: error.message };
    return { success: true, id };
  }
  const { data: ins, error } = await supabase.from("state_requirements").insert(payload).select("id").single();
  if (error || !ins) return { error: error?.message || "Failed to create state requirement" };
  return { success: true, id: ins.id };
}

export async function deleteStateRequirement(id: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("state_requirements").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
