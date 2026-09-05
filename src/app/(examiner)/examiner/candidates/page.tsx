import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CandidateQueueList,
  CandidateQueueItem,
} from "@/components/examiner/CandidateQueueList";

export const dynamic = "force-dynamic";

export default async function MyCandidatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      id,
      candidate_profile_id,
      status,
      overall_score,
      ev_readiness_score,
      assigned_at,
      candidate_profiles (
        id,
        years_experience,
        current_role,
        ev_experience,
        profiles (
          full_name,
          preferred_name
        )
      )
    `)
    .order("assigned_at", { ascending: false });

  const candidateMap = new Map<string, { profile: any; latestAssessment: any }>();
  for (const a of assessments || []) {
    if (!a.candidate_profile_id || !a.candidate_profiles) continue;
    if (!candidateMap.has(a.candidate_profile_id)) {
      candidateMap.set(a.candidate_profile_id, {
        profile: a.candidate_profiles,
        latestAssessment: a,
      });
    }
  }

  const candidateIds = Array.from(candidateMap.keys());
  const docCounts = new Map<string, { verified: number; total: number }>();

  if (candidateIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("candidate_profile_id, category, status")
      .in("candidate_profile_id", candidateIds);

    for (const doc of docs || []) {
      const cur = docCounts.get(doc.candidate_profile_id) || { verified: 0, total: 0 };
      cur.total += 1;
      if (doc.status === "verified") cur.verified += 1;
      docCounts.set(doc.candidate_profile_id, cur);
    }
  }

  const items: CandidateQueueItem[] = Array.from(candidateMap.values()).map(
    ({ profile, latestAssessment }) => {
      const p = profile.profiles;
      const name = p?.preferred_name || p?.full_name || "Unknown Candidate";
      const counts = docCounts.get(profile.id) || { verified: 0, total: 0 };
      return {
        id: profile.id,
        name,
        years_experience: profile.years_experience,
        current_role: profile.current_role,
        has_ev_experience: Boolean(profile.ev_experience),
        overall_score: latestAssessment.overall_score,
        latest_status: latestAssessment.status,
        evidence_completeness: counts,
      };
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Candidates
        </h1>
        <p className="text-sm text-muted-foreground">
          Assigned candidates undergoing vocational and safety competency assessments.
        </p>
      </div>

      <CandidateQueueList candidates={items} />
    </div>
  );
}
