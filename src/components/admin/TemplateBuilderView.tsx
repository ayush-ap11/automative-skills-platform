"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  GripVertical,
  HelpCircle,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteSection,
  reorderSection,
  updateTemplateDetails,
  upsertSection,
} from "@/app/(admin)/admin/assessments/actions";
import { deleteQuestion } from "@/app/(admin)/admin/question-bank/actions";
import { Button } from "@/components/ui/button";
import { InlineQuestionForm } from "./InlineQuestionForm";
import { QuestionBankSelectorModal } from "./QuestionBankSelectorModal";
import type { QuestionRecord } from "./question-bank-types";

export interface SectionWithQuestions {
  id: string;
  title: string;
  order_index: number;
  weight_pct: number;
  questions: QuestionRecord[];
}

interface Props {
  templateId: string;
  initialTitle: string;
  initialFrameworkVersion: string;
  initialSections: SectionWithQuestions[];
  allBankQuestions: QuestionRecord[];
}

export function TemplateBuilderView({
  templateId,
  initialTitle,
  initialFrameworkVersion,
  initialSections,
  allBankQuestions,
}: Props) {
  const router = useRouter();

  // Template Details State
  const [title, setTitle] = useState(initialTitle);
  const [frameworkVersion, setFrameworkVersion] = useState(
    initialFrameworkVersion,
  );
  const [templateSaveStatus, setTemplateSaveStatus] = useState<
    "idle" | "loading" | "saved" | "error"
  >("idle");
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Sections State
  const [sections, setSections] =
    useState<SectionWithQuestions[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialSections[0]?.id || "",
  );

  // Add Section State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionWeight, setNewSectionWeight] = useState("20");
  const [sectionAddLoading, setSectionAddLoading] = useState(false);
  const [sectionAddError, setSectionAddError] = useState<string | null>(null);

  // Questions UI State
  const [showInlineAddQuestion, setShowInlineAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionRecord | null>(
    null,
  );
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [showBankModal, setShowBankModal] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );

  // Sync sections when initialSections update from server
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // When switching active section, close inline form/edit mode
  useEffect(() => {
    if (activeSectionId) {
      setShowInlineAddQuestion(false);
      setEditingQuestion(null);
    }
  }, [activeSectionId]);

  const toggleExpanded = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMoveQuestion = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (!activeSection) return;
    if (targetIdx < 0 || targetIdx >= activeSection.questions.length) return;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== activeSection.id) return s;
        const newQuestions = [...s.questions];
        const [moved] = newQuestions.splice(idx, 1);
        newQuestions.splice(targetIdx, 0, moved);
        return { ...s, questions: newQuestions };
      }),
    );
  };

  // Active Section Derived
  const activeSection = useMemo(() => {
    return (
      sections.find((s) => s.id === activeSectionId) || sections[0] || null
    );
  }, [sections, activeSectionId]);

  // Section Live Metrics
  const activeSectionQuestions = activeSection?.questions || [];
  const activeQuestionCount = activeSectionQuestions.length;
  const activeTotalMarks = activeSectionQuestions.reduce(
    (sum, q) => sum + (Number(q.marks) || 0),
    0,
  );

  // Weight Calculation
  const totalWeight = sections.reduce(
    (sum, s) => sum + (Number(s.weight_pct) || 0),
    0,
  );
  const isWeightBalanced = totalWeight === 100;

  // Save Template Title & Framework
  const handleSaveTemplateDetails = async () => {
    if (!title.trim()) {
      setTemplateError("Template title is required");
      return;
    }
    setTemplateSaveStatus("loading");
    setTemplateError(null);
    const res = await updateTemplateDetails(
      templateId,
      title,
      frameworkVersion,
    );
    if (res.error) {
      setTemplateSaveStatus("error");
      setTemplateError(res.error);
    } else {
      setTemplateSaveStatus("saved");
      setTimeout(() => setTemplateSaveStatus("idle"), 2000);
      router.refresh();
    }
  };

  // Add Section Submit
  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      setSectionAddError("Section title is required.");
      return;
    }
    setSectionAddLoading(true);
    setSectionAddError(null);
    const orderIndex =
      sections.length > 0
        ? Math.max(...sections.map((s) => s.order_index)) + 1
        : 0;

    const res = await upsertSection(
      templateId,
      null,
      newSectionTitle.trim(),
      orderIndex,
      Number(newSectionWeight) || 0,
    );
    setSectionAddLoading(false);

    if (res.error) {
      setSectionAddError(res.error);
    } else {
      if (res.id) {
        const newSec: SectionWithQuestions = {
          id: res.id,
          title: newSectionTitle.trim(),
          order_index: orderIndex,
          weight_pct: Number(newSectionWeight) || 0,
          questions: [],
        };
        setSections((prev) => [...prev, newSec]);
        setActiveSectionId(res.id);
      }
      setIsAddingSection(false);
      setNewSectionTitle("");
      setNewSectionWeight("20");
      router.refresh();
    }
  };

  // Update Section Title & Weight inline
  const handleUpdateSection = async (
    id: string,
    secTitle: string,
    weightPct: number,
  ) => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    await upsertSection(templateId, id, secTitle, sec.order_index, weightPct);
    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title: secTitle, weight_pct: weightPct } : s,
      ),
    );
    router.refresh();
  };

  // Reorder Section
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

  // Delete Section
  const handleDeleteSection = async (id: string) => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    if (sec.questions.length > 0) {
      alert("Please remove or transfer all questions from this section first.");
      return;
    }
    if (!confirm(`Delete section "${sec.title}"?`)) return;

    const res = await deleteSection(id);
    if (res.error) {
      alert(res.error);
    } else {
      const remaining = sections.filter((s) => s.id !== id);
      setSections(remaining);
      if (activeSectionId === id) {
        setActiveSectionId(remaining[0]?.id || "");
      }
      router.refresh();
    }
  };

  // Delete Question from Section
  const handleDeleteQuestion = async (qId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this question from this section?",
      )
    )
      return;
    setDeletingQuestionId(qId);
    const res = await deleteQuestion(qId);
    setDeletingQuestionId(null);
    if (res.error) {
      alert(res.message || res.error);
    } else {
      setSections((prev) =>
        prev.map((s) =>
          s.id === activeSection?.id
            ? { ...s, questions: s.questions.filter((q) => q.id !== qId) }
            : s,
        ),
      );
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/assessments"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-xs"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Template Builder
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {sections.length}{" "}
                {sections.length === 1 ? "Section" : "Sections"}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title || "Untitled Assessment Template"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/admin/assessments">
            <Button
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
            >
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Two-Area Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT / TOP AREA: Template Details & Sections (5 cols on lg) */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-5">
          {/* Template Details Card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Template Details
              </h2>
              <div className="flex items-center gap-1.5">
                {templateSaveStatus === "loading" && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
                {templateSaveStatus === "saved" && (
                  <span className="text-emerald-600 text-[11px] font-semibold inline-flex items-center gap-0.5">
                    <Check className="size-3" /> Saved
                  </span>
                )}
                {templateSaveStatus === "error" && (
                  <span className="text-destructive text-[11px] font-semibold">
                    Error saving
                  </span>
                )}
              </div>
            </div>

            {templateError && (
              <p className="text-[11px] text-destructive">{templateError}</p>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="tmpl-title-input"
                  className="font-semibold block mb-1 text-foreground"
                >
                  Template Name *
                </label>
                <input
                  id="tmpl-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AUR30620 Light Vehicle Mechanical Stage 1"
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="tmpl-framework-input"
                  className="font-semibold block mb-1 text-foreground"
                >
                  Framework Version *
                </label>
                <input
                  id="tmpl-framework-input"
                  type="text"
                  value={frameworkVersion}
                  onChange={(e) => setFrameworkVersion(e.target.value)}
                  placeholder="e.g. AUR Release 9.0"
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveTemplateDetails}
                disabled={templateSaveStatus === "loading"}
                className="w-full text-xs font-semibold cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:opacity-90 mt-1"
              >
                <Save className="size-3.5" /> Save Template Details
              </Button>
            </div>
          </div>

          {/* Section Balance Banner */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-xs ${
              isWeightBalanced
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {isWeightBalanced ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              )}
              <span>
                {isWeightBalanced
                  ? "Section weights total 100% (Balanced)"
                  : `Weights total ${totalWeight}% (target: 100%)`}
              </span>
            </div>
            <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-background/80 border border-current">
              {totalWeight}%
            </span>
          </div>

          {/* Sections List Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Sections & Weighting ({sections.length})</span>
              <span>Weight</span>
            </div>

            {sections.length === 0 && !isAddingSection && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No sections yet. Add your first section below.
              </div>
            )}

            <div className="divide-y divide-border">
              {sections.map((sec, idx) => {
                const isActive = sec.id === activeSection?.id;
                const secQCount = sec.questions.length;
                const secMarks = sec.questions.reduce(
                  (sum, q) => sum + (Number(q.marks) || 0),
                  0,
                );

                return (
                  <div
                    key={sec.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveSectionId(sec.id);
                      setShowInlineAddQuestion(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveSectionId(sec.id);
                        setShowInlineAddQuestion(false);
                      }
                    }}
                    className={`p-3 space-y-2 cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(sec.id, "up");
                            }}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(sec.id, "down");
                            }}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0 pl-1">
                          <input
                            type="text"
                            defaultValue={sec.title}
                            onBlur={(e) =>
                              handleUpdateSection(
                                sec.id,
                                e.target.value,
                                sec.weight_pct,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full font-semibold text-xs rounded border border-transparent hover:border-border focus:border-border bg-transparent focus:bg-background p-1 text-foreground"
                          />
                          {/* Running count & marks preview */}
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1 mt-0.5">
                            <span className="font-medium text-foreground">
                              {secQCount}{" "}
                              {secQCount === 1 ? "question" : "questions"}
                            </span>
                            <span>•</span>
                            <span>{secMarks} marks</span>
                            {isActive && (
                              <span className="ml-auto px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Weight input & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={sec.weight_pct}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) =>
                            handleUpdateSection(
                              sec.id,
                              sec.title,
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-14 text-right font-semibold text-xs rounded border border-border bg-background p-1 text-foreground"
                        />
                        <span className="text-xs text-muted-foreground font-semibold">
                          %
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(sec.id);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer ml-1"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Section Form or Trigger */}
            {isAddingSection ? (
              <form
                onSubmit={handleAddSectionSubmit}
                className="p-3.5 bg-muted/20 border-t border-border space-y-3"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Section title (e.g. Electrical Diagnostics)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="flex-1 text-xs rounded-lg border border-border bg-background p-2 text-foreground"
                    required
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSectionWeight}
                      onChange={(e) => setNewSectionWeight(e.target.value)}
                      className="w-16 text-right text-xs rounded-lg border border-border bg-background p-2 font-semibold text-foreground"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">
                      %
                    </span>
                  </div>
                </div>
                {sectionAddError && (
                  <p className="text-[11px] text-destructive">
                    {sectionAddError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingSection(false)}
                    disabled={sectionAddLoading}
                    className="cursor-pointer text-xs h-7"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sectionAddLoading}
                    className="cursor-pointer text-xs h-7 bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {sectionAddLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Save Section"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-3 border-t border-border bg-muted/10">
                <Button
                  onClick={() => setIsAddingSection(true)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold cursor-pointer gap-1.5 border-dashed"
                >
                  <Plus className="size-3.5" /> Add Section
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT / BELOW AREA: Questions for Active Section (7 cols lg) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7">
          {activeSection ? (
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col h-[750px] max-h-[calc(100vh-140px)]">
              {/* Active Section Questions Header - Pinned at Top */}
              <div className="shrink-0 p-4 bg-muted/30 border-b border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      <Layers className="size-3.5 text-primary" />
                      <span>Section Questions</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-0.5">
                      {activeSection.title}
                    </h3>
                  </div>

                  {/* Running live counts badge */}
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                      {activeQuestionCount}{" "}
                      {activeQuestionCount === 1 ? "Question" : "Questions"}
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-muted border border-border text-foreground font-bold text-xs">
                      {activeTotalMarks} Total Marks
                    </div>
                  </div>
                </div>

                {/* Actions: Add Question & Choose from Bank */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowInlineAddQuestion((prev) => !prev);
                    }}
                    className="text-xs font-semibold cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:opacity-90 shadow-xs"
                  >
                    <Plus className="size-3.5" /> Add Question
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBankModal(true)}
                    className="text-xs font-semibold cursor-pointer gap-1.5 border-border hover:bg-muted shadow-xs"
                  >
                    <Database className="size-3.5 text-primary" /> Choose from
                    Bank
                  </Button>
                </div>
              </div>

              {/* Inline Add / Edit Question Form */}
              {(showInlineAddQuestion || editingQuestion) && (
                <div className="shrink-0 p-4 border-b border-border bg-muted/10 max-h-[55vh] overflow-y-auto">
                  <InlineQuestionForm
                    key={editingQuestion ? editingQuestion.id : "new-question"}
                    sectionId={activeSection.id}
                    sectionTitle={activeSection.title}
                    initialQuestion={editingQuestion}
                    onSuccess={(savedQ) => {
                      if (savedQ && savedQ.id) {
                        setSections((prev) =>
                          prev.map((s) => {
                            if (s.id !== activeSection.id) return s;
                            const exists = s.questions.some(
                              (q) => q.id === savedQ.id,
                            );
                            const updatedQuestions = exists
                              ? s.questions.map((q) =>
                                  q.id === savedQ.id
                                    ? ({ ...q, ...savedQ } as QuestionRecord)
                                    : q,
                                )
                              : [...s.questions, savedQ as QuestionRecord];
                            return { ...s, questions: updatedQuestions };
                          }),
                        );
                      }
                      setShowInlineAddQuestion(false);
                      setEditingQuestion(null);
                      router.refresh();
                    }}
                    onCancel={() => {
                      setShowInlineAddQuestion(false);
                      setEditingQuestion(null);
                    }}
                  />
                </div>
              )}

              {/* Questions List (scrolls independently) */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
                {activeSectionQuestions.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <HelpCircle className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        No questions in this section yet
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Author a new question directly with{" "}
                        <span className="font-semibold text-foreground">
                          "Add Question"
                        </span>{" "}
                        or import existing questions using{" "}
                        <span className="font-semibold text-foreground">
                          "Choose from Bank"
                        </span>
                        .
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingQuestion(null);
                          setShowInlineAddQuestion(true);
                        }}
                        className="text-xs font-semibold cursor-pointer gap-1.5"
                      >
                        <Plus className="size-3.5" /> Add Question
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBankModal(true)}
                        className="text-xs font-semibold cursor-pointer gap-1.5"
                      >
                        <Database className="size-3.5 text-primary" /> Choose
                        from Bank
                      </Button>
                    </div>
                  </div>
                ) : (
                  activeSectionQuestions.map((q, qIdx) => {
                    const isExpanded = Boolean(expandedQuestions[q.id]);
                    const isLongText = (q.question_text || "").length > 120;
                    return (
                      <div
                        key={q.id}
                        className="p-4 hover:bg-muted/15 transition-colors space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Reorder controls: Drag handle and Up/Down arrows */}
                            <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                              <GripVertical className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 cursor-grab shrink-0 mr-0.5" />
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={qIdx === 0}
                                  onClick={() => handleMoveQuestion(qIdx, "up")}
                                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none cursor-pointer rounded hover:bg-muted"
                                  title="Move question up"
                                >
                                  <ArrowUp className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    qIdx === activeSectionQuestions.length - 1
                                  }
                                  onClick={() =>
                                    handleMoveQuestion(qIdx, "down")
                                  }
                                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none cursor-pointer rounded hover:bg-muted"
                                  title="Move question down"
                                >
                                  <ArrowDown className="size-3" />
                                </button>
                              </div>
                            </div>

                            {/* Question number */}
                            <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5 w-6 text-center tabular-nums">
                              {qIdx + 1}.
                            </span>

                            {/* Question Text & Badges */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div>
                                <p
                                  className={`text-xs font-medium text-foreground leading-relaxed ${
                                    !isExpanded ? "line-clamp-2" : ""
                                  }`}
                                >
                                  {q.question_text}
                                </p>
                                {isLongText && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(q.id)}
                                    className="text-[11px] font-semibold text-primary hover:underline mt-0.5 cursor-pointer inline-block"
                                  >
                                    {isExpanded ? "Show less" : "Show more"}
                                  </button>
                                )}
                              </div>

                              {/* Badges / Tags (only show badges that are true/set) */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                {/* Question Type */}
                                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border/50">
                                  {q.question_type.replace(/_/g, " ")}
                                </span>

                                {/* Skill Category */}
                                {q.skill_category && (
                                  <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-[10px] font-semibold text-foreground border border-secondary/30">
                                    {q.skill_category}
                                  </span>
                                )}

                                {/* Difficulty */}
                                {q.difficulty && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize border ${
                                      q.difficulty === "easy"
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : q.difficulty === "medium"
                                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>
                                )}

                                {/* Marks */}
                                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold text-foreground border border-border/50">
                                  {q.marks} {q.marks === 1 ? "mark" : "marks"}
                                </span>

                                {/* Mandatory (only if true) */}
                                {q.mandatory && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 inline-flex items-center gap-1">
                                    <CheckCircle2 className="size-2.5" />{" "}
                                    Mandatory
                                  </span>
                                )}

                                {/* AI Eval (only if true) */}
                                {q.ai_evaluation_enabled && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20 inline-flex items-center gap-1">
                                    <Sparkles className="size-2.5" /> AI Eval
                                  </span>
                                )}

                                {/* EV Related (only if true) */}
                                {q.ev_related && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 inline-flex items-center gap-1">
                                    <Zap className="size-2.5" /> EV Related
                                  </span>
                                )}

                                {/* Safety Critical (only if true) */}
                                {q.safety_critical && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--safety)]/10 text-[var(--safety)] border border-[var(--safety)]/20 inline-flex items-center gap-1">
                                    <ShieldAlert className="size-2.5" /> Safety
                                    Critical
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Edit (pencil) & Remove (trash) */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowInlineAddQuestion(false);
                                setEditingQuestion(q);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit question"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(q.id)}
                              disabled={deletingQuestionId === q.id}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Remove question from this section"
                            >
                              {deletingQuestionId === q.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Multiple Choice options preview if present */}
                        {q.question_options &&
                          q.question_options.length > 0 && (
                            <div className="pl-14 pt-1 space-y-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.question_options.map((opt, oIdx) => (
                                  <div
                                    key={opt.id || oIdx}
                                    className={`text-[11px] px-2 py-1 rounded border flex items-center justify-between ${
                                      opt.is_correct
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium"
                                        : "bg-muted/30 border-border/70 text-muted-foreground"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {opt.option_text}
                                    </span>
                                    {opt.is_correct && (
                                      <span className="text-[10px] font-bold ml-1 shrink-0 text-emerald-600">
                                        ✓ Correct
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card text-muted-foreground text-sm">
              Please select or create a section to manage its questions.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Choose from Bank */}
      {activeSection && (
        <QuestionBankSelectorModal
          open={showBankModal}
          onOpenChange={setShowBankModal}
          targetSectionId={activeSection.id}
          targetSectionTitle={activeSection.title}
          availableQuestions={allBankQuestions}
          onQuestionsAdded={(added) => {
            if (added && added.length > 0) {
              setSections((prev) =>
                prev.map((s) =>
                  s.id === activeSection.id
                    ? { ...s, questions: [...s.questions, ...added] }
                    : s,
                ),
              );
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
