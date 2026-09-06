"use client";

import {
  Check,
  Database,
  Loader2,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { addQuestionsFromBank } from "@/app/(admin)/admin/assessments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_PRESETS, type QuestionRecord } from "./question-bank-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSectionId: string;
  targetSectionTitle: string;
  availableQuestions: QuestionRecord[];
  onQuestionsAdded: (added?: QuestionRecord[]) => void;
}

export function QuestionBankSelectorModal({
  open,
  onOpenChange,
  targetSectionId,
  targetSectionTitle,
  availableQuestions,
  onQuestionsAdded,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [evOnly, setEvOnly] = useState(false);
  const [safetyOnly, setSafetyOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return availableQuestions.filter((q) => {
      if (
        search &&
        !q.question_text.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (category !== "all" && q.skill_category !== category) return false;
      if (difficulty !== "all" && q.difficulty !== difficulty) return false;
      if (evOnly && !q.ev_related) return false;
      if (safetyOnly && !q.safety_critical) return false;
      return true;
    });
  }, [availableQuestions, search, category, difficulty, evOnly, safetyOnly]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filtered.map((q) => q.id);
    const areAllSelected = allFilteredIds.every((id) =>
      selectedIds.includes(id),
    );
    if (areAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...allFilteredIds])),
      );
    }
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0 || !targetSectionId) return;
    setLoading(true);
    setErrorMsg(null);
    const res = await addQuestionsFromBank(selectedIds, targetSectionId);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      const added = availableQuestions.filter((q) =>
        selectedIds.includes(q.id),
      );
      setSelectedIds([]);
      onOpenChange(false);
      onQuestionsAdded(added);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Database className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Choose from Question Bank
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import questions into{" "}
                <span className="font-semibold text-foreground">
                  "{targetSectionTitle}"
                </span>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by question or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs cursor-pointer text-foreground"
              >
                <option value="all">All Categories</option>
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs cursor-pointer capitalize text-foreground"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={evOnly}
                  onChange={(e) => setEvOnly(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <Zap className="size-3.5 text-amber-500" /> EV Only
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={safetyOnly}
                  onChange={(e) => setSafetyOnly(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <ShieldAlert className="size-3.5 text-[var(--safety)]" /> Safety
                Critical Only
              </label>
            </div>

            {filtered.length > 0 && (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                {filtered.every((q) => selectedIds.includes(q.id))
                  ? "Deselect All Visible"
                  : "Select All Visible"}
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs border-b border-destructive/20 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No questions found matching your filter criteria in the question
              bank.
            </div>
          ) : (
            filtered.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelect(q.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSelect(q.id);
                    }
                  }}
                  className={`py-3 px-3.5 rounded-lg flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      className="rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium uppercase tracking-wider">
                        {q.question_type.replace(/_/g, " ")}
                      </span>
                      {q.skill_category && <span>{q.skill_category}</span>}
                      <span>•</span>
                      <span className="capitalize">{q.difficulty}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </span>
                      {q.ev_related && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          EV
                        </span>
                      )}
                      {q.safety_critical && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[var(--safety)]/10 text-[var(--safety)] border border-[var(--safety)]/20">
                          Safety Critical
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">
              {selectedIds.length}
            </span>{" "}
            question{selectedIds.length === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddSelected}
              disabled={selectedIds.length === 0 || loading}
              className="cursor-pointer text-xs bg-primary text-primary-foreground hover:opacity-90 gap-1.5 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Check className="size-3.5" /> Add Selected (
                  {selectedIds.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
