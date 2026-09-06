"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) return { error: "Forbidden: Admin only" };

  return { supabase, user, orgId: profile.organisation_id };
}

export async function updateOrganisation(name: string, primaryColor: string, secondaryColor: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const trimmed = name.trim();
  if (!trimmed) return { error: "Organisation name cannot be empty." };

  const { error } = await supabase.from("organisations").update({
    name: trimmed,
    primary_color: primaryColor.trim() || null,
    secondary_color: secondaryColor.trim() || null,
  }).eq("id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadLogo(formData: FormData): Promise<{ success?: boolean; url?: string; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.orgId) return { error: auth.error };
  const { orgId } = auth;

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
  if (!allowed.includes(file.type)) return { error: "Invalid format: PNG, JPG, or SVG only." };
  if (file.size > 2 * 1024 * 1024) return { error: "File exceeds 2MB size limit." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${orgId}/logo.${ext}`;

  try {
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("org-branding")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (upErr) return { error: upErr.message };

    const { data: pubData } = admin.storage.from("org-branding").getPublicUrl(path);
    const logoUrl = `${pubData.publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await admin.from("organisations").update({ logo_url: logoUrl }).eq("id", orgId);
    if (dbErr) return { error: dbErr.message };

    return { success: true, url: logoUrl };
  } catch (err: any) {
    return { error: err?.message || "Failed to upload logo." };
  }
}

export async function updateScoringConfig(passingThreshold: number, categoryWeights: Record<string, number>) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const threshold = Math.min(100, Math.max(0, Number(passingThreshold) || 60));
  const payload = { passing_threshold: threshold, category_weights: categoryWeights, updated_at: new Date().toISOString() };

  const { data: existing } = await supabase.from("system_settings").select("id").eq("organisation_id", orgId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("system_settings").update(payload).eq("organisation_id", orgId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("system_settings").insert({ organisation_id: orgId, ...payload });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function updateRetentionPolicy(days: number) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const retentionDays = Math.max(1, Number(days) || 2555);
  const payload = { retention_policy_days: retentionDays, updated_at: new Date().toISOString() };

  const { data: existing } = await supabase.from("system_settings").select("id").eq("organisation_id", orgId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("system_settings").update(payload).eq("organisation_id", orgId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("system_settings").insert({ organisation_id: orgId, ...payload });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function regenerateInviteCode(): Promise<{ success?: boolean; newCode?: string; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const newCode = randomBytes(4).toString("hex").toLowerCase();
  const { error } = await supabase
    .from("organisations")
    .update({ invite_code: newCode })
    .eq("id", orgId);

  if (error) return { error: error.message };
  return { success: true, newCode };
}
