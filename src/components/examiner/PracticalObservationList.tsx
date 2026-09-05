"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardCheck, ChevronRight, Calendar } from "lucide-react";

export interface PracticalObservationItem {
  id: string;
  candidateName: string;
  taskTitle: string;
  overallRating: string;
  observedAt: string;
}

const BADGE_MAP: Record<string, { label: string; cls: string }> = {
  not_demonstrated: { label: "Not Demonstrated", cls: "border-destructive/30 bg-destructive/10 text-destructive" },
  developing: { label: "Developing", cls: "border-warning/30 bg-warning/10 text-warning" },
  competent: { label: "Competent", cls: "border-success/30 bg-success/10 text-success" },
  highly_competent: { label: "Highly Competent", cls: "bg-success text-success-foreground font-bold shadow-2xs" },
};

function getRatingBadge(rating: string) {
  const c = BADGE_MAP[rating] || { label: rating, cls: "border-border bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

export function PracticalObservationList({ observations }: { observations: PracticalObservationItem[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Practical Assessments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recorded in-person practical evaluations and workshop checklists.</p>
        </div>
        <Link
          href="/examiner/practical/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 cursor-pointer shadow-xs transition"
        >
          <Plus className="size-4" /> New Observation
        </Link>
      </div>

      {observations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ClipboardCheck className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No practical observations logged yet.</h3>
          <p className="mt-1 text-xs text-muted-foreground">Log workshop demonstrations, isolation procedures, and safety checklists.</p>
          <Link
            href="/examiner/practical/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            <Plus className="size-3.5" /> Start First Observation
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Task Title</th>
                  <th className="px-5 py-3.5">Overall Rating</th>
                  <th className="px-5 py-3.5">Observed At</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {observations.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => router.push(`/examiner/practical/${obs.id}`)}
                    className="cursor-pointer transition hover:bg-muted/50"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">{obs.candidateName}</td>
                    <td className="px-5 py-4 text-foreground/90">{obs.taskTitle}</td>
                    <td className="px-5 py-4">{getRatingBadge(obs.overallRating)}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(obs.observedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        View <ChevronRight className="size-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {observations.map((obs) => (
              <div
                key={obs.id}
                onClick={() => router.push(`/examiner/practical/${obs.id}`)}
                className="cursor-pointer rounded-xl border border-border bg-card p-4 shadow-xs transition hover:bg-muted/40 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{obs.candidateName}</h4>
                    <p className="text-xs text-foreground/80 mt-0.5">{obs.taskTitle}</p>
                  </div>
                  {getRatingBadge(obs.overallRating)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground/70" />
                    {new Date(obs.observedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="font-medium text-primary flex items-center gap-0.5">
                    View <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
