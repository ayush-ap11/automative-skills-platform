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

type AuState = (typeof AU_STATES)[number];

export const AU_STATE_NAMES: Record<AuState, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory",
};

export function getStateFullName(code?: string | null): string {
  if (!code) return "";
  return (AU_STATE_NAMES as Record<string, string>)[code] || code;
}

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
    invite_code: z
      .string()
      .trim()
      .min(1, "Organisation invite code is required."),
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
