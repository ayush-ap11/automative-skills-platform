"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Trash2 } from "lucide-react";
import { QuestionOptionsEditor } from "@/components/admin/QuestionOptionsEditor";
import { upsertQuestion, deleteQuestion, QuestionOptionInput } from "@/app/(admin)/admin/question-bank/actions";
import { QuestionRecord, SectionOption, CATEGORY_PRESETS, QUESTION_TYPES } from "./question-bank-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  question: QuestionRecord | null;
  sections: SectionOption[];
  onSaved: () => void;
}

export function QuestionFormDialog({ open, onOpenChange, mode, question, sections, onSaved }: Props) {
  const [sectionId, setSectionId] = useState("");
  const [text, setText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [category, setCategory] = useState("Mechanical");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [explanation, setExplanation] = useState("");
  const [mapping, setMapping] = useState("");
  const [marks, setMarks] = useState("1");
  const [timeLimit, setTimeLimit] = useState("");
  const [mandatory, setMandatory] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [evRelated, setEvRelated] = useState(false);
  const [safetyCritical, setSafetyCritical] = useState(false);
  const [status, setStatus] = useState<"draft" | "active" | "retired">("draft");
  const [options, setOptions] = useState<QuestionOptionInput[]>([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (mode === "edit" && question) {
      setSectionId(question.section_id); setText(question.question_text); setQType(question.question_type);
      setCategory(question.skill_category || "Mechanical"); setDifficulty(question.difficulty || "medium");
      setExplanation(question.explanation || ""); setMapping((question.competency_mapping || []).join(", "));
      setMarks(String(question.marks ?? 1)); setTimeLimit(question.time_limit_seconds ? String(question.time_limit_seconds) : "");
      setMandatory(Boolean(question.mandatory)); setAiEnabled(Boolean(question.ai_evaluation_enabled));
      setEvRelated(Boolean(question.ev_related)); setSafetyCritical(Boolean(question.safety_critical)); setStatus(question.status || "draft");
      const opts = (question.question_options || []).map((o) => ({ text: o.option_text, isCorrect: o.is_correct }));
      setOptions(opts.length > 0 ? opts : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    } else {
      setSectionId(sections[0]?.id || ""); setText(""); setQType("multiple_choice"); setCategory("Mechanical");
      setDifficulty("medium"); setExplanation(""); setMapping(""); setMarks("1"); setTimeLimit("");
      setMandatory(true); setAiEnabled(true); setEvRelated(false); setSafetyCritical(false); setStatus("draft");
      setOptions([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    }
  }, [open, mode, question, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId) return setErrorMsg("Please choose a target section.");
    if (!text.trim()) return setErrorMsg("Question text cannot be empty.");
    setLoading(true); setErrorMsg(null);
    const res = await upsertQuestion(sectionId, mode === "edit" ? question?.id || null : null, {
      questionText: text, questionType: qType, skillCategory: category, difficulty, explanation,
      competencyMapping: mapping.split(",").map((s) => s.trim()).filter(Boolean),
      marks: Number(marks) || 1, timeLimitSeconds: timeLimit ? Number(timeLimit) : null,
      mandatory, aiEvaluationEnabled: aiEnabled, evRelated, safetyCritical, status,
    }, options);
    setLoading(false);
    if (res.error) setErrorMsg(res.error); else { onOpenChange(false); onSaved(); }
  };

  const handleDelete = async () => {
    if (!question?.id || !confirm("Are you sure you want to delete this question?")) return;
    setLoading(true); setErrorMsg(null);
    const res = await deleteQuestion(question.id);
    setLoading(false);
    if (res.error) setErrorMsg(res.message || res.error); else { onOpenChange(false); onSaved(); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "create" ? "Add Question" : "Edit Question"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive"><AlertCircle className="size-4 shrink-0" /> {errorMsg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Assessment Section *</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full rounded border border-border bg-background p-2 cursor-pointer">{sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Question Type</label>
              <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full rounded border border-border bg-background p-2 cursor-pointer capitalize">{QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select>
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Question Text *</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Enter prompt..." className="w-full rounded border border-border bg-background p-2" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1">Skill Category</label>
              <input list="categories" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-border bg-background p-2" />
              <datalist id="categories">{CATEGORY_PRESETS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="font-semibold block mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full rounded border border-border bg-background p-2 capitalize cursor-pointer"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded border border-border bg-background p-2 capitalize cursor-pointer"><option value="draft">Draft</option><option value="active">Active</option><option value="retired">Retired</option></select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="font-semibold block mb-1">Marks</label><input type="number" min="0.5" step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
            <div><label className="font-semibold block mb-1">Time Limit (Sec)</label><input type="number" min="0" placeholder="Optional" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
            <div><label className="font-semibold block mb-1">AUR Units</label><input type="text" placeholder="AURETR005" value={mapping} onChange={(e) => setMapping(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Explanation (Examiner Rationale)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} placeholder="Rationale..." className="w-full rounded border border-border bg-background p-2" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60">
            {[{ l: "Mandatory", v: mandatory, s: setMandatory }, { l: "AI Eval", v: aiEnabled, s: setAiEnabled }, { l: "EV Related", v: evRelated, s: setEvRelated }, { l: "Safety Critical", v: safetyCritical, s: setSafetyCritical }].map((t) => (
              <label key={t.l} className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium"><input type="checkbox" checked={t.v} onChange={(e) => t.s(e.target.checked)} className="rounded cursor-pointer" /> {t.l}</label>
            ))}
          </div>
          <QuestionOptionsEditor questionType={qType} options={options} onChange={setOptions} />
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            {mode === "edit" && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="mr-auto cursor-pointer gap-1"><Trash2 className="size-3.5" /> Delete</Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="cursor-pointer">Cancel</Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...</> : mode === "create" ? "Add Question" : "Save Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
