"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        preferred_name: preferred_name || null,
        mobile,
        role: "candidate",
      },
    },
  });

  if (error || !data.user) {
    const msg = error?.message || "";
    if (msg.toLowerCase().includes("fetch failed") || msg.toLowerCase().includes("failed to fetch")) {
      return {
        error: "Unable to reach Supabase project (fetch failed). Please check that your Supabase project is active and unpaused, and that your project ref in .env is correct.",
      };
    }
    return {
      error: error?.message || "Failed to create candidate account.",
    };
  }

  // Update profile with state and details
  await supabase
    .from("profiles")
    .update({
      state,
      preferred_name: preferred_name || null,
      mobile,
      full_name,
    })
    .eq("id", data.user.id);

  // Upsert candidate profile
  const { data: candProfile } = await supabase
    .from("candidate_profiles")
    .upsert(
      {
        profile_id: data.user.id,
        usi: usi || null,
      },
      { onConflict: "profile_id" }
    )
    .select("id")
    .maybeSingle();

  // Record privacy notice consent
  if (candProfile?.id) {
    await supabase.from("consents").insert({
      candidate_profile_id: candProfile.id,
      consent_type: "privacy_notice",
      granted: true,
    });
  }

  if (data.session) {
    redirect("/candidate/dashboard");
  }

  return { status: "check_email" as const };
}
