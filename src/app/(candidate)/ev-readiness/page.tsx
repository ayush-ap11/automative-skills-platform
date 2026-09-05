import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SafetyWarningBanner } from "@/components/shared/SafetyWarningBanner";
import {
  EVReadinessDashboard,
  EVReadinessScoreData,
} from "@/components/candidate/EVReadinessDashboard";

export const dynamic = "force-dynamic";

export default async function EvReadinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!candidateProfile) {
    redirect("/profile");
  }

  // Fetch candidate's most recent assessment with linked ev_readiness_scores
  const { data: latestScore } = await supabase
    .from("ev_readiness_scores")
    .select(`
      id,
      assessment_id,
      ev_knowledge,
      hv_safety_awareness,
      diagnostics,
      practical_evidence,
      training_evidence,
      verbal_reasoning,
      overall_score,
      status,
      calculation_notes,
      generated_at,
      assessments!inner (
        id,
        candidate_profile_id,
        assigned_at
      )
    `)
    .eq("assessments.candidate_profile_id", candidateProfile.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const scoreData: EVReadinessScoreData | null = latestScore
    ? {
        id: latestScore.id,
        assessment_id: latestScore.assessment_id,
        ev_knowledge: latestScore.ev_knowledge,
        hv_safety_awareness: latestScore.hv_safety_awareness,
        diagnostics: latestScore.diagnostics,
        practical_evidence: latestScore.practical_evidence,
        training_evidence: latestScore.training_evidence,
        verbal_reasoning: latestScore.verbal_reasoning,
        overall_score: latestScore.overall_score,
        status: latestScore.status as EVReadinessScoreData["status"],
        calculation_notes: latestScore.calculation_notes,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          EV Readiness Index
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          High-voltage and electric vehicle competency metrics and safety verification.
        </p>
      </div>

      {!scoreData ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 max-w-md text-sm font-medium text-foreground">
            Your EV Readiness Index will appear here once your assessment has been reviewed by an examiner.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <SafetyWarningBanner />
          <EVReadinessDashboard scores={scoreData} />
        </div>
      )}
    </div>
  );
}
