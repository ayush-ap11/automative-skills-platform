import { z } from "zod";

export const AU_STATES = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
] as const;

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters."),
    preferred_name: z.string().trim().optional(),
    email: z.string().trim().email("Please enter a valid email address."),
    mobile: z.string().trim().min(8, "Please enter a valid mobile number."),
    state: z.enum(AU_STATES, {
      message: "Please select your Australian state/territory.",
    }),
    usi: z.string().trim().optional(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirm_password: z.string().min(6, "Please confirm your password."),
    privacy_consent: z.literal(true, {
      message: "You must accept the privacy notice to register.",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
