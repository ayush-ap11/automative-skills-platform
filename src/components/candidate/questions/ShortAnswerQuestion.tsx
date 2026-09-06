"use client";

import { QuestionItem, AnswerDraft } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";

interface ShortAnswerQuestionProps {
  question: QuestionItem;
  answer: AnswerDraft;
  onChange: (updated: AnswerDraft) => void;
  disabled?: boolean;
}

export function ShortAnswerQuestion({
  answer,
  onChange,
  disabled = false,
}: ShortAnswerQuestionProps) {
  const currentText = answer.answerText || "";

  return (
    <div className="space-y-2">
      <textarea
        rows={5}
        value={currentText}
        disabled={disabled}
        onChange={(e) =>
          onChange({
            ...answer,
            answerText: e.target.value,
          })
        }
        placeholder="Type your technical explanation or diagnosis here..."
        className="w-full rounded-lg border border-input bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <div className="flex justify-end text-xs text-muted-foreground">
        <span>{currentText.length} characters</span>
      </div>
    </div>
  );
}
