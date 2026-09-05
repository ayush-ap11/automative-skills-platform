"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X, Zap, Users, ExternalLink } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AU_STATES, AU_STATE_NAMES, getStateFullName } from "@/app/(auth)/signup/schema";

export interface AdminCandidateItem {
  id: string; name: string; email: string; state: string | null; currentRole: string | null;
  yearsExperience: number | null; evExperience: boolean; latestScore: number | null;
  evReadiness: { score: number | null; status: string | null } | null;
  evidence: { verified: number; total: number }; examinerName: string | null; status: string;
  latestAssessmentId?: string | null; lastActivity: string;
}

interface Props {
  candidates: AdminCandidateItem[]; examiners: Array<{ id: string; name: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" }, under_review: { label: "Under Review", cls: "bg-primary/10 text-primary border-primary/30" }, submitted: { label: "Submitted", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" }, in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary border-primary/30" }, not_started: { label: "Not Started", cls: "bg-muted text-muted-foreground border-border" },
};

export function CandidateManagementTable({ candidates, examiners }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ state: "all", ev: "all", status: "all", examiner: "all", evidence: "all" });

  const filtered = useMemo(() => candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.currentRole?.toLowerCase().includes(q));
    const matchState = filters.state === "all" || c.state === filters.state;
    const matchEv = filters.ev === "all" || (filters.ev === "yes" ? c.evExperience : !c.evExperience);
    const matchStatus = filters.status === "all" || c.status === filters.status;
    const matchExaminer = filters.examiner === "all" || c.examinerName === filters.examiner;
    const matchEvidence = filters.evidence === "all" || (filters.evidence === "unverified" ? c.evidence.total > c.evidence.verified : filters.evidence === "verified" ? (c.evidence.total > 0 && c.evidence.total === c.evidence.verified) : c.evidence.total === 0);
    return matchSearch && matchState && matchEv && matchStatus && matchExaminer && matchEvidence;
  }), [candidates, search, filters]);

  const activeFilters = Object.values(filters).filter((v) => v !== "all").length;
  const resetFilters = () => setFilters({ state: "all", ev: "all", status: "all", examiner: "all", evidence: "all" });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" />}>
              <Filter className="size-3.5" /><span>Filters</span>
              {activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground font-bold">{activeFilters}</span>}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3" align="end">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter Candidates</span>
                {activeFilters > 0 && <button onClick={resetFilters} className="text-[11px] text-primary hover:underline cursor-pointer">Reset</button>}
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">State</label>
                  <select value={filters.state} onChange={(e) => setFilters(p => ({ ...p, state: e.target.value }))} className="w-full rounded border border-border bg-background p-1 cursor-pointer">
                    <option value="all">All States</option>{AU_STATES.map((s) => <option key={s} value={s}>{AU_STATE_NAMES[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">EV Experience</label>
                  <select value={filters.ev} onChange={(e) => setFilters(p => ({ ...p, ev: e.target.value }))} className="w-full rounded border border-border bg-background p-1 cursor-pointer">
                    <option value="all">All</option><option value="yes">Yes</option><option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">Assessment Status</label>
                  <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))} className="w-full rounded border border-border bg-background p-1 cursor-pointer">
                    <option value="all">All Statuses</option>{Object.keys(STATUS_CONFIG).map((k) => <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">Examiner</label>
                  <select value={filters.examiner} onChange={(e) => setFilters(p => ({ ...p, examiner: e.target.value }))} className="w-full rounded border border-border bg-background p-1 cursor-pointer">
                    <option value="all">All Examiners</option>{examiners.map((ex) => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-0.5">Evidence Status</label>
                  <select value={filters.evidence} onChange={(e) => setFilters(p => ({ ...p, evidence: e.target.value }))} className="w-full rounded border border-border bg-background p-1 cursor-pointer">
                    <option value="all">All</option><option value="unverified">Has Unverified</option><option value="verified">Fully Verified</option><option value="none">No Evidence</option>
                  </select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs cursor-pointer gap-1"><X className="size-3.5" /> Clear</Button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <Users className="size-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">{candidates.length === 0 ? "No candidates in this organisation yet." : "No candidates matching selected filters."}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="p-3">Candidate</th><th className="p-3">Role & State</th><th className="p-3">Exp</th>
                  <th className="p-3">EV</th><th className="p-3">Score</th><th className="p-3">EV Ready</th>
                  <th className="p-3">Evidence</th><th className="p-3">Examiner</th><th className="p-3">Status</th>
                  <th className="p-3 text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const sInfo = STATUS_CONFIG[c.status] || { label: c.status, cls: "bg-muted text-muted-foreground border-border" };
                  return (
                    <tr key={c.id} onClick={() => router.push(`/admin/candidates/${c.id}`)} className="hover:bg-muted/40 cursor-pointer transition-colors">
                      <td className="p-3"><div className="font-semibold text-foreground hover:text-primary transition-colors">{c.name}</div><div className="text-[11px] text-muted-foreground">{c.email}</div></td>
                      <td className="p-3"><div className="font-medium text-foreground">{c.currentRole || "—"}</div><div className="text-[11px] text-muted-foreground">{getStateFullName(c.state) || "—"}</div></td>
                      <td className="p-3 font-medium">{c.yearsExperience !== null ? `${c.yearsExperience}y` : "—"}</td>
                      <td className="p-3">{c.evExperience ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)]"><Zap className="size-3" /> Yes</span> : "No"}</td>
                      <td className="p-3 font-bold text-foreground">{c.latestScore !== null ? `${c.latestScore}%` : "—"}</td>
                      <td className="p-3">{c.evReadiness?.status ? <span className="capitalize text-[11px] font-medium">{c.evReadiness.status.replace(/_/g, " ")}</span> : "—"}</td>
                      <td className="p-3 text-[11px] text-muted-foreground">{c.evidence.verified}/{c.evidence.total} verified</td>
                      <td className="p-3 text-foreground">{c.examinerName || <span className="text-muted-foreground italic">Unassigned</span>}</td>
                      <td className="p-3">
                        {c.latestAssessmentId ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); router.push(`/admin/assessments/${c.latestAssessmentId}`); }} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-80 transition ${sInfo.cls}`} title="Click to view assessment details">
                            {sInfo.label} <ExternalLink className="size-2.5 opacity-60" />
                          </button>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sInfo.cls}`}>{sInfo.label}</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-muted-foreground text-[11px]" suppressHydrationWarning>{new Date(c.lastActivity).toLocaleDateString("en-AU")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
