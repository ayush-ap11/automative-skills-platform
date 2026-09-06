"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { SafetyWarningBanner } from "@/components/shared/SafetyWarningBanner";
import { ProgressCard } from "@/components/shared/ProgressCard";
import { EVReadinessChart, EVReadinessStatusData } from "@/components/admin/EVReadinessChart";

export interface CategoryAverage {
  title: string;
  percentage: number;
}

export interface CandidateEVScoreItem {
  id: string;
  candidate_id: string;
  candidate_name: string;
  overall_score: number;
  status: string;
  generated_at: string;
}

interface Props {
  categoryAverages: CategoryAverage[];
  distribution: EVReadinessStatusData[];
  candidateScores: CandidateEVScoreItem[];
  hasScores: boolean;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  strong: { label: "Strong Readiness", cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" },
  developing: { label: "Developing", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" },
  significant_gap: { label: "Significant Gap", cls: "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/30" },
  insufficient_evidence: { label: "Insufficient Evidence", cls: "bg-muted text-[var(--muted-foreground)] border-border" },
};

export function AdminEVReadinessView({ categoryAverages, distribution, candidateScores, hasScores }: Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return candidateScores;
    return candidateScores.filter((c) => c.status === statusFilter);
  }, [candidateScores, statusFilter]);

  return (
    <div className="space-y-6">
      <SafetyWarningBanner />

      {!hasScores ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 max-w-md text-sm font-medium text-foreground">
            No EV Readiness scores calculated yet — these populate once assessments are reviewed.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {categoryAverages.map((cat) => (
              <ProgressCard key={cat.title} title={cat.title} percentage={cat.percentage} />
            ))}
          </div>

          <EVReadinessChart data={distribution} />

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">Candidate EV Evaluations ({filtered.length})</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-background p-1.5 text-xs text-foreground cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="strong">Strong Readiness</option>
                <option value="developing">Developing</option>
                <option value="significant_gap">Significant Gap</option>
                <option value="insufficient_evidence">Insufficient Evidence</option>
              </select>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No candidate evaluations match this status.</div>
              ) : (
                filtered.map((item) => {
                  const badge = STATUS_MAP[item.status] || STATUS_MAP.insufficient_evidence;
                  return (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/admin/candidates/${item.candidate_id}`)}
                      className="flex items-center justify-between p-4 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-foreground hover:underline">{item.candidate_name}</div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                            <Calendar className="size-3" /> {new Date(item.generated_at).toLocaleDateString("en-AU")}
                          </span>
                          <span>•</span>
                          <span>Score: <strong className="text-foreground">{Math.round(item.overall_score)}%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
