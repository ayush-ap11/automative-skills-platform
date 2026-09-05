"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupSchema, type SignupInput } from "./schema";

export async function signupAction(input: SignupInput) {
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
    usi,
    password,
  } = validation.data;

  let userId: string;

  try {
    const admin = createAdminClient();

    // Create user with email pre-confirmed so no verification email or magic link is sent
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
      if (
        msg.toLowerCase().includes("fetch failed") ||
        msg.toLowerCase().includes("failed to fetch")
      ) {
        return {
          error:
            "Unable to reach Supabase project (fetch failed). Please check that your Supabase project is active and unpaused.",
        };
      }
      return {
        error: createError?.message || "Failed to create candidate account.",
      };
    }

    userId = createData.user.id;

    // Update profile with state and details
    await admin
      .from("profiles")
      .update({
        state,
        preferred_name: preferred_name || null,
        mobile,
        full_name,
      })
      .eq("id", userId);

    // Upsert candidate profile
    const { data: candProfile } = await admin
      .from("candidate_profiles")
      .upsert(
        {
          profile_id: userId,
          usi: usi || null,
        },
        { onConflict: "profile_id" }
      )
      .select("id")
      .maybeSingle();

    // Record privacy notice consent
    if (candProfile?.id) {
      await admin.from("consents").insert({
        candidate_profile_id: candProfile.id,
        consent_type: "privacy_notice",
        granted: true,
      });
    }
  } catch (err: any) {
    return {
      error: err?.message || "Unexpected error during registration.",
    };
  }

  // Seamlessly redirect candidate to log in with their email and password
  redirect(`/login?registered=true&email=${encodeURIComponent(email)}`);
}
