"use client";

import { useState } from "react";
import { Trash2, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StateRequirementItem {
  id: string;
  state: string;
  applies_to: string | null;
  requirement_text: string;
}

interface Props {
  item: StateRequirementItem;
  onUpdate: (id: string, appliesTo: string, text: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

export function StateRequirementRow({ item, onUpdate, onDelete }: Props) {
  const [appliesTo, setAppliesTo] = useState(item.applies_to || "");
  const [text, setText] = useState(item.requirement_text);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const handleBlurOrSave = async () => {
    if (appliesTo === (item.applies_to || "") && text === item.requirement_text) return;
    if (!text.trim()) return;
    setStatus("loading");
    setMsg(null);
    const err = await onUpdate(item.id, appliesTo, text);
    if (err) {
      setStatus("error");
      setMsg(err);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this state requirement?")) return;
    setStatus("loading");
    setMsg(null);
    const err = await onDelete(item.id);
    if (err) {
      setStatus("error");
      setMsg(err);
    }
  };

  return (
    <div className="p-3.5 space-y-2 border-b border-border last:border-0 bg-card hover:bg-muted/30 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
        <div className="flex-1 w-full space-y-1.5">
          <input
            type="text"
            placeholder="Applies to (e.g. MVIA Licence / Air-con)"
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value)}
            onBlur={handleBlurOrSave}
            className="w-full font-semibold text-xs rounded border border-transparent hover:border-border focus:border-border bg-transparent focus:bg-background p-1"
          />
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlurOrSave}
            className="w-full text-xs rounded border border-border bg-background p-2 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <div className="w-16 flex items-center justify-center text-[11px]">
            {status === "loading" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {status === "saved" && <span className="text-emerald-600 inline-flex items-center gap-0.5 font-medium"><Check className="size-3" /> Saved</span>}
            {status === "error" && <span className="text-destructive font-medium">Error</span>}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={status === "loading"} className="text-muted-foreground hover:text-destructive cursor-pointer h-7 px-2">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {msg && <div className="flex items-center gap-1.5 text-[11px] text-destructive"><AlertCircle className="size-3.5" /><span>{msg}</span></div>}
    </div>
  );
}
