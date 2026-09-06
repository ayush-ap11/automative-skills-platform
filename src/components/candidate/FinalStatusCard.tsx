import Link from "next/link";
import { Play, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";

interface FinalStatusCardProps {
  status: string | null;
  outcome: string;
}

export function FinalStatusCard({ status, outcome }: FinalStatusCardProps) {
  const isFinalised = status === "completed";
  const isNotStarted = !status || status === "not_started";
  const isInProgress = status === "in_progress";
  const isUnderReview = status === "submitted" || status === "under_review";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Final Assessment Status
      </h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {isFinalised ? (
              outcome === "competent" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-1 text-xs font-bold text-[var(--success)]">
                  <CheckCircle2 className="size-3.5" />
                  Competent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                  <AlertTriangle className="size-3.5" />
                  Not Yet Competent
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" />
                Not yet finalised
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-lg">
            {isFinalised
              ? outcome === "competent"
                ? "Your assessment portfolio has been finalised and meets Australian national automotive competency standards."
                : "Your assessment portfolio has been finalised. Review examiner recommendations for required competency gap training."
              : isUnderReview
                ? "Your assessment has been submitted and is currently undergoing review by your assigned examiner."
                : isInProgress
                  ? "Your assessment is currently in progress. Complete all sections to submit your portfolio for review."
                  : "Your baseline assessment has not been commenced. Start your evaluation to begin skill verification."}
          </p>
        </div>

        {isNotStarted ? (
          <Link
            href="/assessments"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 self-start sm:self-auto shrink-0"
          >
            <Play className="size-3.5 fill-current" />
            <span>Start Assessment</span>
          </Link>
        ) : !isFinalised ? (
          <Link
            href="/assessments"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary shadow-xs transition hover:bg-primary/20 self-start sm:self-auto shrink-0"
          >
            <span>View Assessments</span>
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
