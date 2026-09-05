import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  accentColor?: string;
  description?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  accentColor = "var(--foreground)",
  description,
}: KpiCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
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
}
