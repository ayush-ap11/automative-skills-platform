"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signupOrganisationSchema,
  type SignupOrganisationInput,
} from "./schema";

export async function createOrganisationAccount(data: SignupOrganisationInput) {
  const validation = signupOrganisationSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid form data.",
    };
  }

  const { org_name, full_name, email, password } = validation.data;
  let userId: string;
  let orgId: string;

  try {
    const admin = createAdminClient();

    // 1. Create admin user with email pre-confirmed
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: "admin",
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
            "An account with this email address already exists. Please log in with your credentials.",
        };
      }
      return {
        error: createError?.message || "Failed to create administrator account.",
      };
    }

    userId = createData.user.id;

    // 2. Establish session on the client
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) {
      return {
        error: signInErr.message || "Failed to sign in after account creation.",
      };
    }

    // 3. Insert new organisation
    const { data: newOrg, error: orgError } = await admin
      .from("organisations")
      .insert({ name: org_name })
      .select("id")
      .single();

    if (orgError || !newOrg) {
      return {
        error: orgError?.message || "Failed to create organisation profile.",
      };
    }

    orgId = newOrg.id;

    // 4. Update the admin's profile row to role='admin' and organisation_id
    await admin
      .from("profiles")
      .update({
        role: "admin",
        organisation_id: orgId,
        full_name,
      })
      .eq("id", userId);

    // 5. Insert default system_settings for the new organisation
    await admin.from("system_settings").insert({
      organisation_id: orgId,
      framework_version: "AUR Release 9.0",
      passing_threshold: 60,
      retention_policy_days: 2555,
    });

    // 6. Insert privacy notice consent record
    await admin.from("consents").insert({
      profile_id: userId,
      consent_type: "privacy_notice",
      granted: true,
    });
  } catch (err: any) {
    // Re-throw Next.js redirect errors
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      error: err?.message || "Unexpected error during organisation registration.",
    };
  }

  // Redirect directly to admin dashboard
  redirect("/admin");
}
