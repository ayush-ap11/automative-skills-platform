import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { InfoTooltip } from "@/components/shared/InfoTooltip";

interface ProgressCardProps {
  title: string;
  percentage: number;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "destructive" | "muted";
  icon?: LucideIcon;
  description?: string;
  href?: string;
  tooltip?: string;
}

export function ProgressCard({
  title,
  percentage,
  badgeText,
  badgeVariant = "muted",
  icon: Icon,
  description,
  href,
  tooltip,
}: ProgressCardProps) {
  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const badgeStyles = {
    success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[badgeVariant];

  const card = (
    <div className={`group flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5 transition ${href ? "hover:border-primary/50 hover:bg-muted/20 hover:shadow-sm cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-3.5" />
            </div>
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {title}
          </h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeStyles}`}>
              {badgeText}
            </span>
          )}
          {href && (
            <ArrowUpRight className="size-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {safePercentage}%
          </span>
          {description && (
            <span className="text-[11px] text-muted-foreground">{description}</span>
          )}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }

  return card;
}
