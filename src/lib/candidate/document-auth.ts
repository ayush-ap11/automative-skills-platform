import { SupabaseClient } from "@supabase/supabase-js";

export async function canViewDocument(
  supabase: SupabaseClient,
  doc: { is_sensitive: boolean; candidate_profile_id: string },
  candidateProfile: { profile_id: string; profiles?: { organisation_id: string | null } | null },
  userId: string
): Promise<boolean> {
  if (candidateProfile.profile_id === userId) return true;

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", userId)
    .single();

  if (!viewer) return false;

  if (viewer.role === "admin") {
    return viewer.organisation_id === candidateProfile.profiles?.organisation_id;
  }

  if (viewer.role === "examiner") {
    if (doc.is_sensitive) return false;
    const { data: assigned } = await supabase
      .from("assessments")
      .select("id")
      .eq("candidate_profile_id", doc.candidate_profile_id)
      .eq("assigned_examiner_id", userId)
      .maybeSingle();
    return !!assigned;
  }

  return false;
}
