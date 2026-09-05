import { SupabaseClient } from "@supabase/supabase-js";

export interface AdminDashboardData {
  kpis: {
    totalCandidates: number;
    activeAssessments: number;
    completedAssessments: number;
    pendingReviews: number;
    averageScore: string;
    evReadyPct: string;
    competentPct: string;
    docsAwaitingVerification: number;
    aiFlags: number;
    safetyFlags: number;
  };
  pipelineFunnel: Array<{ stage: string; count: number }>;
  skillsDistribution: Array<{ category: string; averageScore: number }>;
  evReadinessDistribution: Array<{ status: string; label: string; count: number; color: string }>;
  performanceByState: Array<{ state: string; averageScore: number; count: number }>;
}

export async function fetchAdminDashboardData(supabase: SupabaseClient): Promise<AdminDashboardData> {
  const [
    { count: candidateCount },
    { data: assessments },
    { data: evScores },
    { count: pendingDocsCount },
    { data: docsWithCandidate },
    { data: safetyAnalyses },
    { data: answeredReviews },
  ] = await Promise.all([
    supabase.from("candidate_profiles").select("id", { count: "exact", head: true }),
    supabase.from("assessments").select(`
      id, status, outcome, overall_score, candidate_profile_id,
      candidate_profiles (profiles (state))
    `),
    supabase.from("ev_readiness_scores").select("status"),
    supabase.from("documents").select("id", { count: "exact", head: true })
      .in("status", ["uploaded", "ai_extracted", "pending_review"]).eq("is_sensitive", false),
    supabase.from("documents").select("candidate_profile_id"),
    supabase.from("ai_analyses").select(`
      id, critical_safety_flag, candidate_answer_id,
      candidate_answers!inner(assessment_id)
    `).eq("critical_safety_flag", true),
    supabase.from("examiner_reviews").select(`
      candidate_answer_id, final_score,
      candidate_answers!inner(
        question_id, assessment_id,
        questions(skill_category),
        assessments!inner(status)
      )
    `),
  ]);

  const allAssessments = assessments || [];
  const totalCandidates = candidateCount || 0;
  const activeAssessments = allAssessments.filter((a) => ["in_progress", "submitted", "under_review"].includes(a.status)).length;
  const completed = allAssessments.filter((a) => a.status === "completed");
  const completedAssessments = completed.length;
  const pendingReviews = allAssessments.filter((a) => a.status === "submitted").length;

  const validScores = completed.map((a) => Number(a.overall_score)).filter((s) => !isNaN(s) && s > 0);
  const averageScore = validScores.length > 0
    ? `${Math.round(validScores.reduce((acc, v) => acc + v, 0) / validScores.length)}%`
    : "—";

  const allEv = evScores || [];
  const strongEvCount = allEv.filter((e) => e.status === "strong").length;
  const evReadyPct = allEv.length > 0 ? `${Math.round((strongEvCount / allEv.length) * 100)}%` : "0%";

  const competentCount = completed.filter((a) => a.outcome === "competent").length;
  const competentPct = completed.length > 0
    ? `${Math.round((competentCount / completed.length) * 100)}% / ${Math.round(((completed.length - competentCount) / completed.length) * 100)}%`
    : "—";

  const reviewedAnswerIds = new Set((answeredReviews || []).map((r) => r.candidate_answer_id));
  const aiFlags = (safetyAnalyses || []).filter((a) => !reviewedAnswerIds.has(a.candidate_answer_id)).length;

  const flaggedAssessmentIds = new Set(
    (safetyAnalyses || []).map((a: any) => a.candidate_answers?.assessment_id).filter(Boolean)
  );
  const safetyFlags = flaggedAssessmentIds.size;

  const docsCandidates = new Set((docsWithCandidate || []).map((d) => d.candidate_profile_id));
  const assessmentCandidates = new Set(allAssessments.filter((a) => a.status !== "not_started").map((a) => a.candidate_profile_id));
  const reviewCandidates = new Set(allAssessments.filter((a) => ["submitted", "under_review"].includes(a.status)).map((a) => a.candidate_profile_id));
  const finalisedCandidates = new Set(completed.map((a) => a.candidate_profile_id));

  const pipelineFunnel = [
    { stage: "Registered", count: totalCandidates },
    { stage: "Documents", count: docsCandidates.size },
    { stage: "Assessment", count: assessmentCandidates.size },
    { stage: "Review", count: reviewCandidates.size },
    { stage: "Finalised", count: finalisedCandidates.size },
  ];

  const skillGroups: Record<string, { total: number; count: number }> = {};
  for (const r of answeredReviews || []) {
    const rawCategory = (r as any).candidate_answers?.questions?.skill_category;
    const isCompleted = (r as any).candidate_answers?.assessments?.status === "completed";
    if (rawCategory && isCompleted && r.final_score !== null) {
      const cat = rawCategory.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      if (!skillGroups[cat]) skillGroups[cat] = { total: 0, count: 0 };
      skillGroups[cat].total += Number(r.final_score);
      skillGroups[cat].count += 1;
    }
  }
  const skillsDistribution = Object.entries(skillGroups).map(([category, d]) => ({
    category,
    averageScore: Math.round(d.total / d.count),
  }));

  const evCounts = { strong: 0, developing: 0, significant_gap: 0, insufficient_evidence: 0 };
  for (const row of allEv) {
    if (row.status && row.status in evCounts) {
      evCounts[row.status as keyof typeof evCounts]++;
    }
  }
  const evReadinessDistribution = [
    { status: "strong", label: "Strong Readiness", count: evCounts.strong, color: "var(--success)" },
    { status: "developing", label: "Developing", count: evCounts.developing, color: "var(--warning)" },
    { status: "significant_gap", label: "Significant Gap", count: evCounts.significant_gap, color: "var(--destructive)" },
    { status: "insufficient_evidence", label: "Insufficient Evidence", count: evCounts.insufficient_evidence, color: "var(--muted-foreground)" },
  ];

  const stateGroups: Record<string, { total: number; count: number }> = {};
  for (const a of completed) {
    const state = (a.candidate_profiles as any)?.profiles?.state || "Unknown";
    const score = Number(a.overall_score);
    if (!isNaN(score) && score > 0) {
      if (!stateGroups[state]) stateGroups[state] = { total: 0, count: 0 };
      stateGroups[state].total += score;
      stateGroups[state].count += 1;
    }
  }
  const performanceByState = Object.entries(stateGroups).map(([state, d]) => ({
    state,
    averageScore: Math.round(d.total / d.count),
    count: d.count,
  }));

  return {
    kpis: {
      totalCandidates,
      activeAssessments,
      completedAssessments,
      pendingReviews,
      averageScore,
      evReadyPct,
      competentPct,
      docsAwaitingVerification: pendingDocsCount || 0,
      aiFlags,
      safetyFlags,
    },
    pipelineFunnel,
    skillsDistribution,
    evReadinessDistribution,
    performanceByState,
  };
}
