"use client";

import React, { useState, useMemo } from "react";
import { ShieldAlert, CheckCircle2, Clock, Bot, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updateBlindAssessmentMode } from "@/app/(admin)/admin/ai-governance/actions";

export interface AIAnalysisRecord {
  id: string; candidate_name: string; question_text: string; model_version: string | null;
  confidence_level: number | null; critical_safety_flag: boolean; generated_at: string; is_human_reviewed: boolean;
}

interface Props {
  initialBlindMode: boolean;
  analyses: AIAnalysisRecord[];
}

export function AIGovernanceView({ initialBlindMode, analyses }: Props) {
  const [blindMode, setBlindMode] = useState(initialBlindMode);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");

  const handleToggle = async (val: boolean) => {
    const prev = blindMode;
    setBlindMode(val); setToggleLoading(true); setToggleError(null);
    const res = await updateBlindAssessmentMode(val);
    setToggleLoading(false);
    if (res.error) { setBlindMode(prev); setToggleError(res.error); }
  };

  const filtered = useMemo(() => analyses.filter((item) => {
    if (reviewFilter === "reviewed" && !item.is_human_reviewed) return false;
    if (reviewFilter === "pending" && item.is_human_reviewed) return false;
    if (flagFilter === "flagged" && !item.critical_safety_flag) return false;
    if (flagFilter === "unflagged" && item.critical_safety_flag) return false;
    return true;
  }), [analyses, reviewFilter, flagFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Blind Assessment Mode */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <EyeOff className="size-4 text-primary" /> Blind Assessment Mode
            </h2>
            <p className="text-muted-foreground text-[11px]">Enforce anti-bias protocols across examiner evaluations and grading workflows.</p>
          </div>
          <Switch checked={blindMode} onCheckedChange={handleToggle} disabled={toggleLoading} className="cursor-pointer" />
        </div>
        {toggleError && <p className="text-xs text-destructive">{toggleError}</p>}
        <p className="text-muted-foreground text-[11px] pt-1">
          When enabled, examiners see candidate answers and evidence without a name until that candidate&apos;s assessment is finalised.
        </p>
      </div>

      {/* 2. AI Transparency Log */}
      <div className="space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Bot className="size-4 text-primary" /> AI Transparency &amp; Oversight Log
            </h3>
            <p className="text-muted-foreground text-[11px]">Audit trail of automated evaluation inferences, confidence metrics, and examiner reviews.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)} className="rounded-md border border-border bg-background p-1.5 text-xs text-foreground cursor-pointer">
              <option value="all">All Human Reviews</option>
              <option value="reviewed">Reviewed</option>
              <option value="pending">Pending Review</option>
            </select>
            <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)} className="rounded-md border border-border bg-background p-1.5 text-xs text-foreground cursor-pointer">
              <option value="all">All Safety Flags</option>
              <option value="flagged">Critical Safety Flagged</option>
              <option value="unflagged">Normal Evaluations</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
            <Bot className="size-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground italic">No AI-generated analyses yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="hidden md:grid grid-cols-12 gap-3 p-3 bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              <div className="col-span-3">Candidate</div>
              <div className="col-span-4">Question Prompt</div>
              <div className="col-span-2">Model &amp; Confidence</div>
              <div className="col-span-3 text-right">Human Review Status</div>
            </div>

            {filtered.map((item) => (
              <div key={item.id} className="p-3.5 md:grid md:grid-cols-12 md:gap-3 md:items-center space-y-2 md:space-y-0 hover:bg-muted/30 transition-colors">
                <div className="md:col-span-3 space-y-0.5">
                  <div className="font-semibold text-foreground text-xs">{item.candidate_name}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(item.generated_at).toLocaleDateString()}</div>
                </div>

                <div className="md:col-span-4 text-[11px] text-muted-foreground line-clamp-2 pr-2">
                  {item.question_text}
                </div>

                <div className="md:col-span-2 space-y-0.5">
                  <div className="font-mono text-[10px] text-foreground">{item.model_version || "gemini-2.5-flash"}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Conf: {item.confidence_level != null ? `${Math.round(Number(item.confidence_level) * 100)}%` : "Not yet available"}
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2">
                  {item.critical_safety_flag && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--safety)]/10 text-[var(--safety)] border border-[var(--safety)]/20">
                      <ShieldAlert className="size-3" /> Safety Flag
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.is_human_reviewed ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"}`}>
                    {item.is_human_reviewed ? <><CheckCircle2 className="size-3" /> Reviewed</> : <><Clock className="size-3" /> Pending</>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
