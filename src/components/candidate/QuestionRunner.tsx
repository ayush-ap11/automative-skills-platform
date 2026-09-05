"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, ArrowLeft, ArrowRight, Loader2, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionItem, AnswerDraft } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";
import { saveAnswer, completeSection } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/actions";
import { ChoiceQuestion } from "@/components/candidate/questions/ChoiceQuestion";
import { MultipleAnswerQuestion } from "@/components/candidate/questions/MultipleAnswerQuestion";
import { ShortAnswerQuestion } from "@/components/candidate/questions/ShortAnswerQuestion";
import { MissingQuestionsBanner } from "@/components/candidate/MissingQuestionsBanner";

interface QuestionRunnerProps {
  assessmentId: string;
  sectionId: string;
  sectionTitle: string;
  questions: QuestionItem[];
  initialAnswers: Record<string, AnswerDraft>;
}

export function QuestionRunner({
  assessmentId,
  sectionId,
  sectionTitle,
  questions,
  initialAnswers,
}: QuestionRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>(initialAnswers);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [missingIds, setMissingIds] = useState<string[]>([]);

  const total = questions.length;
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAnswer = answers[currentQ.id] || { selectedOptionIds: [], answerText: "" };
  const isFlagged = flaggedIds.has(currentQ.id);
  const isLast = currentIndex === total - 1;

  function handleDraftChange(updated: AnswerDraft) {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
  }

  function toggleFlag() {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) next.delete(currentQ.id);
      else next.add(currentQ.id);
      return next;
    });
  }

  async function handleSaveAndContinue() {
    setSaveStatus("saving");
    const saveRes = await saveAnswer(assessmentId, currentQ.id, currentAnswer);
    if (saveRes.error) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saved");

    if (isLast) {
      const compRes = await completeSection(assessmentId, sectionId);
      if (!compRes.success && compRes.missingQuestionIds) {
        setMissingIds(compRes.missingQuestionIds);
        setSaveStatus("idle");
      } else {
        router.push(`/assessments/${assessmentId}/take`);
      }
    } else {
      setTimeout(() => {
        setSaveStatus("idle");
        setCurrentIndex((i) => i + 1);
      }, 300);
    }
  }

  function renderQuestionBody() {
    switch (currentQ.question_type) {
      case "multiple_answer":
        return <MultipleAnswerQuestion question={currentQ} answer={currentAnswer} onChange={handleDraftChange} />;
      case "short_answer":
        return <ShortAnswerQuestion question={currentQ} answer={currentAnswer} onChange={handleDraftChange} />;
      default:
        return <ChoiceQuestion question={currentQ} answer={currentAnswer} onChange={handleDraftChange} />;
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-foreground">{sectionTitle}</span>
          <span>Question {currentIndex + 1} of {total}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>
      </div>

      <MissingQuestionsBanner missingIds={missingIds} questions={questions} onSelectQuestion={(idx) => { setMissingIds([]); setCurrentIndex(idx); }} onDismiss={() => setMissingIds([])} />

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {currentQ.time_limit_seconds && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {Math.ceil(currentQ.time_limit_seconds / 60)} min suggested
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold leading-snug text-foreground">{currentQ.question_text}</h2>
          </div>
          <button type="button" onClick={toggleFlag} className={`rounded-lg border p-2 transition-colors cursor-pointer ${isFlagged ? "border-amber-300 bg-amber-50 text-amber-600" : "border-border text-muted-foreground hover:bg-muted/50"}`} title={isFlagged ? "Remove flag" : "Flag to review later"}>
            <Flag className={`h-4 w-4 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
        </div>

        {renderQuestionBody()}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" disabled={currentIndex === 0 || saveStatus === "saving"} onClick={() => { setSaveStatus("idle"); setCurrentIndex((i) => i - 1); }} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous
          </Button>

          <Button type="button" disabled={saveStatus === "saving"} onClick={handleSaveAndContinue} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 min-w-36">
            {saveStatus === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : saveStatus === "saved" ? <><Check className="mr-2 h-4 w-4" />Saved</> : <>{isLast ? "Finish Section" : "Save & Continue"}<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
