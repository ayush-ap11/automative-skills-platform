"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema, type ResetPasswordInput } from "./schema";

export async function resetPasswordAction(input: ResetPasswordInput) {
  const validation = resetPasswordSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid input data.",
    };
  }

  const { password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: error.message || "Failed to update password.",
    };
  }

  redirect("/login?reset=success");
}
