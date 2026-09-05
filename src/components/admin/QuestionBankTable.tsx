"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionFormDialog } from "./QuestionFormDialog";
import { DuplicateQuestionPopover } from "./DuplicateQuestionPopover";
import { QuestionRecord, SectionOption, CATEGORY_PRESETS, QUESTION_TYPES } from "./question-bank-types";

interface Props {
  initialQuestions: QuestionRecord[];
  sections: SectionOption[];
}

export function QuestionBankTable({ initialQuestions, sections }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [qType, setQType] = useState("all");
  const [diff, setDiff] = useState("all");
  const [status, setStatus] = useState("all");
  const [evOnly, setEvOnly] = useState(false);
  const [safetyOnly, setSafetyOnly] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedQ, setSelectedQ] = useState<QuestionRecord | null>(null);

  const filtered = useMemo(() => {
    return initialQuestions.filter((q) => {
      if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "all" && q.skill_category !== category) return false;
      if (qType !== "all" && q.question_type !== qType) return false;
      if (diff !== "all" && q.difficulty !== diff) return false;
      if (status !== "all" && q.status !== status) return false;
      if (evOnly && !q.ev_related) return false;
      if (safetyOnly && !q.safety_critical) return false;
      return true;
    });
  }, [initialQuestions, search, category, qType, diff, status, evOnly, safetyOnly]);

  const openCreate = () => { setSelectedQ(null); setDialogMode("create"); setDialogOpen(true); };
  const openEdit = (q: QuestionRecord) => { setSelectedQ(q); setDialogMode("edit"); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input type="text" placeholder="Search question text..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background" />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto text-xs font-semibold cursor-pointer gap-1.5 shadow-sm bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
          <Plus className="size-4" /> Add Question
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs p-3 rounded-lg border border-border bg-card">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-border bg-background p-1.5 text-xs cursor-pointer">
          <option value="all">All Categories</option>
          {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={qType} onChange={(e) => setQType(e.target.value)} className="rounded border border-border bg-background p-1.5 text-xs cursor-pointer capitalize">
          <option value="all">All Types</option>
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)} className="rounded border border-border bg-background p-1.5 text-xs cursor-pointer capitalize">
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-border bg-background p-1.5 text-xs cursor-pointer capitalize">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option><option value="active">Active</option><option value="retired">Retired</option>
        </select>
        <label className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-background cursor-pointer text-xs font-medium">
          <input type="checkbox" checked={evOnly} onChange={(e) => setEvOnly(e.target.checked)} className="rounded cursor-pointer" />
          <Zap className="size-3 text-amber-500" /> EV Related
        </label>
        <label className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-background cursor-pointer text-xs font-medium">
          <input type="checkbox" checked={safetyOnly} onChange={(e) => setSafetyOnly(e.target.checked)} className="rounded cursor-pointer" />
          <ShieldAlert className="size-3 text-[var(--safety)]" /> Safety Critical
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
          No questions yet — add your first one.
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Question Prompt</th><th className="p-3">Type</th><th className="p-3">Category</th>
                  <th className="p-3">Difficulty</th><th className="p-3">Badges</th><th className="p-3">Status</th>
                  <th className="p-3 text-right">Marks</th><th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => (
                  <tr key={q.id} onClick={() => openEdit(q)} className="hover:bg-muted/40 cursor-pointer transition-colors">
                    <td className="p-3 font-medium text-foreground max-w-xs truncate">{q.question_text}</td>
                    <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/50 capitalize">{q.question_type.replace(/_/g, " ")}</span></td>
                    <td className="p-3 text-muted-foreground">{q.skill_category || "—"}</td>
                    <td className="p-3 capitalize">{q.difficulty}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {q.ev_related && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">EV</span>}
                        {q.safety_critical && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--safety)]/10 text-[var(--safety)] border border-[var(--safety)]/20">Safety</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${q.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : q.status === "retired" ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">{q.marks}</td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <DuplicateQuestionPopover questionId={q.id} sections={sections} onDuplicated={() => router.refresh()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2.5">
            {filtered.map((q) => (
              <div key={q.id} onClick={() => openEdit(q)} className="p-3.5 rounded-xl border border-border bg-card space-y-2 cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-xs text-foreground line-clamp-2">{q.question_text}</p>
                  <div onClick={(e) => e.stopPropagation()}><DuplicateQuestionPopover questionId={q.id} sections={sections} onDuplicated={() => router.refresh()} /></div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 capitalize">{q.question_type.replace(/_/g, " ")}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/50 capitalize">{q.difficulty}</span>
                  {q.ev_related && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20">EV</span>}
                  {q.safety_critical && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-[var(--safety)] bg-[var(--safety)]/10 border border-[var(--safety)]/20">Safety</span>}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ml-auto bg-muted text-muted-foreground">{q.status} • {q.marks}m</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <QuestionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} mode={dialogMode} question={selectedQ} sections={sections} onSaved={() => router.refresh()} />
    </div>
  );
}
