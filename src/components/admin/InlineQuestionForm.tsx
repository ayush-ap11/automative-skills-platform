"use client";

import { AlertCircle, Loader2, Pencil, Plus, Sparkles, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  type QuestionOptionInput,
  upsertQuestion,
} from "@/app/(admin)/admin/question-bank/actions";
import { QuestionOptionsEditor } from "@/components/admin/QuestionOptionsEditor";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_PRESETS,
  QUESTION_TYPES,
  type QuestionRecord,
} from "./question-bank-types";

interface Props {
  sectionId: string;
  sectionTitle: string;
  initialQuestion?: QuestionRecord | null;
  onSuccess: (savedQuestion?: Partial<QuestionRecord>) => void;
  onCancel: () => void;
}

export function InlineQuestionForm({
  sectionId,
  sectionTitle,
  initialQuestion,
  onSuccess,
  onCancel,
}: Props) {
  const isEditing = Boolean(initialQuestion);
  const [text, setText] = useState(initialQuestion?.question_text || "");
  const [qType, setQType] = useState(
    initialQuestion?.question_type || "multiple_choice",
  );
  const [category, setCategory] = useState(
    initialQuestion?.skill_category || "Mechanical",
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    initialQuestion?.difficulty || "medium",
  );
  const [marks, setMarks] = useState(
    initialQuestion?.marks !== undefined ? String(initialQuestion.marks) : "1",
  );
  const [timeLimit, setTimeLimit] = useState(
    initialQuestion?.time_limit_seconds
      ? String(initialQuestion.time_limit_seconds)
      : "",
  );
  const [mapping, setMapping] = useState(
    (initialQuestion?.competency_mapping || []).join(", "),
  );
  const [explanation, setExplanation] = useState(
    initialQuestion?.explanation || "",
  );
  const [mandatory, setMandatory] = useState(
    initialQuestion ? Boolean(initialQuestion.mandatory) : true,
  );
  const [aiEnabled, setAiEnabled] = useState(
    initialQuestion ? Boolean(initialQuestion.ai_evaluation_enabled) : true,
  );
  const [evRelated, setEvRelated] = useState(
    initialQuestion ? Boolean(initialQuestion.ev_related) : false,
  );
  const [safetyCritical, setSafetyCritical] = useState(
    initialQuestion ? Boolean(initialQuestion.safety_critical) : false,
  );
  const [status, setStatus] = useState<"draft" | "active" | "retired">(
    initialQuestion?.status || "active",
  );
  const [options, setOptions] = useState<QuestionOptionInput[]>(
    initialQuestion?.question_options &&
      initialQuestion.question_options.length > 0
      ? initialQuestion.question_options.map((o) => ({
          text: o.option_text,
          isCorrect: o.is_correct,
        }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMsg("Question cannot be empty.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const res = await upsertQuestion(
      sectionId,
      initialQuestion?.id || null,
      {
        questionText: text,
        questionType: qType,
        skillCategory: category,
        difficulty,
        explanation,
        competencyMapping: mapping
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        marks: Number(marks) || 1,
        timeLimitSeconds: timeLimit ? Number(timeLimit) : null,
        mandatory,
        aiEvaluationEnabled: aiEnabled,
        evRelated,
        safetyCritical,
        status,
      },
      options,
    );

    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onSuccess({
        id: initialQuestion?.id || res.id,
        section_id: sectionId,
        question_text: text,
        question_type: qType,
        skill_category: category,
        difficulty,
        explanation,
        competency_mapping: mapping
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        marks: Number(marks) || 1,
        time_limit_seconds: timeLimit ? Number(timeLimit) : null,
        mandatory,
        ai_evaluation_enabled: aiEnabled,
        ev_related: evRelated,
        safety_critical: safetyCritical,
        status,
        question_options: options.map((o, idx) => ({
          id: `opt-${idx}`,
          option_text: o.text,
          is_correct: o.isCorrect,
        })),
      });
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.02] p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            {isEditing ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {isEditing ? "Edit Question" : "Add New Question"}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {isEditing ? (
                <>
                  Editing question in{" "}
                  <span className="font-semibold text-foreground">
                    "{sectionTitle}"
                  </span>
                </>
              ) : (
                <>
                  Directly saves into{" "}
                  <span className="font-semibold text-foreground">
                    "{sectionTitle}"
                  </span>{" "}
                  and the shared Question Bank
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="inline-q-prompt"
            className="font-semibold block mb-1 text-foreground"
          >
            Question *
          </label>
          <textarea
            id="inline-q-prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="e.g. What is the mandatory procedure for verifying zero voltage on a high-voltage battery disconnect?"
            className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="inline-q-type"
              className="font-semibold block mb-1 text-foreground"
            >
              Question Type
            </label>
            <select
              id="inline-q-type"
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs cursor-pointer capitalize text-foreground"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="inline-q-category"
              className="font-semibold block mb-1 text-foreground"
            >
              Skill Category
            </label>
            <input
              id="inline-q-category"
              list="inline-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. EV, Electrical"
              className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
            />
            <datalist id="inline-categories">
              {CATEGORY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="inline-q-difficulty"
              className="font-semibold block mb-1 text-foreground"
            >
              Difficulty
            </label>
            <select
              id="inline-q-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs capitalize cursor-pointer text-foreground"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="inline-q-marks"
              className="font-semibold block mb-1 text-foreground"
            >
              Marks *
            </label>
            <input
              id="inline-q-marks"
              type="number"
              min="0.5"
              step="0.5"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs font-semibold text-foreground"
              required
            />
          </div>

          <div>
            <label
              htmlFor="inline-q-timelimit"
              className="font-semibold block mb-1 text-foreground"
            >
              Time Limit (Sec)
            </label>
            <input
              id="inline-q-timelimit"
              type="number"
              min="0"
              placeholder="Optional (e.g. 120)"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="inline-q-mapping"
              className="font-semibold block mb-1 text-foreground"
            >
              AUR Unit Codes
            </label>
            <input
              id="inline-q-mapping"
              type="text"
              placeholder="e.g. AURETR005, AURAEA002"
              value={mapping}
              onChange={(e) => setMapping(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="inline-q-explanation"
            className="font-semibold block mb-1 text-foreground"
          >
            Explanation / Examiner Rationale
          </label>
          <textarea
            id="inline-q-explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="Key marking points or justification for the correct answer..."
            className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
          />
        </div>

        {/* Badges / Flags */}
        <div className="p-3 rounded-lg border border-border/80 bg-background grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
              className="rounded cursor-pointer"
            />
            <span>Mandatory</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="rounded cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-primary" /> AI Eval
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={evRelated}
              onChange={(e) => setEvRelated(e.target.checked)}
              className="rounded cursor-pointer"
            />
            <span className="text-amber-600 font-semibold">EV Related</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={safetyCritical}
              onChange={(e) => setSafetyCritical(e.target.checked)}
              className="rounded cursor-pointer"
            />
            <span className="text-[var(--safety)] font-semibold">
              Safety Critical
            </span>
          </label>
        </div>

        {/* Options Editor */}
        <div className="pt-2 border-t border-border/70">
          <QuestionOptionsEditor
            questionType={qType}
            options={options}
            onChange={setOptions}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="cursor-pointer text-xs bg-primary text-primary-foreground hover:opacity-90 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving
                Question...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Save Question to Section"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
