import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

export interface AttentionItem {
  id: string;
  candidate_profile_id: string;
  candidate_name: string;
  title: string;
  submitted_at: string | null;
}

export function NeedsAttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <CheckCircle2 className="size-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          You&apos;re all caught up.
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          No submitted assessments are currently awaiting your review.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/examiner/candidates/${item.candidate_profile_id}`}
          className="flex items-center justify-between p-4 transition hover:bg-muted/50 cursor-pointer"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {item.candidate_name}
            </p>
            <p className="text-xs text-muted-foreground">{item.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Submitted:{" "}
              {item.submitted_at
                ? new Date(item.submitted_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Awaiting review"}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              Review
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
