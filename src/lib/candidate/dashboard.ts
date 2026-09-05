import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardMetrics {
  displayName: string;
  profileCompletionPct: number;
  technicalScore: number;
  evScore: number;
  docsVerifiedCount: number;
  docsTotalCount: number;
  docsVerificationPct: number;
  assessmentsAssigned: number;
  assessmentsCompleted: number;
  assessmentsPending: number;
  latestAssessmentStatus: string | null;
  latestAssessmentOutcome: string;
  latestFeedback: {
    comment: string;
    reviewedAt: string;
  } | null;
}

export async function getCandidateDashboardMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardMetrics> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_name")
    .eq("id", userId)
    .maybeSingle();

  const displayName =
    profile?.preferred_name || profile?.full_name || "Candidate";

  const { data: candProfile } = await supabase
    .from("candidate_profiles")
    .select("id, profile_completion_pct")
    .eq("profile_id", userId)
    .maybeSingle();

  const profileCompletionPct = candProfile?.profile_completion_pct || 0;

  let docsVerifiedCount = 0;
  let docsTotalCount = 0;
  let docsVerificationPct = 0;

  if (candProfile?.id) {
    const { data: docs } = await supabase
      .from("documents")
      .select("status")
      .eq("candidate_profile_id", candProfile.id);

    if (docs) {
      docsTotalCount = docs.length;
      docsVerifiedCount = docs.filter((d) => d.status === "verified").length;
      docsVerificationPct =
        docsTotalCount > 0 ? (docsVerifiedCount / docsTotalCount) * 100 : 0;
    }
  }

  let assessmentsAssigned = 0;
  let assessmentsCompleted = 0;
  let assessmentsPending = 0;
  let technicalScore = 0;
  let evScore = 0;
  let latestAssessmentStatus: string | null = null;
  let latestAssessmentOutcome = "pending";

  if (candProfile?.id) {
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, status, overall_score, ev_readiness_score, outcome, assigned_at")
      .eq("candidate_profile_id", candProfile.id)
      .order("assigned_at", { ascending: false });

    if (assessments && assessments.length > 0) {
      assessmentsAssigned = assessments.filter(
        (a) => a.status === "not_started" || a.status === "in_progress"
      ).length;
      assessmentsCompleted = assessments.filter(
        (a) => a.status === "completed"
      ).length;
      assessmentsPending = assessments.filter(
        (a) => a.status === "submitted" || a.status === "under_review"
      ).length;

      const latest = assessments[0];
      technicalScore = Number(latest.overall_score || 0);
      evScore = Number(latest.ev_readiness_score || 0);
      latestAssessmentStatus = latest.status;
      latestAssessmentOutcome = latest.outcome || "pending";
    }
  }

  let latestFeedback: DashboardMetrics["latestFeedback"] = null;
  const { data: review } = await supabase
    .from("examiner_reviews")
    .select("comment, reviewed_at")
    .not("comment", "is", null)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (review?.comment) {
    latestFeedback = {
      comment: review.comment,
      reviewedAt: review.reviewed_at,
    };
  }

  return {
    displayName,
    profileCompletionPct,
    technicalScore,
    evScore,
    docsVerifiedCount,
    docsTotalCount,
    docsVerificationPct,
    assessmentsAssigned,
    assessmentsCompleted,
    assessmentsPending,
    latestAssessmentStatus,
    latestAssessmentOutcome,
    latestFeedback,
  };
}
