"use client";

import { QuestionItem, AnswerDraft } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";
import { ShortAnswerQuestion } from "./ShortAnswerQuestion";

interface ChoiceQuestionProps {
  question: QuestionItem;
  answer: AnswerDraft;
  onChange: (updated: AnswerDraft) => void;
  disabled?: boolean;
}

export function ChoiceQuestion({ question, answer, onChange, disabled = false }: ChoiceQuestionProps) {
  if (question.question_type === "image_based" && (!question.options || question.options.length === 0)) {
    return (
      <div className="space-y-4">
        {question.image_url && (
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.image_url}
              alt="Assessment diagram"
              className="max-h-72 w-full object-contain rounded"
            />
          </div>
        )}
        <ShortAnswerQuestion question={question} answer={answer} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  const selectedId = answer.selectedOptionIds[0] || null;

  function handleSelect(optionId: string) {
    if (disabled) return;
    onChange({
      ...answer,
      selectedOptionIds: [optionId],
    });
  }

  return (
    <div className="space-y-4">
      {question.image_url && (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.image_url}
            alt="Technical diagram"
            className="max-h-72 w-full object-contain rounded"
          />
        </div>
      )}

      <div className="space-y-2.5">
        {(question.options || []).map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          const letter = String.fromCharCode(65 + idx);

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`flex items-center gap-3 rounded-lg border p-3.5 transition-colors cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground shadow-xs"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30"
              } ${disabled ? "pointer-events-none opacity-60" : ""}`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {letter}
              </div>

              <span className="flex-1 text-sm font-medium">{opt.option_text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
