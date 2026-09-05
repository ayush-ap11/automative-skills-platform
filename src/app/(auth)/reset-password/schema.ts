import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirm_password: z.string().min(6, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
