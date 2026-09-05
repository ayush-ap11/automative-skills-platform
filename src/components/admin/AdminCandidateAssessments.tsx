"use client";

import { useState } from "react";
import { CheckSquare, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reassignExaminer } from "@/app/(admin)/admin/candidates/actions";

export interface CandidateAssessmentItem {
  id: string;
  title: string;
  status: string;
  overallScore: number | null;
  evReadinessScore: number | null;
  assignedExaminerId: string | null;
  examinerName: string | null;
}

interface Props {
  assessments: CandidateAssessmentItem[];
  examiners: Array<{ id: string; name: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" },
  under_review: { label: "Under Review", cls: "bg-primary/10 text-primary border-primary/30" },
  submitted: { label: "Submitted", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" },
  in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary border-primary/30" },
  not_started: { label: "Not Started", cls: "bg-muted text-muted-foreground border-border" },
};

export function AdminCandidateAssessments({ assessments, examiners }: Props) {
  const [items, setItems] = useState<CandidateAssessmentItem[]>(assessments);
  const [selectedExaminer, setSelectedExaminer] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "success" | "error">>({});
  const [errorMsg, setErrorMsg] = useState<Record<string, string>>({});

  const handleReassign = async (assessmentId: string) => {
    const newExaminerId = selectedExaminer[assessmentId];
    if (!newExaminerId) return;

    setSavingId(assessmentId);
    setSaveStatus((prev) => ({ ...prev, [assessmentId]: "idle" }));
    setErrorMsg((prev) => ({ ...prev, [assessmentId]: "" }));

    const res = await reassignExaminer(assessmentId, newExaminerId);
    setSavingId(null);

    if (res.error) {
      setSaveStatus((prev) => ({ ...prev, [assessmentId]: "error" }));
      setErrorMsg((prev) => ({ ...prev, [assessmentId]: res.error || "Failed to reassign" }));
    } else {
      const examinerObj = examiners.find((e) => e.id === newExaminerId);
      setItems((prev) => prev.map((a) => a.id === assessmentId ? { ...a, assignedExaminerId: newExaminerId, examinerName: examinerObj?.name || "Examiner" } : a));
      setSaveStatus((prev) => ({ ...prev, [assessmentId]: "success" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [assessmentId]: "idle" })), 3000);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-sm font-bold text-foreground">Vocational Assessments</h3>
        <span className="text-xs text-muted-foreground">{items.length} registered</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">No assessments assigned yet.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || { label: item.status, cls: "bg-muted text-muted-foreground" };
            const currentSelected = selectedExaminer[item.id] ?? (item.assignedExaminerId || "");
            const hasChanged = currentSelected !== (item.assignedExaminerId || "");
            const isSaving = savingId === item.id;
            const state = saveStatus[item.id] || "idle";

            return (
              <div key={item.id} className="py-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary mt-0.5">
                      <CheckSquare className="size-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-medium ${statusConfig.cls}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span>Score: <strong className="text-foreground">{item.overallScore !== null ? `${item.overallScore}%` : "—"}</strong></span>
                        {item.evReadinessScore !== null && (
                          <span>EV Score: <strong className="text-foreground">{item.evReadinessScore}%</strong></span>
                        )}
                        <span>Current Examiner: <strong className="text-foreground">{item.examinerName || "Unassigned"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={currentSelected}
                      onChange={(e) => setSelectedExaminer((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      disabled={isSaving}
                      className="text-xs rounded-lg border border-border bg-background p-1.5 cursor-pointer max-w-[160px] truncate"
                    >
                      <option value="">Select Examiner...</option>
                      {examiners.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      onClick={() => handleReassign(item.id)}
                      disabled={!hasChanged || !currentSelected || isSaving}
                      className="text-xs h-8 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="size-3 animate-spin" /> : state === "success" ? <Check className="size-3 text-[var(--success)]" /> : "Save"}
                    </Button>
                  </div>
                </div>

                {state === "error" && errorMsg[item.id] && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 pl-9.5"><AlertCircle className="size-3" /> {errorMsg[item.id]}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
