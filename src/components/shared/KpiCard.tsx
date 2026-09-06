import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { InfoTooltip } from "@/components/shared/InfoTooltip";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  accentColor?: string;
  description?: string;
  href?: string;
  tooltip?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  accentColor = "var(--foreground)",
  description,
  href,
  tooltip,
}: KpiCardProps) {
  const content = (
    <div
      className={`group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition ${href ? "hover:border-primary/50 hover:bg-muted/20 hover:shadow-sm cursor-pointer" : "hover:shadow-sm"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {label}
          </span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {href && (
            <ArrowUpRight className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
          )}
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-4">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ color: accentColor }}
        >
          {value}
        </span>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
