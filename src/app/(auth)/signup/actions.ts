"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limiter";
import { signupSchema, type SignupInput } from "./schema";

export async function signupAction(input: SignupInput) {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: rateLimit.error };
  }

  const validation = signupSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid form submission.",
    };
  }

  const {
    full_name,
    preferred_name,
    email,
    mobile,
    state,
    invite_code,
    usi,
    password,
  } = validation.data;

  let userId: string;

  try {
    const admin = createAdminClient();

    // 1. Verify organisation invite code before creating any account rows
    const cleanCode = invite_code.trim();
    const { data: org, error: orgErr } = await admin
      .from("organisations")
      .select("id")
      .ilike("invite_code", cleanCode)
      .maybeSingle();

    if (orgErr || !org) {
      return {
        error: "Invalid invite code — check with your organisation.",
      };
    }

    const orgId = org.id;

    // 2. Create user with email pre-confirmed via admin client
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          preferred_name: preferred_name || null,
          mobile,
          role: "candidate",
          organisation_id: orgId,
        },
      });

    if (createError || !createData.user) {
      const msg = createError?.message || "";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        return {
          error:
            "An account with this email address already exists. Please log in with your password.",
        };
      }
      return {
        error: createError?.message || "Failed to create candidate account.",
      };
    }

    userId = createData.user.id;

    // 3. Establish session with normal server client
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) {
      return {
        error: signInErr.message || "Failed to sign in after registration.",
      };
    }

    // 4. Update profile with organisation_id and details
    await admin
      .from("profiles")
      .update({
        organisation_id: orgId,
        state,
        preferred_name: preferred_name || null,
        mobile,
        full_name,
      })
      .eq("id", userId);

    // 5. Upsert candidate profile with organisation_id
    const { data: candProfile } = await admin
      .from("candidate_profiles")
      .upsert(
        {
          profile_id: userId,
          organisation_id: orgId,
          usi: usi || null,
        },
        { onConflict: "profile_id" }
      )
      .select("id")
      .maybeSingle();

    // 6. Record privacy notice consent
    if (candProfile?.id) {
      await admin.from("consents").insert({
        candidate_profile_id: candProfile.id,
        consent_type: "privacy_notice",
        granted: true,
      });
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      error: err?.message || "Unexpected error during registration.",
    };
  }

  // Redirect directly to candidate dashboard
  redirect("/candidate/dashboard");
}
