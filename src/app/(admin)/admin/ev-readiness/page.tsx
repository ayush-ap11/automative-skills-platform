import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminEVReadinessView, CategoryAverage, CandidateEVScoreItem } from "@/components/admin/AdminEVReadinessView";
import { EVReadinessStatusData } from "@/components/admin/EVReadinessChart";

export const dynamic = "force-dynamic";

export default async function AdminEVReadinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: scoresData } = await supabase
    .from("ev_readiness_scores")
    .select(`
      id, ev_knowledge, hv_safety_awareness, diagnostics, practical_evidence,
      training_evidence, verbal_reasoning, overall_score, status, generated_at,
      assessments!inner (
        id, candidate_profile_id,
        candidate_profiles!inner (
          id, profiles!inner ( id, full_name, organisation_id )
        )
      )
    `)
    .eq("assessments.candidate_profiles.profiles.organisation_id", orgId)
    .order("generated_at", { ascending: false });

  const total = scoresData?.length || 0;
  const hasScores = total > 0;

  const sum = { ev_knowledge: 0, hv_safety_awareness: 0, diagnostics: 0, practical_evidence: 0, training_evidence: 0, verbal_reasoning: 0 };
  const statusCounts = { strong: 0, developing: 0, significant_gap: 0, insufficient_evidence: 0 };

  (scoresData || []).forEach((row: any) => {
    sum.ev_knowledge += Number(row.ev_knowledge) || 0;
    sum.hv_safety_awareness += Number(row.hv_safety_awareness) || 0;
    sum.diagnostics += Number(row.diagnostics) || 0;
    sum.practical_evidence += Number(row.practical_evidence) || 0;
    sum.training_evidence += Number(row.training_evidence) || 0;
    sum.verbal_reasoning += Number(row.verbal_reasoning) || 0;
    if (row.status && row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts]++;
    }
  });

  const categoryAverages: CategoryAverage[] = [
    { title: "EV Knowledge", percentage: total ? Math.round(sum.ev_knowledge / total) : 0 },
    { title: "HV Safety Awareness", percentage: total ? Math.round(sum.hv_safety_awareness / total) : 0 },
    { title: "Diagnostics", percentage: total ? Math.round(sum.diagnostics / total) : 0 },
    { title: "Practical Evidence", percentage: total ? Math.round(sum.practical_evidence / total) : 0 },
    { title: "Training Evidence", percentage: total ? Math.round(sum.training_evidence / total) : 0 },
    { title: "Verbal Reasoning", percentage: total ? Math.round(sum.verbal_reasoning / total) : 0 },
  ];

  const distribution: EVReadinessStatusData[] = [
    { status: "strong", label: "Strong Readiness", count: statusCounts.strong, color: "var(--success)" },
    { status: "developing", label: "Developing", count: statusCounts.developing, color: "var(--warning)" },
    { status: "significant_gap", label: "Significant Gap", count: statusCounts.significant_gap, color: "var(--destructive)" },
    { status: "insufficient_evidence", label: "Insufficient Evidence", count: statusCounts.insufficient_evidence, color: "var(--muted-foreground)" },
  ];

  const candidateScores: CandidateEVScoreItem[] = (scoresData || []).map((row: any) => ({
    id: row.id,
    candidate_id: row.assessments?.candidate_profiles?.id,
    candidate_name: row.assessments?.candidate_profiles?.profiles?.full_name || "Unknown Candidate",
    overall_score: Number(row.overall_score) || 0,
    status: row.status || "insufficient_evidence",
    generated_at: row.generated_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">EV Readiness Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Organisation-wide electric vehicle and high-voltage competency metrics, safety thresholds, and candidate readiness.
        </p>
      </div>

      <AdminEVReadinessView
        categoryAverages={categoryAverages}
        distribution={distribution}
        candidateScores={candidateScores}
        hasScores={hasScores}
      />
    </div>
  );
}
