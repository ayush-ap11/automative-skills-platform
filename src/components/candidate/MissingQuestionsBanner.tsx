"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";
import { QuestionItem } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";

interface MissingQuestionsBannerProps {
  missingIds: string[];
  questions: QuestionItem[];
  onSelectQuestion: (index: number) => void;
  onDismiss: () => void;
}

export function MissingQuestionsBanner({
  missingIds,
  questions,
  onSelectQuestion,
  onDismiss,
}: MissingQuestionsBannerProps) {
  if (missingIds.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-warning">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Mandatory Questions Incomplete ({missingIds.length})</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer"
          title="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-foreground">
        The following required questions need an answer before this section can be finalized:
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {missingIds.map((id) => {
          const idx = questions.findIndex((q) => q.id === id);
          if (idx === -1) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className="inline-flex items-center gap-1 rounded-md border border-warning/50 bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Question {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
