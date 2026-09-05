import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft, FileText, MessageSquare, Zap, Award, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentSummaryPage({ params }: SummaryPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!candidateProfile) redirect("/assessments");

  const adminClient = createAdminClient();

  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, status, outcome, overall_score, ev_readiness_score, completed_at, assigned_at, candidate_profile_id, assessment_templates(title, framework_version)")
    .eq("id", id)
    .single();

  if (!assessment || assessment.candidate_profile_id !== candidateProfile.id) {
    redirect("/assessments");
  }

  const title = (assessment.assessment_templates as any)?.title || "Automotive Competency Assessment";
  const framework = (assessment.assessment_templates as any)?.framework_version || "AUR Framework";
  const isCompetent = assessment.outcome === "competent";
  const completedDate = assessment.completed_at
    ? new Date(assessment.completed_at).toLocaleDateString("en-AU")
    : new Date(assessment.assigned_at).toLocaleDateString("en-AU");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assessments
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            {framework}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Determination Outcome</p>
            <div className="flex items-center gap-2 pt-1">
              {isCompetent ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-sm font-bold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Competent (C)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1 text-sm font-bold text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Not Yet Competent (NYC)
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <p className="text-xs text-muted-foreground">Completed Date</p>
            <p className="text-sm font-semibold text-foreground">{completedDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Award className="h-4 w-4 text-primary" />
              Overall Score
            </div>
            <p className="text-2xl font-extrabold text-foreground">
              {assessment.overall_score !== null && assessment.overall_score !== undefined
                ? `${assessment.overall_score}%`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Combined theoretical & scenario evaluation</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-secondary" />
              EV Readiness Score
            </div>
            <p className="text-2xl font-extrabold text-foreground">
              {assessment.ev_readiness_score !== null && assessment.ev_readiness_score !== undefined
                ? `${assessment.ev_readiness_score}%`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">High voltage safety & diagnostic benchmark</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/feedback"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            View Examiner Feedback
          </Link>
          <Link
            href="/reports"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Download Formal Report
          </Link>
        </div>
      </div>
    </div>
  );
}
