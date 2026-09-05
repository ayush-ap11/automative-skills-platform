import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidateManagementTable, AdminCandidateItem } from "@/components/admin/CandidateManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: rawExaminers },
    { data: rawCandidates },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, preferred_name").eq("role", "examiner").order("full_name", { ascending: true }),
    supabase.from("candidate_profiles").select(`
      id, current_role, years_experience, ev_experience, updated_at,
      profiles!inner (id, full_name, preferred_name, email, state, updated_at)
    `).order("created_at", { ascending: false }),
  ]);

  const examiners = (rawExaminers || []).map((e) => ({
    id: e.id,
    name: e.preferred_name || e.full_name || "Examiner",
  }));

  const candidateIds = (rawCandidates || []).map((c) => c.id);
  let assessments: any[] = [];
  let docs: any[] = [];

  if (candidateIds.length > 0) {
    const [resAssessments, resDocs] = await Promise.all([
      supabase.from("assessments").select(`
        id, candidate_profile_id, status, overall_score, assigned_at, updated_at,
        examiner:profiles!assessments_assigned_examiner_id_fkey(full_name, preferred_name),
        ev_readiness_scores(status, overall_score)
      `).in("candidate_profile_id", candidateIds).order("assigned_at", { ascending: false }),
      supabase.from("documents").select("candidate_profile_id, status").in("candidate_profile_id", candidateIds),
    ]);
    assessments = resAssessments.data || [];
    docs = resDocs.data || [];
  }

  const latestAssessmentMap = new Map<string, any>();
  for (const a of assessments) {
    if (!latestAssessmentMap.has(a.candidate_profile_id)) {
      latestAssessmentMap.set(a.candidate_profile_id, a);
    }
  }

  const docCountMap = new Map<string, { verified: number; total: number }>();
  for (const d of docs) {
    const cur = docCountMap.get(d.candidate_profile_id) || { verified: 0, total: 0 };
    cur.total += 1;
    if (d.status === "verified") cur.verified += 1;
    docCountMap.set(d.candidate_profile_id, cur);
  }

  const candidates: AdminCandidateItem[] = (rawCandidates || []).map((c) => {
    const p = c.profiles as any;
    const latestA = latestAssessmentMap.get(c.id);
    const ev = latestA?.ev_readiness_scores?.[0] || null;
    const counts = docCountMap.get(c.id) || { verified: 0, total: 0 };

    const dates = [
      c.updated_at ? new Date(c.updated_at).getTime() : 0,
      p?.updated_at ? new Date(p.updated_at).getTime() : 0,
      latestA?.updated_at ? new Date(latestA.updated_at).getTime() : 0,
      latestA?.assigned_at ? new Date(latestA.assigned_at).getTime() : 0,
    ];
    const lastActivityTime = Math.max(...dates, Date.now());

    return {
      id: c.id,
      name: p?.preferred_name || p?.full_name || "Unknown Candidate",
      email: p?.email || "",
      state: p?.state || null,
      currentRole: c.current_role,
      yearsExperience: c.years_experience,
      evExperience: Boolean(c.ev_experience),
      latestScore: latestA?.overall_score !== undefined && latestA?.overall_score !== null ? Number(latestA.overall_score) : null,
      evReadiness: ev ? { score: ev.overall_score ? Number(ev.overall_score) : null, status: ev.status || null } : null,
      evidence: counts,
      examinerName: latestA?.examiner?.preferred_name || latestA?.examiner?.full_name || null,
      status: latestA?.status || "not_started",
      lastActivity: new Date(lastActivityTime).toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Candidate Management</h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive roster of organization candidates, assessment progression, and evidence verification.
        </p>
      </div>

      <CandidateManagementTable candidates={candidates} examiners={examiners} />
    </div>
  );
}
