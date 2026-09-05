import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PracticalObservationList,
  PracticalObservationItem,
} from "@/components/examiner/PracticalObservationList";

export const dynamic = "force-dynamic";

export default async function ExaminerPracticalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawObservations } = await supabase
    .from("practical_observations")
    .select(`
      id,
      task_title,
      overall_rating,
      observed_at,
      assessments!inner (
        assigned_examiner_id,
        candidate_profiles (
          profiles (
            full_name,
            preferred_name
          )
        )
      )
    `)
    .eq("examiner_id", user.id)
    .order("observed_at", { ascending: false });

  const items: PracticalObservationItem[] = (rawObservations || []).map((obs: any) => {
    const cp = obs.assessments?.candidate_profiles;
    const p = cp?.profiles;
    const candidateName = p?.preferred_name || p?.full_name || "Unknown Candidate";
    return {
      id: obs.id,
      candidateName,
      taskTitle: obs.task_title,
      overallRating: obs.overall_rating || "not_demonstrated",
      observedAt: obs.observed_at,
    };
  });

  return <PracticalObservationList observations={items} />;
}
