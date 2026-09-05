"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, type LoginInput } from "./schema";

export async function loginAction(input: LoginInput) {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid input data.",
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Auto-confirm unconfirmed accounts on the fly so verification is never required
  if (error && error.message.toLowerCase().includes("email not confirmed")) {
    try {
      const admin = createAdminClient();
      const { data: userData } = await admin.auth.admin.listUsers();
      const existingUser = userData?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existingUser) {
        await admin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        });
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = retry.data;
        error = retry.error;
      }
    } catch {
      // Continue with original error if admin confirmation fails
    }
  }

  if (error || !data.user) {
    const msg = error?.message || "";
    if (
      msg.toLowerCase().includes("fetch failed") ||
      msg.toLowerCase().includes("failed to fetch")
    ) {
      return {
        error:
          "Unable to reach Supabase project (fetch failed). Please check that your Supabase project is active and unpaused, and that your project ref in .env is correct.",
      };
    }
    return {
      error: error?.message || "Invalid email or password.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin");
  } else if (profile?.role === "examiner") {
    redirect("/examiner/dashboard");
  } else {
    redirect("/candidate/dashboard");
  }
}
