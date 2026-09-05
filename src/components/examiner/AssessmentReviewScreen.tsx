"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { QuestionReviewCard, QuestionData, CandidateAnswerData, ExistingReviewData } from "@/components/examiner/QuestionReviewCard";
import { AiAnalysisData } from "@/components/examiner/AiAnalysisPanel";
import { saveDraft, finalizeOutcome } from "@/app/(examiner)/examiner/assessments/[id]/review/finalize-actions";

export interface CandidateInfo {
  id: string; fullName: string; currentRole: string | null; yearsExperience: number | null;
}

export interface SectionGroup {
  id: string; title: string; order_index: number;
  questions: Array<{
    question: QuestionData; answer: CandidateAnswerData | null;
    aiAnalysis: AiAnalysisData | null; existingReview: ExistingReviewData | null;
  }>;
}

export function AssessmentReviewScreen({
  assessmentId, assessmentTitle, status, overallScore, evReadinessScore, candidate, sections, blindMode,
}: {
  assessmentId: string; assessmentTitle: string; status: string; overallScore: number | null;
  evReadinessScore: number | null; candidate: CandidateInfo; sections: SectionGroup[]; blindMode?: boolean;
}) {
  const router = useRouter();
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftToast, setDraftToast] = useState(false);
  const [finalizing, setFinalizing] = useState<"competent" | "not_yet_competent" | null>(null);
  const [blockingError, setBlockingError] = useState<{ message: string; questions?: number[] } | null>(null);

  const handleSaveDraft = async () => {
    setIsDrafting(true); setBlockingError(null);
    const res = await saveDraft(assessmentId);
    setIsDrafting(false);
    if (res.success) { setDraftToast(true); setTimeout(() => setDraftToast(false), 3000); }
  };

  const handleFinalize = async (outcome: "competent" | "not_yet_competent") => {
    setFinalizing(outcome); setBlockingError(null);
    const res = await finalizeOutcome(assessmentId, outcome);
    setFinalizing(null);

    if (res.success) {
      router.push("/examiner/assessments");
    } else if (res.error === "incomplete") {
      setBlockingError({ message: "Mandatory questions require review:", questions: res.missingQuestions });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (res.error === "safety_block") {
      setBlockingError({ message: "Safety-critical questions require resolution:", questions: res.blockingQuestions });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setBlockingError({ message: res.error || "An error occurred during finalization." });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <Link href="/examiner/assessments" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="size-3.5" /> Back to Queue
      </Link>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            {blindMode ? (
              <span className="font-semibold text-foreground">Candidate #{candidate.id.slice(0, 8)}</span>
            ) : (
              <Link href={`/examiner/candidates/${candidate.id}`} className="font-semibold text-foreground hover:underline cursor-pointer">
                {candidate.fullName}
              </Link>
            )}
            <span className="text-xs text-muted-foreground">• {candidate.currentRole || "Technician"} ({candidate.yearsExperience ?? "—"} yrs)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {evReadinessScore !== null && <span className="font-semibold text-secondary">EV: {evReadinessScore}%</span>}
            <span className="font-bold text-foreground">Score: {overallScore !== null ? `${overallScore}%` : "—"}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
          </div>
        </div>
        <h1 className="text-lg font-bold text-foreground">{assessmentTitle}</h1>
      </div>

      {draftToast && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs font-medium text-primary flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Draft saved. Status updated to under review.
        </div>
      )}

      {blockingError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3.5 text-xs font-medium text-destructive flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4 shrink-0" /> {blockingError.message}</div>
            {blockingError.questions && (
              <div className="flex flex-wrap gap-1 pl-5">
                {blockingError.questions.map((qNum) => (
                  <button key={qNum} type="button" onClick={() => document.getElementById(`question-${qNum}`)?.scrollIntoView({ behavior: "smooth" })} className="rounded bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-bold hover:opacity-85 cursor-pointer">
                    Q{qNum}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={() => setBlockingError(null)} className="text-destructive hover:opacity-70 cursor-pointer"><X className="size-4" /></button>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((sec) => (
          <div key={sec.id} className="space-y-4">
            <div className="sticky top-16 z-10 rounded-lg border border-border bg-card/95 p-2.5 backdrop-blur shadow-xs">
              <h2 className="text-xs font-bold tracking-tight text-foreground uppercase">{sec.title}</h2>
            </div>
            <div className="space-y-4">
              {sec.questions.map((q) => (
                <QuestionReviewCard key={q.question.id} assessmentId={assessmentId} question={q.question} answer={q.answer} aiAnalysis={q.aiAnalysis} existingReview={q.existingReview} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur px-6 py-3.5 shadow-lg">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">Review each question before finalizing competency determination.</span>
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={handleSaveDraft} disabled={isDrafting || Boolean(finalizing)} className="rounded-lg border border-input bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer">
              {isDrafting ? <Loader2 className="size-3.5 animate-spin" /> : "Save Draft"}
            </button>
            <button type="button" onClick={() => handleFinalize("not_yet_competent")} disabled={Boolean(finalizing) || isDrafting} className="rounded-lg border border-warning text-warning bg-warning/5 px-3.5 py-2 text-xs font-semibold hover:bg-warning/10 disabled:opacity-50 cursor-pointer">
              {finalizing === "not_yet_competent" ? <Loader2 className="size-3.5 animate-spin" /> : "Mark Not Yet Competent"}
            </button>
            <button type="button" onClick={() => handleFinalize("competent")} disabled={Boolean(finalizing) || isDrafting} className="rounded-lg bg-success text-success-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
              {finalizing === "competent" ? <Loader2 className="size-3.5 animate-spin" /> : "Mark Competent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
