"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, type ForgotPasswordInput } from "./schema";

export async function forgotPasswordAction(input: ForgotPasswordInput) {
  const validation = forgotPasswordSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid email address.",
    };
  }

  const { email } = validation.data;
  const headerList = await headers();
  const origin = headerList.get("origin") || "";
  const redirectTo = origin ? `${origin}/reset-password` : undefined;

  const supabase = await createClient();

  // Attempt password reset, always returning generic success (no account enumeration)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { success: true };
}
