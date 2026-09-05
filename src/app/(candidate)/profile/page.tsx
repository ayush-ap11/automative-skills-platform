import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/candidate/ProfileForm";
import { EmploymentHistoryEditor } from "@/components/candidate/EmploymentHistoryEditor";
import type {
  ProfileFormValues,
  EmploymentHistoryValues,
} from "./schema";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_name, email, mobile, state")
    .eq("id", user.id)
    .maybeSingle();

  // 2. Fetch candidate profile
  const { data: candProfile } = await supabase
    .from("candidate_profiles")
    .select(
      "id, location, work_rights_status, years_experience, current_role, specialisations, vehicle_categories, ev_experience, hybrid_experience, heavy_vehicle_experience, light_vehicle_experience, automotive_electrical_experience, usi, profile_completion_pct"
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  // 3. Fetch employment history
  let employmentRows: EmploymentHistoryValues[] = [];
  if (candProfile?.id) {
    const { data: history } = await supabase
      .from("employment_history")
      .select(
        "id, employer_name, role_title, start_date, end_date, description"
      )
      .eq("candidate_profile_id", candProfile.id)
      .order("start_date", { ascending: false });

    if (history) {
      employmentRows = history.map((h) => ({
        id: h.id,
        employer_name: h.employer_name || "",
        role_title: h.role_title || "",
        start_date: h.start_date || "",
        end_date: h.end_date || null,
        description: h.description || "",
      }));
    }
  }

  const initialFormData: ProfileFormValues = {
    full_name: profile?.full_name || "",
    preferred_name: profile?.preferred_name || "",
    email: profile?.email || user.email || "",
    mobile: profile?.mobile || "",
    state: (profile?.state as any) || "NSW",
    location: candProfile?.location || "",
    work_rights_status: candProfile?.work_rights_status || "",
    years_experience: candProfile?.years_experience ?? undefined,
    current_role: candProfile?.current_role || "",
    specialisations: candProfile?.specialisations || [],
    vehicle_categories: candProfile?.vehicle_categories || [],
    ev_experience: candProfile?.ev_experience ?? false,
    hybrid_experience: candProfile?.hybrid_experience ?? false,
    heavy_vehicle_experience: candProfile?.heavy_vehicle_experience ?? false,
    light_vehicle_experience: candProfile?.light_vehicle_experience ?? false,
    automotive_electrical_experience:
      candProfile?.automotive_electrical_experience ?? false,
    usi: candProfile?.usi || "",
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintain your personal details, trade experience, and automotive
          employment history.
        </p>
      </div>

      <ProfileForm
        initialData={initialFormData}
        initialCompletionPct={candProfile?.profile_completion_pct || 0}
      />

      <EmploymentHistoryEditor initialRows={employmentRows} />
    </div>
  );
}
