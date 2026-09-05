"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { ObservationChecklistRow, ChecklistItemData } from "@/components/examiner/ObservationChecklistRow";
import { createObservation } from "@/app/(examiner)/examiner/practical/actions";

const DEFAULT_ITEMS = [
  "Identified HV components", "Followed manufacturer procedure", "Identified hazards",
  "Used appropriate PPE", "Established safe work area", "Applied isolation procedure",
  "Verified isolation", "Followed repair procedure", "Completed documentation",
];
const PRESETS = ["BEV Safety Observation", "Diagnostic Procedure Observation", "HV Isolation Observation"];
const RANKS: Record<string, number> = { not_demonstrated: 1, developing: 2, competent: 3, highly_competent: 4 };
const RANK_MAP: Record<number, "not_demonstrated" | "developing" | "competent" | "highly_competent"> = {
  1: "not_demonstrated", 2: "developing", 3: "competent", 4: "highly_competent",
};

export interface AssessmentOption { id: string; candidateName: string; templateTitle: string; }

export function NewObservationForm({ assessments }: { assessments: AssessmentOption[] }) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id || "");
  const [taskTitle, setTaskTitle] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItemData[]>(
    DEFAULT_ITEMS.map((label, i) => ({ id: `init-${i}`, label, rating: "", comment: "" }))
  );
  const [overallRating, setOverallRating] = useState<"not_demonstrated" | "developing" | "competent" | "highly_competent">("competent");
  const [manualOverride, setManualOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const updateItem = (index: number, updated: ChecklistItemData) => {
    const next = [...checklist];
    next[index] = updated;
    setChecklist(next);
    if (!manualOverride) {
      const rated = next.map((it) => RANKS[it.rating]).filter(Boolean);
      if (rated.length > 0) setOverallRating(RANK_MAP[Math.min(...rated)]);
    }
  };

  const addItem = () => setChecklist([...checklist, { id: `item-${Date.now()}`, label: "", rating: "", comment: "" }]);
  const removeItem = (index: number) => setChecklist(checklist.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError(null);
    if (!assessmentId) return setError("Please select an assessment.");
    if (!taskTitle.trim()) return setError("Task title is required.");
    if (checklist.some((it) => !it.rating)) return setError("Every checklist item must have a performance rating before saving.");

    setIsSubmitting(true);
    const res = await createObservation(assessmentId, taskTitle, checklist as any, overallRating);
    setIsSubmitting(false);
    if (res.success && res.id) router.push(`/examiner/practical/${res.id}`);
    else setError(res.error || "Failed to save observation.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3.5 text-xs font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Assessment & Candidate *</label>
          <select value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground cursor-pointer focus:border-primary focus:outline-hidden">
            {assessments.map((a) => (<option key={a.id} value={a.id}>{a.candidateName} — {a.templateTitle}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-foreground">Task Title *</label>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setTaskTitle(p)} className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. High Voltage Isolation and Verification Observation" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Practical Demonstration Checklist</h3>
            <p className="text-xs text-muted-foreground">Every criterion must be evaluated with a rating.</p>
          </div>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition">
            <Plus className="size-3.5" /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {checklist.map((item, idx) => (
            <ObservationChecklistRow key={item.id} index={idx} item={item} onUpdate={(up) => updateItem(idx, up)} onRemove={() => removeItem(idx)} showError={attemptedSubmit} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <label className="text-xs font-bold text-foreground">Overall Practical Outcome *</label>
          <p className="text-xs text-muted-foreground">Defaults to lowest rated item. Overridable by examiner.</p>
        </div>
        <select value={overallRating} onChange={(e) => { setOverallRating(e.target.value as any); setManualOverride(true); }} className="h-10 w-48 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground cursor-pointer focus:border-primary focus:outline-hidden">
          <option value="not_demonstrated">Not Demonstrated</option>
          <option value="developing">Developing</option>
          <option value="competent">Competent</option>
          <option value="highly_competent">Highly Competent</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer transition">
          {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : "Save Observation"}
        </button>
      </div>
    </form>
  );
}
