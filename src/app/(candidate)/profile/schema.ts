import { z } from "zod";
import { AU_STATES } from "@/app/(auth)/signup/schema";

export const profileFormSchema = z.object({
  // 1. Personal Details
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  preferred_name: z.string().trim().optional(),
  email: z.string().email(),
  mobile: z.string().trim().min(8, "Valid mobile number is required."),
  state: z.enum(AU_STATES, {
    message: "Please select your Australian state/territory.",
  }),
  location: z.string().trim().optional(),

  // 2. Work Rights
  work_rights_status: z.string().trim().optional(),

  // 3. Automotive Experience
  years_experience: z.coerce.number().min(0).max(60).optional(),
  current_role: z.string().trim().optional(),
  specialisations: z.array(z.string()).optional(),
  vehicle_categories: z.array(z.string()).optional(),
  ev_experience: z.boolean().optional(),
  hybrid_experience: z.boolean().optional(),
  heavy_vehicle_experience: z.boolean().optional(),
  light_vehicle_experience: z.boolean().optional(),
  automotive_electrical_experience: z.boolean().optional(),

  // 4. USI
  usi: z.string().trim().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const employmentHistorySchema = z.object({
  id: z.string().uuid().optional(),
  employer_name: z.string().trim().min(1, "Employer name is required."),
  role_title: z.string().trim().min(1, "Role title is required."),
  start_date: z.string().min(1, "Start date is required."),
  end_date: z.string().nullable().optional(),
  description: z.string().trim().optional(),
});

export type EmploymentHistoryValues = z.infer<typeof employmentHistorySchema>;
