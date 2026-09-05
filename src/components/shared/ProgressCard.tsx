interface ProgressCardProps {
  title: string;
  percentage: number;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "destructive" | "muted";
}

export function ProgressCard({
  title,
  percentage,
  badgeText,
  badgeVariant = "muted",
}: ProgressCardProps) {
  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const badgeStyles = {
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[badgeVariant];

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {badgeText && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeStyles}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {safePercentage}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
