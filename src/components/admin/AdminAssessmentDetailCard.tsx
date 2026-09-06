"use client";

import { Check, ShieldAlert, Bot, AlertTriangle, UserCheck, Clock } from "lucide-react";

export interface AdminQuestionItem {
  id: string;
  num: number;
  text: string;
  type: string;
  marks: number;
  safetyCritical: boolean;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  answer: {
    selectedOptionIds: string[] | null;
    answerText: string | null;
    transcriptText: string | null;
    audioUrl: string | null;
  } | null;
  aiAnalysis: {
    provisionalScore: number | null;
    technicalScore: number | null;
    safetyScore: number | null;
    diagnosticScore: number | null;
    communicationScore: number | null;
    completenessScore: number | null;
    criticalSafetyFlag: boolean;
    flagReason: string | null;
  } | null;
  review: {
    decision: string | null;
    finalScore: number | null;
    comment: string | null;
  } | null;
}

export function AdminAssessmentDetailCard({ question }: { question: AdminQuestionItem }) {
  const { answer, aiAnalysis, review } = question;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            Q{question.num}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{question.type.replace(/_/g, " ")}</span>
          <span className="text-xs text-muted-foreground">({question.marks} {question.marks === 1 ? "Mark" : "Marks"})</span>
        </div>
        {question.safetyCritical && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-rose-600 bg-rose-500/10 border-rose-500/30">
            <ShieldAlert className="size-3.5" /> Safety Critical
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{question.text}</p>

      {/* Candidate Response */}
      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate Response</p>
        {!answer ? (
          <p className="text-xs text-muted-foreground italic">No answer submitted yet.</p>
        ) : question.type === "verbal" ? (
          <div className="space-y-2">
            <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">{answer.transcriptText || "Transcript recording processing"}</p>
            {answer.audioUrl && <audio controls src={answer.audioUrl} className="h-8 w-full" />}
          </div>
        ) : question.options.length > 0 ? (
          <div className="space-y-1.5">
            {question.options.map((opt) => {
              const isSelected = answer.selectedOptionIds?.includes(opt.id);
              return (
                <div key={opt.id} className={`flex items-center justify-between rounded-md border p-2 text-xs transition ${isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-muted-foreground"}`}>
                  <span>{opt.text}</span>
                  {opt.isCorrect && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Check className="size-3.5" /> Correct Answer</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">{answer.answerText || "—"}</p>
        )}
      </div>

      {/* AI Analysis */}
      {aiAnalysis ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Evaluation</span>
            </div>
            <span className="text-xs font-bold text-foreground">Provisional: {aiAnalysis.provisionalScore !== null ? `${aiAnalysis.provisionalScore}%` : "—"}</span>
          </div>

          {aiAnalysis.criticalSafetyFlag && (
            <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Critical Safety Flag Triggered</p>
                <p className="text-[11px] opacity-90">{aiAnalysis.flagReason || "Safety breach identified in candidate response."}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded bg-muted/30 border border-border"><span className="text-[10px] text-muted-foreground block">Tech</span><span className="font-semibold">{aiAnalysis.technicalScore ?? "—"}%</span></div>
            <div className="p-2 rounded bg-muted/30 border border-border"><span className="text-[10px] text-muted-foreground block">Safety</span><span className="font-semibold">{aiAnalysis.safetyScore ?? "—"}%</span></div>
            <div className="p-2 rounded bg-muted/30 border border-border"><span className="text-[10px] text-muted-foreground block">Diag</span><span className="font-semibold">{aiAnalysis.diagnosticScore ?? "—"}%</span></div>
            <div className="p-2 rounded bg-muted/30 border border-border"><span className="text-[10px] text-muted-foreground block">Comm</span><span className="font-semibold">{aiAnalysis.communicationScore ?? "—"}%</span></div>
            <div className="p-2 rounded bg-muted/30 border border-border"><span className="text-[10px] text-muted-foreground block">Complete</span><span className="font-semibold">{aiAnalysis.completenessScore ?? "—"}%</span></div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <span>AI evaluation not yet generated for this answer.</span>
        </div>
      )}

      {/* Examiner Evaluation */}
      <div className="rounded-lg border border-border bg-muted/15 p-3.5 space-y-2">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-primary" /> Examiner Review
          </span>
          {review ? (
            <span className="text-xs font-bold text-foreground">Awarded: {review.finalScore ?? 0} / {question.marks}</span>
          ) : (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Clock className="size-3" /> Awaiting Review</span>
          )}
        </div>
        {review ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Decision:</span>
              <span className="font-semibold capitalize px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px]">{review.decision?.replace(/_/g, " ") || "Recorded"}</span>
            </div>
            {review.comment && <p className="text-muted-foreground bg-card p-2 rounded border border-border">{review.comment}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Examiner has not yet submitted final scoring for this item.</p>
        )}
      </div>
    </div>
  );
}
