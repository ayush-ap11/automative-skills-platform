import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquareQuote, Award, UserCheck, Zap, FileCheck, CheckSquare, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProgressCard } from "@/components/shared/ProgressCard";
import { FinalStatusCard } from "@/components/candidate/FinalStatusCard";
import { getCandidateDashboardMetrics } from "@/lib/candidate/dashboard";

export default async function CandidateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await getCandidateDashboardMetrics(supabase, user.id);
  const overallReadinessPct = Math.min(100, Math.round(
    (m.profileCompletionPct * 0.2) + (m.technicalScore * 0.35) + (m.evScore * 0.25) + (m.docsVerificationPct * 0.2)
  ));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back, {m.displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your skills assessment progress, evidence uploads, and technical milestones.
        </p>
      </div>

      {/* Systematic Overall Qualification Readiness Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Award className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Qualification Readiness Pathway</h2>
              <p className="text-xs text-muted-foreground">AUR Automotive Vocational Competency Benchmark</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{overallReadinessPct}%</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-primary/30 bg-primary/10 text-primary">
              {overallReadinessPct >= 80 ? "Assessment Ready" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overallReadinessPct}%` }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground">
          <span>Profile: <strong className="text-foreground">{m.profileCompletionPct}%</strong></span>
          <span>Technical: <strong className="text-foreground">{m.technicalScore}%</strong></span>
          <span>EV Skills: <strong className="text-foreground">{m.evScore}%</strong></span>
          <span>Evidence: <strong className="text-foreground">{m.docsVerifiedCount}/{m.docsTotalCount}</strong></span>
        </div>
      </div>

      {/* 4 Systematic Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressCard
          title="Profile Completion"
          percentage={m.profileCompletionPct}
          badgeText={m.profileCompletionPct === 100 ? "Complete" : "In Progress"}
          badgeVariant={m.profileCompletionPct === 100 ? "success" : "warning"}
          icon={UserCheck}
          description="Personal & trade bio"
          href="/profile"
        />
        <ProgressCard
          title="Technical Assessment"
          percentage={m.technicalScore}
          badgeText={m.technicalScore >= 60 ? "On Track" : "Pending"}
          badgeVariant={m.technicalScore >= 60 ? "success" : "warning"}
          icon={CheckSquare}
          description="Theory & diagnostic"
          href="/assessments"
        />
        <ProgressCard
          title="EV Readiness Score"
          percentage={m.evScore}
          badgeText={m.evScore >= 70 ? "Certified" : "Developing"}
          badgeVariant={m.evScore >= 70 ? "success" : "muted"}
          icon={Zap}
          description="High-voltage safety"
          href="/ev-readiness"
        />
        <ProgressCard
          title="Evidence Verification"
          percentage={m.docsVerificationPct}
          badgeText={`${m.docsVerifiedCount}/${m.docsTotalCount} Verified`}
          badgeVariant={m.docsVerifiedCount === m.docsTotalCount && m.docsTotalCount > 0 ? "success" : "muted"}
          icon={FileCheck}
          description="Workplace documents"
          href="/documents"
        />
      </div>

      {/* Assessment Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assessments Status:</span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 font-medium text-foreground">
              <span className="size-2 rounded-full bg-primary" /> Assigned: {m.assessmentsAssigned}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 font-medium text-warning">
              <span className="size-2 rounded-full bg-warning" /> Under Review: {m.assessmentsPending}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-medium text-success">
              <span className="size-2 rounded-full bg-success" /> Completed: {m.assessmentsCompleted}
            </span>
          </div>
        </div>
        <Link href="/assessments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          Open Assessments <ArrowRight className="size-3" />
        </Link>
      </div>

      <FinalStatusCard status={m.latestAssessmentStatus} outcome={m.latestAssessmentOutcome} />

      {m.latestFeedback && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
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
