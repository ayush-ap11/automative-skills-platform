"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2, Loader2, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateScoringConfig } from "@/app/(admin)/admin/settings/actions";

interface Props {
  initialThreshold: number;
  initialWeights: Record<string, number>;
}

const DEFAULT_CATEGORIES: Array<{ category: string; weight: number }> = [
  { category: "Knowledge & Theory", weight: 30 },
  { category: "Practical Demonstration", weight: 35 },
  { category: "Diagnostics & Fault Finding", weight: 20 },
  { category: "Safety & Workshop Compliance", weight: 15 },
];

export function CategoryWeightsCard({ initialThreshold, initialWeights }: Props) {
  const [threshold, setThreshold] = useState(String(initialThreshold || 60));
  const [weights, setWeights] = useState<Array<{ category: string; weight: number }>>(() => {
    if (initialWeights && Object.keys(initialWeights).length > 0) {
      return Object.entries(initialWeights).map(([category, weight]) => ({ category, weight: Number(weight) || 0 }));
    }
    return DEFAULT_CATEGORIES;
  });

  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const total = weights.reduce((acc, w) => acc + (Number(w.weight) || 0), 0);
  const isComplete = total === 100;

  const handleUpdateWeight = (idx: number, field: "category" | "weight", val: string) => {
    setWeights((prev) => prev.map((w, i) => i === idx ? { ...w, [field]: field === "weight" ? Number(val) || 0 : val } : w));
  };

  const handleAdd = () => setWeights((prev) => [...prev, { category: "New Area", weight: 10 }]);
  const handleRemove = (idx: number) => setWeights((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setStatus("loading"); setMsg(null);
    const weightObj: Record<string, number> = {};
    weights.forEach((w) => { if (w.category.trim()) weightObj[w.category.trim()] = w.weight; });
    const res = await updateScoringConfig(Number(threshold) || 60, weightObj);
    if (res.error) { setStatus("error"); setMsg(res.error); }
    else { setStatus("saved"); setTimeout(() => setStatus("idle"), 2500); }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Scoring & Threshold Configuration</h2>
          <p className="text-muted-foreground text-[11px]">Define passing criteria and core competency weighting.</p>
        </div>
        <Button onClick={handleSave} disabled={status === "loading"} size="sm" className="cursor-pointer text-xs h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
          {status === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : status === "saved" ? <><Check className="size-3.5 mr-1" /> Saved</> : "Save Scoring"}
        </Button>
      </div>
      {msg && <p className="text-destructive text-xs">{msg}</p>}

      <div className="max-w-xs space-y-1">
        <label className="font-semibold block text-foreground">Overall Passing Threshold (%)</label>
        <input type="number" min="0" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full rounded border border-border bg-background p-2 text-xs" />
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <label className="font-semibold block text-foreground">Assessment Category Weights</label>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="h-7 text-xs cursor-pointer gap-1">
            <Plus className="size-3" /> Add Category
          </Button>
        </div>

        <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isComplete ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" : "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]"}`}>
          <div className="flex items-center gap-1.5 font-medium">
            {isComplete ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
            <span>{isComplete ? "Category weights total 100%." : `Weights total ${total}% (target: 100%). Adjust rows.`}</span>
          </div>
          <span className="font-bold">{total}%</span>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {weights.map((w, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-background hover:bg-muted/20">
              <input type="text" value={w.category} onChange={(e) => handleUpdateWeight(idx, "category", e.target.value)} className="flex-1 p-1 rounded border border-transparent hover:border-border text-xs" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="100" value={w.weight} onChange={(e) => handleUpdateWeight(idx, "weight", e.target.value)} className="w-16 p-1 text-right rounded border border-border bg-background text-xs font-semibold" />
                <span className="text-muted-foreground font-semibold">%</span>
              </div>
              {weights.length > 1 && (
                <button type="button" onClick={() => handleRemove(idx)} className="p-1 text-muted-foreground hover:text-destructive cursor-pointer">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg border border-border/80 bg-muted/30 text-muted-foreground text-[11px] leading-relaxed">
        <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600" />
        <span>Any question marked Safety Critical that isn&apos;t passed will always block a &apos;Competent&apos; outcome, regardless of total score — this rule is fixed and applies to every assessment.</span>
      </div>
    </div>
  );
}
