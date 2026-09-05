"use server";

import { createClient } from "@/lib/supabase/server";
import {
  profileFormSchema,
  employmentHistorySchema,
  type ProfileFormValues,
  type EmploymentHistoryValues,
} from "./schema";

export async function updateProfile(data: ProfileFormValues) {
  const validation = profileFormSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const v = validation.data;
  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      preferred_name: v.preferred_name || null,
      mobile: v.mobile,
      state: v.state,
    })
    .eq("id", user.id);

  if (pErr) return { error: pErr.message };

  let score = 0;
  if (v.full_name) score += 10;
  if (v.mobile) score += 10;
  if (v.state) score += 10;
  if (v.location) score += 10;
  if (v.work_rights_status) score += 10;
  if (typeof v.years_experience === "number" && v.years_experience >= 0) score += 10;
  if (v.current_role) score += 10;
  if (v.specialisations?.length) score += 10;
  if (v.vehicle_categories?.length) score += 10;
  if (v.usi) score += 10;

  const { error: cErr } = await supabase.from("candidate_profiles").upsert(
    {
      profile_id: user.id,
      location: v.location || null,
      work_rights_status: v.work_rights_status || null,
      years_experience: v.years_experience ?? null,
      current_role: v.current_role || null,
      specialisations: v.specialisations || [],
      vehicle_categories: v.vehicle_categories || [],
      ev_experience: v.ev_experience ?? false,
      hybrid_experience: v.hybrid_experience ?? false,
      heavy_vehicle_experience: v.heavy_vehicle_experience ?? false,
      light_vehicle_experience: v.light_vehicle_experience ?? false,
      automotive_electrical_experience: v.automotive_electrical_experience ?? false,
      usi: v.usi || null,
      profile_completion_pct: score,
    },
    { onConflict: "profile_id" }
  );

  if (cErr) return { error: cErr.message };
  return { success: true, completion_pct: score };
}

export async function upsertEmploymentHistory(row: EmploymentHistoryValues) {
  const validation = employmentHistorySchema.safeParse(row);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Invalid role." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { data: cand } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cand) return { error: "Candidate profile not found." };

  const record = {
    candidate_profile_id: cand.id,
    employer_name: validation.data.employer_name,
    role_title: validation.data.role_title,
    start_date: validation.data.start_date,
    end_date: validation.data.end_date || null,
    description: validation.data.description || null,
  };

  if (validation.data.id) {
    const { error } = await supabase
      .from("employment_history")
      .update(record)
      .eq("id", validation.data.id);
    if (error) return { error: error.message };
    return { success: true, id: validation.data.id };
  }

  const { data: ins, error } = await supabase
    .from("employment_history")
    .insert(record)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: true, id: ins.id };
}

export async function deleteEmploymentHistory(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.from("employment_history").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
