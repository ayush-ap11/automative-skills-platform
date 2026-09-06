"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/utils/generate-password";

import { sendExaminerInviteEmail } from "@/lib/email/send-examiner-invite";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id)
    return { error: "Forbidden: Admin only" };
  return { supabase, user, orgId: profile.organisation_id };
}

export async function inviteExaminer(
  fullName: string,
  email: string,
  specialisationAreas: string[],
  maxActiveCandidates: number = 20,
) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.user || !auth.orgId) {
    return { error: auth.error || "Unauthorized" };
  }
  const { orgId, user, supabase } = auth;

  const name = fullName.trim();
  const mail = email.trim().toLowerCase();
  if (!name || !mail) return { error: "Full Name and Email are required." };

  try {
    const adminClient = createAdminClient();
    const tempPassword = generateTemporaryPassword();

    const { data: createData, error: createErr } =
      await adminClient.auth.admin.createUser({
        email: mail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: name, role: "examiner" },
      });

    if (createErr) {
      if (
        createErr.message.toLowerCase().includes("already") ||
        createErr.status === 422
      ) {
        return { error: `An account with ${mail} already exists.` };
      }
      return { error: createErr.message };
    }

    const newUserId = createData?.user?.id;
    if (!newUserId) return { error: "Failed to create invited user account." };

    const profilePayload: Record<string, unknown> = {
      id: newUserId,
      organisation_id: orgId,
      role: "examiner",
      full_name: name,
      email: mail,
      is_active: true,
    };

    let { error: profErr } = await adminClient
      .from("profiles")
      .upsert(profilePayload);
    if (profErr && profErr.message?.includes("is_active")) {
      delete profilePayload.is_active;
      const retry = await adminClient.from("profiles").upsert(profilePayload);
      profErr = retry.error;
    }
    if (profErr) return { error: profErr.message };

    const { error: exmErr } = await adminClient
      .from("examiner_profiles")
      .upsert(
        {
          profile_id: newUserId,
          specialisation_areas: specialisationAreas,
          max_active_candidates: maxActiveCandidates || 20,
        },
        { onConflict: "profile_id" },
      );
    if (exmErr) return { error: exmErr.message };

    // Fetch organisation name for email invite
    const { data: orgData } = await supabase
      .from("organisations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle();
    const orgName = orgData?.name || "Automotive Skills Assessment Platform";

    // Send examiner invite email via Brevo transactional API
    let emailSent = false;
    let emailWarning: string | null = null;
    try {
      const emailRes = await sendExaminerInviteEmail({
        toEmail: mail,
        toName: name,
        tempPassword,
        orgName,
      });

      if (emailRes.success) {
        emailSent = true;
      } else {
        emailWarning = emailRes.error || "Email could not be delivered.";
      }
    } catch (emailErr: any) {
      emailWarning = emailErr?.message || "Failed to send email invite.";
    }

    // Log the email send attempt (success/failure) to audit_logs table
    try {
      await adminClient.from("audit_logs").insert({
        actor_id: user.id,
        action: emailSent
          ? "examiner_invite_email_sent"
          : "examiner_invite_email_failed",
        entity_type: "examiner_profiles",
        entity_id: newUserId,
        previous_value: null,
        new_value: {
          recipient_email: mail,
          recipient_name: name,
          organisation_name: orgName,
          email_sent: emailSent,
          warning: emailWarning,
        },
      });
    } catch (auditErr) {
      console.error("[Audit Log Error]", auditErr);
    }

    return {
      success: true,
      temporaryPassword: tempPassword,
      emailSent,
      emailWarning,
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to invite examiner" };
  }
}

export async function resetUserPassword(profileId: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: target } = await supabase
    .from("profiles")
    .select("id, organisation_id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (
    !target ||
    target.organisation_id !== orgId ||
    target.role !== "examiner"
  ) {
    return { error: "Examiner not found or outside organisation." };
  }

  try {
    const newPassword = generateTemporaryPassword();
    const adminClient = createAdminClient();
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(
      profileId,
      {
        password: newPassword,
      },
    );
    if (updateErr) return { error: updateErr.message };

    return { success: true, newPassword };
  } catch (err: any) {
    return { error: err?.message || "Failed to reset password." };
  }
}

export async function updateExaminer(
  profileId: string,
  specialisationAreas: string[],
  maxActiveCandidates: number,
  isActive: boolean,
) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: target } = await supabase
    .from("profiles")
    .select("id, organisation_id, role")
    .eq("id", profileId)
    .maybeSingle();
  if (
    !target ||
    target.organisation_id !== orgId ||
    target.role !== "examiner"
  ) {
    return { error: "Examiner not found or outside organization." };
  }

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);
  if (
    profErr &&
    profErr.code !== "42703" &&
    !profErr.message?.includes("is_active")
  )
    return { error: profErr.message };

  const { data: exmRecord } = await supabase
    .from("examiner_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (exmRecord) {
    const { error: exmErr } = await supabase
      .from("examiner_profiles")
      .update({
        specialisation_areas: specialisationAreas,
        max_active_candidates: maxActiveCandidates,
      })
      .eq("profile_id", profileId);
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
