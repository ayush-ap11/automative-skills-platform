"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TemplateSectionItem {
  id: string;
  title: string;
  order_index: number;
  weight_pct: number;
  question_count: number;
}

interface Props {
  section: TemplateSectionItem;
  index: number;
  total: number;
  onUpdate: (id: string, title: string, weightPct: number) => Promise<string | null>;
  onReorder: (id: string, dir: "up" | "down") => Promise<void>;
  onDelete: (id: string) => Promise<string | null>;
}

export function TemplateSectionRow({ section, index, total, onUpdate, onReorder, onDelete }: Props) {
  const [title, setTitle] = useState(section.title);
  const [weight, setWeight] = useState(String(section.weight_pct));
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [rowMsg, setRowMsg] = useState<string | null>(null);

  const handleBlurOrSave = async () => {
    if (title === section.title && Number(weight) === section.weight_pct) return;
    setStatus("loading");
    setRowMsg(null);
    const err = await onUpdate(section.id, title, Number(weight) || 0);
    if (err) {
      setStatus("error");
      setRowMsg(err);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleDelete = async () => {
    if (section.question_count > 0) {
      setRowMsg("Remove or reassign its questions in the Question Bank first");
      setStatus("error");
      return;
    }
    if (!confirm(`Delete section "${section.title}"?`)) return;
    setStatus("loading");
    setRowMsg(null);
    const err = await onDelete(section.id);
    if (err) {
      setStatus("error");
      setRowMsg(err === "has_questions" ? "Remove or reassign its questions in the Question Bank first" : err);
    }
  };

  return (
    <div className="p-3.5 space-y-2 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={index === 0 || status === "loading"}
              onClick={() => onReorder(section.id, "up")}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={index === total - 1 || status === "loading"}
              onClick={() => onReorder(section.id, "down")}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            >
              <ArrowDown className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlurOrSave}
              className="w-full font-semibold text-xs rounded border border-transparent hover:border-border focus:border-border bg-transparent focus:bg-background p-1.5"
            />
            <div className="text-[11px] text-muted-foreground pl-1.5">
              {section.question_count} {section.question_count === 1 ? "question" : "questions"} (Manage in Question Bank)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={handleBlurOrSave}
              className="w-16 text-right font-medium text-xs rounded border border-border bg-background p-1.5"
            />
            <span className="text-xs text-muted-foreground font-semibold">%</span>
          </div>

          <div className="w-16 flex items-center justify-center text-[11px]">
            {status === "loading" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {status === "saved" && <span className="text-emerald-600 inline-flex items-center gap-0.5 font-medium"><Check className="size-3" /> Saved</span>}
            {status === "error" && <span className="text-destructive font-medium">Error</span>}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={status === "loading"}
            className="text-muted-foreground hover:text-destructive cursor-pointer h-7 px-2"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {rowMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-destructive pl-7">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{rowMsg}</span>
        </div>
      )}
    </div>
  );
}
