"use client";

import { useRouter } from "next/navigation";
import { CheckSquare, ChevronRight, Clock } from "lucide-react";

export interface AssessmentQueueItem {
  id: string;
  candidateName: string;
  templateTitle: string;
  status: string;
  submittedAt: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-warning/10 text-warning border-warning/30" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/30" },
  under_review: { label: "Under Review", className: "bg-primary/10 text-primary border-primary/30" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/30" },
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
};

function getStatusBadge(status: string) {
  const config = STATUS_MAP[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function AssessmentQueueList({ assessments }: { assessments: AssessmentQueueItem[] }) {
  const router = useRouter();

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <CheckSquare className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No assessments in your queue.</h3>
        <p className="mt-1 text-xs text-muted-foreground">Assigned candidate assessments awaiting examination will be listed here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5">Candidate</th>
              <th className="px-5 py-3.5">Assessment Module</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Submitted</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessments.map((a) => (
              <tr
                key={a.id}
                onClick={() => router.push(`/examiner/assessments/${a.id}/review`)}
                className="cursor-pointer transition hover:bg-muted/50"
              >
                <td className="px-5 py-4 font-semibold text-foreground">{a.candidateName}</td>
                <td className="px-5 py-4 text-muted-foreground">{a.templateTitle}</td>
                <td className="px-5 py-4">{getStatusBadge(a.status)}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {a.submittedAt ? (
                    new Date(a.submittedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  ) : (
                    "Not submitted yet"
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Review <ChevronRight className="size-4" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {assessments.map((a) => (
          <div
            key={a.id}
            onClick={() => router.push(`/examiner/assessments/${a.id}/review`)}
            className="cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{a.candidateName}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{a.templateTitle}</p>
              </div>
              {getStatusBadge(a.status)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground/70" />
                {a.submittedAt
                  ? new Date(a.submittedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not submitted yet"}
              </span>
              <span className="font-medium text-primary flex items-center gap-0.5">
                Review <ChevronRight className="size-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
