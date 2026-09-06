import Link from "next/link";
import { CheckCircle2, ChevronRight, FileText, Clock, AlertTriangle, ShieldAlert } from "lucide-react";

export interface AttentionItem {
  id: string;
  type: "assessment_review" | "document_verification" | "safety_flag";
  candidate_profile_id: string;
  candidate_name: string;
  title: string;
  subtitle?: string;
  submitted_at: string | null;
  href: string;
}

const TYPE_CONFIG = {
  assessment_review: {
    label: "Assessment Review",
    cls: "bg-primary/10 text-primary border-primary/30",
    icon: Clock,
  },
  document_verification: {
    label: "Document Verification",
    cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
    icon: FileText,
  },
  safety_flag: {
    label: "Safety Flag",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    icon: ShieldAlert,
  },
};

export function NeedsAttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <CheckCircle2 className="size-10 text-[var(--success)] mb-3 opacity-80" />
        <h3 className="text-base font-semibold text-foreground">
          You&apos;re all caught up.
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          No assessment reviews, document verifications, or safety flags currently require your attention.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {items.map((item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.assessment_review;
        const Icon = config.icon;

        return (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            className="flex items-center justify-between p-4 transition hover:bg-muted/50 cursor-pointer"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground mt-0.5">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {item.candidate_name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${config.cls}`}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[11px] text-muted-foreground/80 italic">{item.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                {item.submitted_at
                  ? new Date(item.submitted_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Pending"}
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Review
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
