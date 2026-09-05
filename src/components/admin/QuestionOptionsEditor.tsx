"use client";

import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { QuestionOptionInput } from "@/app/(admin)/admin/question-bank/actions";

interface Props {
  questionType: string;
  options: QuestionOptionInput[];
  onChange: (options: QuestionOptionInput[]) => void;
}

export function QuestionOptionsEditor({ questionType, options, onChange }: Props) {
  const isChoiceType = ["multiple_choice", "multiple_answer", "true_false", "scenario"].includes(questionType);
  if (!isChoiceType) return null;

  const isSingleSelect = questionType !== "multiple_answer";

  const handleTextChange = (idx: number, text: string) => {
    onChange(options.map((opt, i) => i === idx ? { ...opt, text } : opt));
  };

  const handleCorrectToggle = (idx: number) => {
    if (isSingleSelect) {
      onChange(options.map((opt, i) => ({ ...opt, isCorrect: i === idx })));
    } else {
      onChange(options.map((opt, i) => i === idx ? { ...opt, isCorrect: !opt.isCorrect } : opt));
    }
  };

  const handleAdd = () => {
    onChange([...options, { text: "", isCorrect: false }]);
  };

  const handleRemove = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2.5 rounded-lg border border-border p-3.5 bg-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Answer Choices</h4>
          <p className="text-[11px] text-muted-foreground">
            {isSingleSelect ? "Select exactly one correct answer." : "Select one or more correct answers."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          <Plus className="size-3.5" /> Add Option
        </button>
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCorrectToggle(idx)}
              title={opt.isCorrect ? "Correct answer" : "Mark as correct"}
              className={`flex size-6 shrink-0 items-center justify-center rounded-md border text-xs cursor-pointer transition-colors ${
                opt.isCorrect ? "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="size-3.5" />
            </button>
            <input
              type="text"
              value={opt.text}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1} text...`}
              className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
