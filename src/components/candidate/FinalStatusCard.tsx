import Link from "next/link";
import { Play, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface FinalStatusCardProps {
  status: string | null;
  outcome: string;
}

export function FinalStatusCard({ status, outcome }: FinalStatusCardProps) {
  const outcomeBadge = {
    competent: {
      text: "Competent",
      variant: "bg-success/10 text-success border-success/30",
      icon: CheckCircle2,
    },
    not_yet_competent: {
      text: "Not Yet Competent",
      variant: "bg-destructive/10 text-destructive border-destructive/30",
      icon: AlertTriangle,
    },
    pending: {
      text: "Pending Evaluation",
      variant: "bg-warning/10 text-warning border-warning/30",
      icon: Clock,
    },
  }[outcome] || {
    text: "Pending Evaluation",
    variant: "bg-warning/10 text-warning border-warning/30",
    icon: Clock,
  };

  const OutcomeIcon = outcomeBadge.icon;
  const isNotStarted = !status || status === "not_started";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Final Assessment Status
      </h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${outcomeBadge.variant}`}
            >
              <OutcomeIcon className="size-3.5" />
              {outcomeBadge.text}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground max-w-lg">
            {isNotStarted
              ? "Your baseline assessment has not been commenced. Start your evaluation to begin skill verification."
              : "Your assessment portfolio is monitored against Australian national automotive standards."}
          </p>
        </div>

        {isNotStarted && (
          <Link
            href="/assessments"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
          >
            <Play className="size-4 fill-current" />
            <span>Start Assessment</span>
          </Link>
        )}
      </div>
    </div>
  );
}
