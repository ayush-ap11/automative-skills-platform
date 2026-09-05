import { z } from "zod";

export const signupOrganisationSchema = z
  .object({
    org_name: z
      .string()
      .trim()
      .min(2, "Organisation name must be at least 2 characters."),
    full_name: z
      .string()
      .trim()
      .min(2, "Admin full name must be at least 2 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
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

export type SignupOrganisationInput = z.infer<typeof signupOrganisationSchema>;
