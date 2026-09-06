"use client";

import { Check } from "lucide-react";
import { QuestionItem, AnswerDraft } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";

interface MultipleAnswerQuestionProps {
  question: QuestionItem;
  answer: AnswerDraft;
  onChange: (updated: AnswerDraft) => void;
  disabled?: boolean;
}

export function MultipleAnswerQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MultipleAnswerQuestionProps) {
  const selectedIds = new Set(answer.selectedOptionIds || []);

  function handleToggle(optionId: string) {
    if (disabled) return;
    const next = new Set(selectedIds);
    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
    }
    onChange({
      ...answer,
      selectedOptionIds: Array.from(next),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
        <span>Select all correct answers that apply.</span>
      </div>

      <div className="space-y-2.5">
        {(question.options || []).map((opt) => {
          const isSelected = selectedIds.has(opt.id);

          return (
            <div
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
              className={`flex items-center gap-3 rounded-lg border p-3.5 transition-colors cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground shadow-xs"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30"
              } ${disabled ? "pointer-events-none opacity-60" : ""}`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>

              <span className="flex-1 text-sm font-medium">{opt.option_text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
