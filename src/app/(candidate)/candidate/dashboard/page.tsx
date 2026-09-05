import { redirect } from "next/navigation";
import { MessageSquareQuote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProgressCard } from "@/components/shared/ProgressCard";
import { FinalStatusCard } from "@/components/candidate/FinalStatusCard";
import { getCandidateDashboardMetrics } from "@/lib/candidate/dashboard";

export default async function CandidateDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const m = await getCandidateDashboardMetrics(supabase, user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back, {m.displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your skills assessment progress, evidence uploads, and technical
          milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressCard
          title="Profile Completion"
          percentage={m.profileCompletionPct}
          badgeText={m.profileCompletionPct === 100 ? "Complete" : "In Progress"}
          badgeVariant={m.profileCompletionPct === 100 ? "success" : "warning"}
        />
        <ProgressCard
          title="Technical Assessment"
          percentage={m.technicalScore}
          badgeText={m.technicalScore >= 60 ? "On Track" : "Action Req."}
          badgeVariant={m.technicalScore >= 60 ? "success" : "warning"}
        />
        <ProgressCard
          title="EV Readiness Score"
          percentage={m.evScore}
          badgeText={m.evScore >= 70 ? "Certified" : "Developing"}
          badgeVariant={m.evScore >= 70 ? "success" : "muted"}
        />
        <ProgressCard
          title="Evidence Verification"
          percentage={m.docsVerificationPct}
          badgeText={`${m.docsVerifiedCount}/${m.docsTotalCount} Verified`}
          badgeVariant={
            m.docsVerifiedCount === m.docsTotalCount && m.docsTotalCount > 0
              ? "success"
              : "muted"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-4 shadow-sm sm:gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Assessments:
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 font-medium text-foreground">
            <span className="size-2 rounded-full bg-primary" />
            Assigned: {m.assessmentsAssigned}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 font-medium text-warning">
            <span className="size-2 rounded-full bg-warning" />
            Under Review: {m.assessmentsPending}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-medium text-success">
            <span className="size-2 rounded-full bg-success" />
            Completed: {m.assessmentsCompleted}
          </span>
        </div>
      </div>

      <FinalStatusCard
        status={m.latestAssessmentStatus}
        outcome={m.latestAssessmentOutcome}
      />

      {m.latestFeedback && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquareQuote className="size-4 text-primary" />
            <span>Recent Examiner Feedback</span>
          </div>
          <p className="mt-3 text-sm italic text-foreground bg-muted/30 p-3 rounded-lg border border-border">
            &ldquo;{m.latestFeedback.comment}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
