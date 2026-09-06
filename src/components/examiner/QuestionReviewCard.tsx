"use client";

import { useState } from "react";
import { Check, ShieldAlert, Play, Loader2, CheckCircle2 } from "lucide-react";
import { AiAnalysisPanel, AiAnalysisData } from "@/components/examiner/AiAnalysisPanel";
import { saveQuestionReview, getVerbalAudioUrl } from "@/app/(examiner)/examiner/assessments/[id]/review/actions";

interface QuestionOptionData { id: string; option_text: string; is_correct: boolean; }

export interface QuestionData {
  id: string; questionNumber: number; question_text: string; question_type: string;
  safety_critical: boolean; mandatory: boolean; marks: number; image_url?: string | null;
  options?: QuestionOptionData[];
}

export interface CandidateAnswerData {
  id: string; selected_option_ids: string[] | null; answer_text: string | null;
  verbal_answer?: { id: string; transcript_text?: string | null } | null;
}
export interface ExistingReviewData {
  decision?: "accept_ai_score" | "modify_score" | "request_reassessment" | null;
  final_score?: number | null; comment?: string | null;
}
interface QuestionReviewCardProps {
  assessmentId: string; question: QuestionData; answer: CandidateAnswerData | null;
  aiAnalysis: AiAnalysisData | null; existingReview?: ExistingReviewData | null;
  onReviewSaved?: (qNum: number, decision: string, score: number) => void;
}

export function QuestionReviewCard({
  assessmentId, question, answer, aiAnalysis, existingReview, onReviewSaved,
}: QuestionReviewCardProps) {
  const [score, setScore] = useState<number | "">(existingReview?.final_score ?? aiAnalysis?.provisional_score ?? "");
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [decision, setDecision] = useState<"accept_ai_score" | "modify_score" | "request_reassessment">(
    existingReview?.decision ?? "accept_ai_score"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const handlePlayAudio = async () => {
    if (!answer?.verbal_answer?.id || audioUrl) return;
    setLoadingAudio(true);
    const res = await getVerbalAudioUrl(answer.verbal_answer.id);
    setLoadingAudio(false);
    if (res.url) setAudioUrl(res.url);
  };

  const handleSave = async () => {
    if (!answer) return;
    setIsSaving(true);
    setSaveStatus("idle");
    const numScore = score === "" ? 0 : Number(score);
    const res = await saveQuestionReview(assessmentId, answer.id, {
      finalScore: numScore,
      comment,
      decision,
    });
    setIsSaving(false);
    if (res.success) {
      setSaveStatus("saved");
      onReviewSaved?.(question.questionNumber, decision, numScore);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  };

  return (
    <div id={`question-${question.questionNumber}`} className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            Q{question.questionNumber}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{question.question_type.replace(/_/g, " ")}</span>
        </div>
        {question.safety_critical && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-safety" style={{ borderColor: "var(--safety)", backgroundColor: "color-mix(in srgb, var(--safety) 10%, transparent)" }}>
            <ShieldAlert className="size-3.5" /> Safety Critical
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{question.question_text}</p>

      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate Response</p>
        {!answer ? (
          <p className="text-xs text-muted-foreground italic">No answer submitted.</p>
        ) : question.question_type === "verbal" ? (
          <div className="space-y-2">
            <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">{answer.verbal_answer?.transcript_text || "Transcript still processing"}</p>
            {audioUrl ? (
              <audio controls src={audioUrl} autoPlay className="h-8 w-full" />
            ) : (
              <button type="button" onClick={handlePlayAudio} disabled={loadingAudio} className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer">
                {loadingAudio ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3 text-primary" />} Play Verbal Recording
              </button>
            )}
          </div>
        ) : question.options && question.options.length > 0 ? (
          <div className="space-y-1.5">
            {question.options.map((opt) => {
              const isSelected = answer.selected_option_ids?.includes(opt.id);
              return (
                <div key={opt.id} className={`flex items-center justify-between rounded-md border p-2 text-xs transition ${isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-muted-foreground"}`}>
                  <span>{opt.option_text}</span>
                  {opt.is_correct && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success"><Check className="size-3.5" /> Correct</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">{answer.answer_text || "—"}</p>
        )}
      </div>

      <AiAnalysisPanel analysis={aiAnalysis} />

      <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground">Final Score (Max {question.marks}):</label>
            <input type="number" min={0} max={question.marks} value={score} onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))} className="h-8 w-20 rounded border border-input bg-card px-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["accept_ai_score", "modify_score", "request_reassessment"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDecision(d)} className={`rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer transition ${decision === d ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted"}`}>
                {d === "accept_ai_score" ? "Accept AI Score" : d === "modify_score" ? "Modify Score" : "Request Reassessment"}
              </button>
            ))}
          </div>
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Examiner comment and feedback notes..." rows={2} className="w-full rounded-md border border-input bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden" />
        <div className="flex items-center justify-end gap-2">
          {saveStatus === "saved" && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="size-3.5" /> Saved</span>}
          {saveStatus === "error" && <span className="text-xs text-destructive">Failed to save review</span>}
          <button type="button" onClick={handleSave} disabled={isSaving || !answer} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer">
            {isSaving && <Loader2 className="size-3 animate-spin" />} Save Question Review
          </button>
        </div>
      </div>
    </div>
  );
}
