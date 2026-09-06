import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MessageSquareQuote,
  Award,
  UserCheck,
  Zap,
  FileCheck,
  CheckSquare,
  ArrowRight,
  ArrowUpRight,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FinalStatusCard } from "@/components/candidate/FinalStatusCard";
import { getCandidateDashboardMetrics } from "@/lib/candidate/dashboard";

interface DashboardStatCardProps {
  title: string;
  percentage: number;
  badgeText: string;
  badgeVariant: "success" | "warning" | "destructive" | "muted";
  icon: LucideIcon;
  description?: string;
  href: string;
  infoTooltip?: string;
}

function DashboardStatCard({
  title,
  percentage,
  badgeText,
  badgeVariant,
  icon: Icon,
  description,
  href,
  infoTooltip,
}: DashboardStatCardProps) {
  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const badgeStyles = {
    success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[badgeVariant];

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/50 hover:bg-muted/10 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-4" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground truncate">
              {title}
            </h3>
            {infoTooltip && (
              <div
                className="group/tip relative inline-flex shrink-0 items-center"
                title={infoTooltip}
              >
                <span
                  tabIndex={0}
                  aria-label={infoTooltip}
                  className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground focus:text-foreground transition-colors cursor-help"
                >
                  <HelpCircle className="size-3.5" />
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block group-focus-within/tip:block z-50 w-52 sm:w-60 rounded-lg border border-border bg-popover/95 p-2.5 text-center text-[11px] font-normal leading-tight text-popover-foreground shadow-md backdrop-blur-xs">
                  {infoTooltip}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap ${badgeStyles}`}
          >
            {badgeText}
          </span>
          <ArrowUpRight className="size-3.5 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {safePercentage}%
          </span>
          {description && (
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default async function CandidateDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await getCandidateDashboardMetrics(supabase, user.id);
  const overallReadinessPct = Math.min(
    100,
    Math.round(
      m.profileCompletionPct * 0.2 +
        m.technicalScore * 0.35 +
        m.evScore * 0.25 +
        m.docsVerificationPct * 0.2
    )
  );

  // 1. Profile Completion badge logic (Not Started when 0%, In Progress when > 0 and < 100%, Complete at 100%)
  const profileBadgeText =
    m.profileCompletionPct === 0
      ? "Not Started"
      : m.profileCompletionPct >= 100
        ? "Complete"
        : "In Progress";
  const profileBadgeVariant: "muted" | "warning" | "success" =
    m.profileCompletionPct === 0
      ? "muted"
      : m.profileCompletionPct >= 100
        ? "success"
        : "warning";

  // 2. Technical Assessment badge logic
  const techBadgeText =
    m.technicalScore >= 75
      ? "On Track"
      : m.technicalScore > 0
        ? "Developing"
        : "Pending";
  const techBadgeVariant: "muted" | "warning" | "success" =
    m.technicalScore >= 75
      ? "success"
      : m.technicalScore > 0
        ? "warning"
        : "muted";

  // 3. EV Readiness Score badge logic (Strictly never 'Certified'; standard platform labels)
  const evScoreVal = Math.round(Number(m.evScore || 0));
  let evBadgeText = "Insufficient Evidence";
  let evBadgeVariant: "muted" | "warning" | "success" | "destructive" = "muted";

  if (evScoreVal >= 75) {
    evBadgeText = "Strong Readiness";
    evBadgeVariant = "success";
  } else if (evScoreVal >= 50) {
    evBadgeText = "Developing";
    evBadgeVariant = "warning";
  } else if (evScoreVal > 0) {
    evBadgeText = "Significant Gap";
    evBadgeVariant = "destructive";
  } else {
    evBadgeText = "Insufficient Evidence";
    evBadgeVariant = "muted";
  }

  // 4. Evidence Verification badge logic
  const evidenceBadgeText = `${m.docsVerifiedCount}/${m.docsTotalCount} Verified`;
  const evidenceBadgeVariant: "muted" | "warning" | "success" =
    m.docsTotalCount > 0 && m.docsVerifiedCount === m.docsTotalCount
      ? "success"
      : m.docsVerifiedCount > 0
        ? "warning"
        : "muted";

  return (
    <div className="space-y-6">
      {/* Header with overflow protection */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
          Welcome back, {m.displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground break-words">
          Track your skills assessment progress, evidence uploads, and technical milestones.
        </p>
      </div>

      {/* Systematic Overall Qualification Readiness Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Award className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">
                Qualification Readiness Pathway
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                AUR Automotive Vocational Competency Benchmark
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-2xl font-bold text-primary">
              {overallReadinessPct}%
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-primary/30 bg-primary/10 text-primary">
              {overallReadinessPct >= 80 ? "Assessment Ready" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${overallReadinessPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground">
          <span>
            Profile: <strong className="text-foreground">{m.profileCompletionPct}%</strong>
          </span>
          <span>
            Technical: <strong className="text-foreground">{m.technicalScore}%</strong>
          </span>
          <span>
            EV Skills: <strong className="text-foreground">{m.evScore}%</strong>
          </span>
          <span>
            Evidence: <strong className="text-foreground">{m.docsVerifiedCount}/{m.docsTotalCount}</strong>
          </span>
        </div>
      </div>

      {/* 4 Systematic Unified Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Profile Completion"
          percentage={m.profileCompletionPct}
          badgeText={profileBadgeText}
          badgeVariant={profileBadgeVariant}
          icon={UserCheck}
          description="Personal & trade bio"
          href="/profile"
        />
        <DashboardStatCard
          title="Technical Assessment"
          percentage={m.technicalScore}
          badgeText={techBadgeText}
          badgeVariant={techBadgeVariant}
          icon={CheckSquare}
          description="Theory & diagnostic"
          href="/assessments"
        />
        <DashboardStatCard
          title="EV Readiness Score"
          percentage={m.evScore}
          badgeText={evBadgeText}
          badgeVariant={evBadgeVariant}
          icon={Zap}
          description="High-voltage safety"
          href="/ev-readiness"
          infoTooltip="How ready you are for electric vehicle work, based on completed assessments."
        />
        <DashboardStatCard
          title="Evidence Verification"
          percentage={m.docsVerificationPct}
          badgeText={evidenceBadgeText}
          badgeVariant={evidenceBadgeVariant}
          icon={FileCheck}
          description="Workplace documents"
          href="/documents"
          infoTooltip="How many of your uploaded documents have been checked and approved."
        />
      </div>

      {/* Assessment Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Assessments Status:
          </span>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" /> Assigned: {m.assessmentsAssigned}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-1 font-semibold text-[var(--warning)]">
              <span className="size-2 rounded-full bg-[var(--warning)]" /> Under Review: {m.assessmentsPending}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-1 font-semibold text-[var(--success)]">
              <span className="size-2 rounded-full bg-[var(--success)]" /> Completed: {m.assessmentsCompleted}
            </span>
          </div>
        </div>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group self-start sm:self-auto shrink-0 transition-colors"
        >
          <span>Open Assessments</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Final Assessment Status Card */}
      <FinalStatusCard
        status={m.latestAssessmentStatus}
        outcome={m.latestAssessmentOutcome}
      />

      {/* Recent Examiner Feedback Card */}
      {m.latestFeedback && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquareQuote className="size-4 text-primary" />
            <span>Recent Examiner Feedback</span>
          </div>
          <p className="mt-2 text-sm italic text-foreground bg-muted/30 p-3.5 rounded-xl border border-border">
            &ldquo;{m.latestFeedback.comment}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
