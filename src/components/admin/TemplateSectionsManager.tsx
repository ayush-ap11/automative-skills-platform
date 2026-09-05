"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateSectionRow, TemplateSectionItem } from "./TemplateSectionRow";
import { upsertSection, reorderSection, deleteSection } from "@/app/(admin)/admin/assessments/actions";

interface Props {
  templateId: string;
  templateTitle: string;
  initialSections: TemplateSectionItem[];
}

export function TemplateSectionsManager({ templateId, templateTitle, initialSections }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState<TemplateSectionItem[]>(initialSections);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWeight, setNewWeight] = useState("20");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const totalWeight = sections.reduce((sum, s) => sum + (Number(s.weight_pct) || 0), 0);
  const isComplete = totalWeight === 100;

  const handleUpdateSection = async (id: string, title: string, weightPct: number): Promise<string | null> => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return "Section not found";
    const res = await upsertSection(templateId, id, title, sec.order_index, weightPct);
    if (res.error) return res.error;
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title, weight_pct: weightPct } : s)));
    router.refresh();
    return null;
  };

  const handleReorder = async (id: string, dir: "up" | "down") => {
    const res = await reorderSection(id, dir);
    if (res.success) {
      const idx = sections.findIndex((s) => s.id === id);
      const targetIdx = dir === "up" ? idx - 1 : idx + 1;
      if (targetIdx >= 0 && targetIdx < sections.length) {
        const next = [...sections];
        const [moved] = next.splice(idx, 1);
        next.splice(targetIdx, 0, moved);
        setSections(next);
        router.refresh();
      }
    }
  };

  const handleDelete = async (id: string): Promise<string | null> => {
    const res = await deleteSection(id);
    if (res.error) return res.error;
    setSections((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
    return null;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return setAddError("Section title is required.");
    setAddLoading(true);
    setAddError(null);
    const orderIndex = sections.length > 0 ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0;
    const res = await upsertSection(templateId, null, newTitle.trim(), orderIndex, Number(newWeight) || 0);
    setAddLoading(false);
    if (res.error) {
      setAddError(res.error);
    } else {
      setIsAdding(false);
      setNewTitle("");
      setNewWeight("20");
      router.refresh();
      setSections([...sections, { id: crypto.randomUUID(), title: newTitle.trim(), order_index: orderIndex, weight_pct: Number(newWeight) || 0, question_count: 0 }]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/assessments" className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{templateTitle}</h1>
          <p className="text-xs text-muted-foreground">Configure sections, module weighting, and curriculum structure.</p>
        </div>
      </div>

      <div className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${isComplete ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" : "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]"}`}>
        <div className="flex items-center gap-2 font-medium">
          {isComplete ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
          <span>{isComplete ? "Section weights total 100%. Template is properly balanced." : `Section weights currently total ${totalWeight}% (target: 100%). Please adjust section weights.`}</span>
        </div>
        <span className="font-bold text-sm">{totalWeight}%</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Sections & Modules ({sections.length})</span>
          <span>Weight</span>
        </div>

        {sections.length === 0 && !isAdding && (
          <div className="p-8 text-center text-xs text-muted-foreground">No sections configured yet. Add your first section below.</div>
        )}

        {sections.map((sec, idx) => (
          <TemplateSectionRow key={sec.id} section={sec} index={idx} total={sections.length} onUpdate={handleUpdateSection} onReorder={handleReorder} onDelete={handleDelete} />
        ))}

        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="p-3.5 bg-muted/20 border-t border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" placeholder="Section title (e.g. Electrical Diagnostics)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 text-xs rounded border border-border bg-background p-2" required />
              <div className="flex items-center gap-1.5"><input type="number" min="0" max="100" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-16 text-right text-xs rounded border border-border bg-background p-2 font-medium" /><span className="text-xs text-muted-foreground font-semibold">%</span></div>
            </div>
            {addError && <p className="text-[11px] text-destructive">{addError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} disabled={addLoading} className="cursor-pointer text-xs h-7">Cancel</Button>
              <Button type="submit" size="sm" disabled={addLoading} className="cursor-pointer text-xs h-7 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">{addLoading ? <Loader2 className="size-3 animate-spin" /> : "Save Section"}</Button>
            </div>
          </form>
        ) : (
          <div className="p-3 border-t border-border bg-muted/10">
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full text-xs font-semibold cursor-pointer gap-1.5 border-dashed">
              <Plus className="size-3.5" /> Add Section
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
