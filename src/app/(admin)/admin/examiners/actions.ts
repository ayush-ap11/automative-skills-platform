"use server";

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

export async function inviteExaminer(
  fullName: string,
  email: string,
  specialisationAreas: string[],
  maxActiveCandidates: number = 20
) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.orgId) return { error: auth.error };
  const { orgId } = auth;

  const name = fullName.trim();
  const mail = email.trim().toLowerCase();
  if (!name || !mail) return { error: "Full Name and Email are required." };

  try {
    const adminClient = createAdminClient();
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(mail, {
      data: { full_name: name, role: "examiner" },
    });

    if (inviteErr) {
      if (inviteErr.message.toLowerCase().includes("already") || inviteErr.status === 422) {
        return { error: `An account with ${mail} already exists.` };
      }
      return { error: inviteErr.message };
    }

    const newUserId = inviteData?.user?.id;
    if (!newUserId) return { error: "Failed to create invited user account." };

    const profilePayload: Record<string, unknown> = {
      id: newUserId,
      organisation_id: orgId,
      role: "examiner",
      full_name: name,
      email: mail,
      is_active: true,
    };

    let { error: profErr } = await adminClient.from("profiles").upsert(profilePayload);
    if (profErr && profErr.message?.includes("is_active")) {
      delete profilePayload.is_active;
      const retry = await adminClient.from("profiles").upsert(profilePayload);
      profErr = retry.error;
    }
    if (profErr) return { error: profErr.message };

    const { error: exmErr } = await adminClient.from("examiner_profiles").upsert({
      profile_id: newUserId,
      specialisation_areas: specialisationAreas,
      max_active_candidates: maxActiveCandidates || 20,
    }, { onConflict: "profile_id" });
    if (exmErr) return { error: exmErr.message };

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to invite examiner" };
  }
}

export async function updateExaminer(
  profileId: string,
  specialisationAreas: string[],
  maxActiveCandidates: number,
  isActive: boolean
) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: target } = await supabase.from("profiles").select("id, organisation_id, role").eq("id", profileId).maybeSingle();
  if (!target || target.organisation_id !== orgId || target.role !== "examiner") {
    return { error: "Examiner not found or outside organization." };
  }

  const { error: profErr } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (profErr && profErr.code !== "42703" && !profErr.message?.includes("is_active")) return { error: profErr.message };

  const { data: exmRecord } = await supabase.from("examiner_profiles").select("id").eq("profile_id", profileId).maybeSingle();
  if (exmRecord) {
    const { error: exmErr } = await supabase.from("examiner_profiles").update({
      specialisation_areas: specialisationAreas,
      max_active_candidates: maxActiveCandidates,
    }).eq("profile_id", profileId);
    if (exmErr) return { error: exmErr.message };
  } else {
    const { error: exmErr } = await supabase.from("examiner_profiles").insert({
      profile_id: profileId,
      specialisation_areas: specialisationAreas,
      max_active_candidates: maxActiveCandidates,
    });
    if (exmErr) return { error: exmErr.message };
  }

  return { success: true };
}
