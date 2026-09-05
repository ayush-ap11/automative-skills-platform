"use client";

import React, { useState } from "react";
import { Copy, Loader2, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { duplicateQuestion } from "@/app/(admin)/admin/question-bank/actions";
import { SectionOption } from "./question-bank-types";

interface Props {
  questionId: string;
  sections: SectionOption[];
  onDuplicated: () => void;
}

export function DuplicateQuestionPopover({ questionId, sections, onDuplicated }: Props) {
  const [open, setOpen] = useState(false);
  const [targetSecId, setTargetSecId] = useState(sections[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetSecId) return;
    setLoading(true);
    setError(null);
    const res = await duplicateQuestion(questionId, targetSecId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setOpen(false);
      onDuplicated();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        title="Duplicate to another section"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <Copy className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-3 space-y-2.5 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-semibold text-foreground">Duplicate Question</div>
        <p className="text-[11px] text-muted-foreground">Select destination section for this question copy:</p>
        <select
          value={targetSecId}
          onChange={(e) => setTargetSecId(e.target.value)}
          className="w-full rounded border border-border bg-background p-1.5 text-xs cursor-pointer"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {error && <div className="text-[11px] text-destructive">{error}</div>}
        <div className="flex justify-end gap-1.5 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            disabled={loading}
            className="h-7 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDuplicate}
            disabled={loading || !targetSecId}
            className="h-7 text-xs cursor-pointer gap-1"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Copy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
