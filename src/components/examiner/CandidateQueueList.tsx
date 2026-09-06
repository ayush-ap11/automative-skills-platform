"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, Users, ChevronRight } from "lucide-react";

export interface CandidateQueueItem {
  id: string;
  name: string;
  years_experience: number | null;
  current_role: string | null;
  has_ev_experience: boolean;
  ev_readiness_score?: number | null;
  overall_score: number | null;
  latest_status: string;
  evidence_completeness: { verified: number; total: number };
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" },
  completed: { label: "Completed", className: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" },
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

function getEvReadinessBadge(score?: number | null, hasEvExp?: boolean) {
  if (score == null && !hasEvExp) return null;
  const num = score != null ? Number(score) : null;

  let label = "Developing";
  let cls = "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30";

  if (num != null) {
    if (num >= 75) {
      label = "Strong Readiness";
      cls = "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30";
    } else if (num >= 50) {
      label = "Developing";
      cls = "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30";
    } else if (num > 0) {
      label = "Significant Gap";
      cls = "bg-destructive/10 text-destructive border-destructive/30";
    } else {
      label = "Insufficient Evidence";
      cls = "bg-muted text-muted-foreground border-border";
    }
  } else if (hasEvExp) {
    label = "Developing";
    cls = "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30";
  }

  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${cls}`}>
      <Zap className="size-3 shrink-0" />
      {num != null ? `${num}% – ${label}` : label}
    </span>
  );
}

export function CandidateQueueList({ candidates }: { candidates: CandidateQueueItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.current_role && c.current_role.toLowerCase().includes(query.toLowerCase()))
  );

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Users className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No candidates assigned to you yet.</h3>
        <p className="mt-1 text-xs text-muted-foreground">When candidates are assigned for review, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter candidates by name or role..."
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No candidates match your search.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Experience</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5">Latest Status</th>
                  <th className="px-5 py-3.5">Overall Score</th>
                  <th className="px-5 py-3.5">Evidence</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/examiner/candidates/${c.id}`)} className="cursor-pointer transition hover:bg-muted/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      {getEvReadinessBadge(c.ev_readiness_score, c.has_ev_experience)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{c.years_experience !== null ? `${c.years_experience} yrs` : "—"}</td>
                    <td className="px-5 py-4 text-muted-foreground">{c.current_role || "—"}</td>
                    <td className="px-5 py-4">{getStatusBadge(c.latest_status)}</td>
                    <td className="px-5 py-4 font-medium text-foreground">{c.overall_score !== null ? `${c.overall_score}%` : "—"}</td>
                    <td className="px-5 py-4 text-xs font-medium text-muted-foreground">{c.evidence_completeness.verified}/{c.evidence_completeness.total} verified</td>
                    <td className="px-5 py-4 text-right"><ChevronRight className="ml-auto size-4 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((c) => (
              <div key={c.id} onClick={() => router.push(`/examiner/candidates/${c.id}`)} className="cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{c.name}</h4>
                    <p className="text-xs text-muted-foreground">{c.current_role || "No role specified"}</p>
                    {getEvReadinessBadge(c.ev_readiness_score, c.has_ev_experience)}
                  </div>
                  {getStatusBadge(c.latest_status)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
                  <span>Exp: {c.years_experience !== null ? `${c.years_experience} yrs` : "—"}</span>
                  <span>Score: {c.overall_score !== null ? `${c.overall_score}%` : "—"}</span>
                  <span>{c.evidence_completeness.verified}/{c.evidence_completeness.total} verified</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
