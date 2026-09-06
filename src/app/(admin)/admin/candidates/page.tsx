import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CandidateManagementTable,
  AdminCandidateItem,
} from "@/components/admin/CandidateManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: rawExaminers }, { data: rawCandidates }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, preferred_name")
      .eq("role", "examiner")
      .order("full_name", { ascending: true }),
    supabase
      .from("candidate_profiles")
      .select(`
        id, current_role, years_experience, ev_experience, updated_at,
        profiles!inner (id, full_name, preferred_name, email, state, updated_at)
      `)
      .order("created_at", { ascending: false }),
  ]);

  const examiners = (rawExaminers || []).map((e) => ({
    id: e.id,
    name: e.preferred_name || e.full_name || "Examiner",
  }));

  const candidateIds = (rawCandidates || []).map((c) => c.id);
  let assessments: any[] = [];
  let docs: any[] = [];
  let empHistory: any[] = [];
  let reviews: any[] = [];

  if (candidateIds.length > 0) {
    const [resAssessments, resDocs, resEmpHistory, resReviews] =
      await Promise.all([
        supabase
          .from("assessments")
          .select(`
            id, candidate_profile_id, status, overall_score, ev_readiness_score, assigned_at, completed_at,
            examiner:profiles!assessments_assigned_examiner_id_fkey(id, full_name, preferred_name)
          `)
          .in("candidate_profile_id", candidateIds)
          .order("assigned_at", { ascending: false }),
        supabase
          .from("documents")
          .select("candidate_profile_id, status")
          .in("candidate_profile_id", candidateIds),
        supabase
          .from("employment_history")
          .select("candidate_profile_id, role_title, start_date, end_date")
          .in("candidate_profile_id", candidateIds)
          .order("start_date", { ascending: false }),
        supabase
          .from("examiner_reviews")
          .select(`
            examiner_id,
            examiner:profiles!examiner_reviews_examiner_id_fkey(id, full_name, preferred_name),
            candidate_answers!inner(assessment_id, assessments!inner(candidate_profile_id))
          `),
      ]);
    assessments = resAssessments.data || [];
    docs = resDocs.data || [];
    empHistory = resEmpHistory.data || [];
    reviews = resReviews.data || [];
  }

  const latestAssessmentMap = new Map<string, any>();
  const allAssessmentsByCandidate = new Map<string, any[]>();
  for (const a of assessments) {
    if (!latestAssessmentMap.has(a.candidate_profile_id)) {
      latestAssessmentMap.set(a.candidate_profile_id, a);
    }
    const list = allAssessmentsByCandidate.get(a.candidate_profile_id) || [];
    list.push(a);
    allAssessmentsByCandidate.set(a.candidate_profile_id, list);
  }

  const empHistoryMap = new Map<string, string>();
  for (const h of empHistory) {
    if (!empHistoryMap.has(h.candidate_profile_id) && h.role_title?.trim()) {
      empHistoryMap.set(h.candidate_profile_id, h.role_title.trim());
    }
  }

  const docCountMap = new Map<string, { verified: number; total: number }>();
  for (const d of docs) {
    const cur = docCountMap.get(d.candidate_profile_id) || {
      verified: 0,
      total: 0,
    };
    cur.total += 1;
    if (d.status === "verified") cur.verified += 1;
    docCountMap.set(d.candidate_profile_id, cur);
  }

  const reviewExaminerMap = new Map<string, any>();
  for (const r of reviews) {
    const cpId = (r as any).candidate_answers?.assessments?.candidate_profile_id;
    if (cpId && !reviewExaminerMap.has(cpId) && (r as any).examiner) {
      reviewExaminerMap.set(cpId, (r as any).examiner);
    }
  }

  const candidates: AdminCandidateItem[] = (rawCandidates || []).map((c) => {
    const p = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) as any;
    const latestA = latestAssessmentMap.get(c.id);
    const candidateAssessments = allAssessmentsByCandidate.get(c.id) || [];
    const counts = docCountMap.get(c.id) || { verified: 0, total: 0 };

    // 1. Role & Job Title: from candidate_profiles, fallback to latest employment_history
    const currentRole =
      c.current_role?.trim() || empHistoryMap.get(c.id) || null;

    // 2. Years of experience
    const yearsExperience =
      c.years_experience !== undefined && c.years_experience !== null
        ? Number(c.years_experience)
        : null;

    // 3. Assessment Score
    const latestScore =
      latestA?.overall_score !== undefined && latestA?.overall_score !== null
        ? Math.round(Number(latestA.overall_score))
        : null;

    // 4. EV Readiness: score & status calculation
    const evScore =
      latestA?.ev_readiness_score !== undefined &&
      latestA?.ev_readiness_score !== null
        ? Number(latestA.ev_readiness_score)
        : null;
    const evStatus =
      evScore !== null
        ? evScore >= 75
          ? "Strong"
          : evScore >= 50
            ? "Developing"
            : "Significant Gap"
        : null;
    const evReadinessDisplay =
      evScore !== null ? `${Math.round(evScore)}% – ${evStatus}` : null;

    // 5. Examiner: priority to latest assessment, fallback to other assessments, fallback to reviews
    let examinerObj = (
      Array.isArray(latestA?.examiner) ? latestA.examiner[0] : latestA?.examiner
    ) as any;
    if (!examinerObj?.id) {
      const otherWithExaminer = candidateAssessments.find(
        (a: any) =>
          (Array.isArray(a.examiner) ? a.examiner[0] : a.examiner)?.id,
      );
      if (otherWithExaminer) {
        examinerObj = Array.isArray(otherWithExaminer.examiner)
          ? otherWithExaminer.examiner[0]
          : otherWithExaminer.examiner;
      }
    }
    if (!examinerObj?.id) {
      examinerObj = reviewExaminerMap.get(c.id) || null;
    }

    const examinerName =
      examinerObj?.full_name || examinerObj?.preferred_name || null;

    // 6. Pipeline stage: Registered -> Documents Submitted -> Assessment In Progress -> Pending Review -> Finalised
    let pipelineStatus = "registered";
    if (latestA) {
      if (latestA.status === "completed") {
        pipelineStatus = "finalised";
      } else if (
        latestA.status === "submitted" ||
        latestA.status === "under_review"
      ) {
        pipelineStatus = "pending_review";
      } else if (latestA.status === "in_progress") {
        pipelineStatus = "in_progress";
      } else {
        pipelineStatus =
          counts.total > 0 ? "documents_submitted" : "registered";
      }
    } else {
      pipelineStatus = counts.total > 0 ? "documents_submitted" : "registered";
    }

    const dates = [
      c.updated_at ? new Date(c.updated_at).getTime() : 0,
      p?.updated_at ? new Date(p.updated_at).getTime() : 0,
      latestA?.completed_at ? new Date(latestA.completed_at).getTime() : 0,
      latestA?.assigned_at ? new Date(latestA.assigned_at).getTime() : 0,
    ].filter((t) => t > 0);
    const lastActivityTime = dates.length > 0 ? Math.max(...dates) : Date.now();

    return {
      id: c.id,
      name: p?.preferred_name || p?.full_name || "Unknown Candidate",
      email: p?.email || "",
      state: p?.state || null,
      currentRole,
      yearsExperience,
      evExperience: Boolean(c.ev_experience),
      latestScore,
      evReadinessDisplay,
      evReadiness:
        evScore !== null || evStatus !== null
          ? { score: evScore, status: evStatus }
          : null,
      evidence: counts,
      examinerId: examinerObj?.id || null,
      examinerName,
      status: pipelineStatus,
      latestAssessmentId: latestA?.id || null,
      lastActivity: new Date(lastActivityTime).toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidate Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive roster of organization candidates, assessment
          progression, and evidence verification.
        </p>
      </div>

      <CandidateManagementTable candidates={candidates} examiners={examiners} />
    </div>
  );
}
