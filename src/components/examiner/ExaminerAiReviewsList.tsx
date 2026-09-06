"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Sparkles,
  User,
  HelpCircle,
  FileQuestion,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { submitAiReviewAction } from "@/app/(examiner)/examiner/ai-reviews/actions";

export interface AiReviewItem {
  id: string; // ai_analysis id
  candidateAnswerId: string;
  assessmentId: string;
  candidateName: string;
  questionText: string;
  skillCategory?: string;
  answerText?: string | null;
  transcriptText?: string | null;
  provisionalScore: number;
  confidenceLevel: number | null;
  criticalSafetyFlag: boolean;
  flagReason?: string | null;
  technicalScore: number | null;
  safetyScore: number | null;
  diagnosticReasoningScore: number | null;
  communicationScore: number | null;
  completenessScore: number | null;
  isHumanReviewed: boolean;
  existingReview?: {
    decision: string;
    finalScore: number;
    comment: string | null;
    reviewedAt?: string | null;
  } | null;
}

function formatConfidence(val: number | null): string {
  if (val == null) return "N/A";
  const num = Number(val);
  if (isNaN(num)) return "N/A";
  if (num > 100) return `${Math.round(num / 100)}%`;
  if (num <= 1) return `${Math.round(num * 100)}%`;
  return `${Math.round(num)}%`;
}

export function ExaminerAiReviewsList({ items: initialItems }: { items: AiReviewItem[] }) {
  const [items, setItems] = useState<AiReviewItem[]>(initialItems);
  const [filter, setFilter] = useState<"pending" | "flagged" | "all">(
    initialItems.some((i) => !i.isHumanReviewed) ? "pending" : "all"
  );
  const [activeModifyingId, setActiveModifyingId] = useState<string | null>(null);
  const [activeDecision, setActiveDecision] = useState<
    "accept_ai_score" | "modify_score" | "request_reassessment"
  >("modify_score");
  const [modifiedScore, setModifiedScore] = useState<number>(75);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);

  const pendingItems = items.filter((i) => !i.isHumanReviewed);
  const flaggedItems = items.filter((i) => i.criticalSafetyFlag);

  const displayedItems =
    filter === "flagged"
      ? flaggedItems
      : filter === "all"
      ? items
      : pendingItems;

  const openDecisionEditor = (
    item: AiReviewItem,
    presetDecision?: "accept_ai_score" | "modify_score" | "request_reassessment"
  ) => {
    setActiveModifyingId(item.candidateAnswerId);
    setActionError(null);

    const initialDecision =
      presetDecision ||
      (item.existingReview?.decision as "accept_ai_score" | "modify_score" | "request_reassessment") ||
      "accept_ai_score";

    setActiveDecision(initialDecision);

    if (initialDecision === "accept_ai_score") {
      setModifiedScore(item.existingReview?.finalScore ?? item.provisionalScore);
      setReviewComment(
        item.existingReview?.comment || "AI provisional score confirmed by examiner."
      );
    } else if (initialDecision === "request_reassessment") {
      setModifiedScore(0);
      setReviewComment(
        item.existingReview?.comment ||
          (item.criticalSafetyFlag
            ? "Automated safety violation requires reassessment."
            : "Candidate requested to resubmit this assessment section.")
      );
    } else {
      setModifiedScore(item.existingReview?.finalScore ?? item.provisionalScore);
      setReviewComment(item.existingReview?.comment || "");
    }
  };

  const handleSelectDecision = (
    item: AiReviewItem,
    decision: "accept_ai_score" | "modify_score" | "request_reassessment"
  ) => {
    setActiveDecision(decision);
    if (decision === "accept_ai_score") {
      setModifiedScore(item.provisionalScore);
      if (!reviewComment || reviewComment.includes("reassessment") || reviewComment.includes("modified") || reviewComment.includes("adjusted")) {
        setReviewComment("AI provisional score confirmed by examiner.");
      }
    } else if (decision === "request_reassessment") {
      setModifiedScore(0);
      if (!reviewComment || reviewComment.includes("confirmed") || reviewComment.includes("modified") || reviewComment.includes("adjusted")) {
        setReviewComment(
          item.criticalSafetyFlag
            ? "Automated safety violation requires reassessment."
            : "Candidate requested to resubmit this assessment section."
        );
      }
    } else if (decision === "modify_score") {
      if (modifiedScore === 0) {
        setModifiedScore(item.existingReview?.finalScore ?? item.provisionalScore);
      }
    }
  };

  const handleSaveDecision = async (item: AiReviewItem) => {
    setSubmittingId(item.candidateAnswerId);
    setActionError(null);

    const finalScore = activeDecision === "request_reassessment" ? 0 : modifiedScore;
    const finalComment =
      reviewComment.trim() ||
      (activeDecision === "accept_ai_score"
        ? "AI provisional score confirmed by examiner."
        : activeDecision === "request_reassessment"
        ? "Reassessment requested by examiner."
        : "Score adjusted by examiner.");

    const res = await submitAiReviewAction({
      candidateAnswerId: item.candidateAnswerId,
      aiAnalysisId: item.id,
      decision: activeDecision,
      finalScore,
      comment: finalComment,
    });

    setSubmittingId(null);
    if (res.error) {
      setActionError({ id: item.candidateAnswerId, msg: res.error });
    } else {
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) =>
          i.candidateAnswerId === item.candidateAnswerId
            ? {
                ...i,
                isHumanReviewed: true,
                existingReview: {
                  decision: activeDecision,
                  finalScore,
                  comment: finalComment,
                  reviewedAt: (res as any)?.review?.reviewed_at || nowIso,
                },
              }
            : i
        )
      );
      setActiveModifyingId(null);
    }
  };

  const handleQuickAccept = async (item: AiReviewItem) => {
    setSubmittingId(item.candidateAnswerId);
    setActionError(null);
    const comment = "AI provisional score confirmed by examiner.";
    const res = await submitAiReviewAction({
      candidateAnswerId: item.candidateAnswerId,
      aiAnalysisId: item.id,
      decision: "accept_ai_score",
      finalScore: item.provisionalScore,
      comment,
    });
    setSubmittingId(null);
    if (res.error) {
      setActionError({ id: item.candidateAnswerId, msg: res.error });
    } else {
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) =>
          i.candidateAnswerId === item.candidateAnswerId
            ? {
                ...i,
                isHumanReviewed: true,
                existingReview: {
                  decision: "accept_ai_score",
                  finalScore: item.provisionalScore,
                  comment,
                  reviewedAt: (res as any)?.review?.reviewed_at || nowIso,
                },
              }
            : i
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === "pending"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          Awaiting Confirmation ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("flagged")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === "flagged"
              ? "bg-destructive text-destructive-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          Safety Flagged ({flaggedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          All Recorded ({items.length})
        </button>
      </div>

      {displayedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            {filter === "flagged"
              ? "No safety-flagged AI reviews."
              : "No AI reviews awaiting confirmation."}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            All AI-evaluated verbal and written responses have been confirmed by an examiner.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedItems.map((item) => {
            const isModifying = activeModifyingId === item.candidateAnswerId;
            const isSubmitting = submittingId === item.candidateAnswerId;
            const answerSnippet =
              item.transcriptText || item.answerText || "No verbal transcript or text answer provided.";

            return (
              <div
                key={item.candidateAnswerId}
                className={`rounded-xl border bg-card p-5 shadow-xs transition ${
                  item.criticalSafetyFlag
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                        <User className="size-3.5 text-primary" /> {item.candidateName}
                      </span>
                      {item.skillCategory && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                          {item.skillCategory}
                        </span>
                      )}
                      {item.criticalSafetyFlag && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
                          <ShieldAlert className="size-3" /> Critical Safety Flag
                        </span>
                      )}
                      {item.isHumanReviewed ? (
                        item.existingReview?.decision === "request_reassessment" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <RotateCcw className="size-3" /> Reassessment Requested
                          </span>
                        ) : item.existingReview?.decision === "modify_score" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                            <CheckCircle2 className="size-3" /> Confirmed (Modified)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="size-3" /> Confirmed (Accepted)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                          <HelpCircle className="size-3" /> Awaiting Review
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground pt-1">
                      {item.questionText}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Provisional Score</div>
                      <div className="text-2xl font-bold text-foreground">
                        {item.provisionalScore}%
                      </div>
                    </div>
                    <div className="text-right pl-3 border-l border-border">
                      <div className="text-xs text-muted-foreground">AI Confidence</div>
                      <div className="text-sm font-semibold text-primary">
                        {formatConfidence(item.confidenceLevel)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Answer / Transcript */}
                <div className="my-3 rounded-lg border border-border/80 bg-muted/30 p-3 text-xs">
                  <div className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <FileQuestion className="size-3 text-primary" />
                    Candidate Response {item.transcriptText ? "(Verbal Transcript)" : "(Written)"}:
                  </div>
                  <p className="text-foreground leading-relaxed italic line-clamp-3">
                    &ldquo;{answerSnippet}&rdquo;
                  </p>
                </div>

                {/* Critical Safety Flag Reason if applicable */}
                {item.criticalSafetyFlag && item.flagReason && (
                  <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Automated Safety Violation: </span>
                      {item.flagReason}
                    </div>
                  </div>
                )}

                {/* 5-Factor Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 py-2 px-3 rounded-lg bg-background border border-border/60 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Technical</div>
                    <div className="font-bold text-foreground">{item.technicalScore ?? "—"}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Safety</div>
                    <div className="font-bold text-foreground">{item.safetyScore ?? "—"}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Diagnostic</div>
                    <div className="font-bold text-foreground">{item.diagnosticReasoningScore ?? "—"}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Communication</div>
                    <div className="font-bold text-foreground">{item.communicationScore ?? "—"}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Completeness</div>
                    <div className="font-bold text-foreground">{item.completenessScore ?? "—"}%</div>
                  </div>
                </div>

                {/* Error Banner */}
                {actionError?.id === item.candidateAnswerId && (
                  <div className="mb-3 p-2.5 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                    {actionError.msg}
                  </div>
                )}

                {/* Decision UI or Confirmed Summary or Quick Actions */}
                {isModifying ? (
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="size-3.5 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {item.isHumanReviewed ? "Update Examiner Decision" : "Record Examiner Decision"}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModifyingId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Decision Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Decision Type:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectDecision(item, "accept_ai_score")}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                            activeDecision === "accept_ai_score"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                              : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Accept AI ({item.provisionalScore}%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectDecision(item, "modify_score")}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                            activeDecision === "modify_score"
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                              : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          <Edit3 className="size-3.5" />
                          <span>Modify Score</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectDecision(item, "request_reassessment")}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                            activeDecision === "request_reassessment"
                              ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                              : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Request Reassessment</span>
                        </button>
                      </div>
                    </div>

                    {/* Score Input Card */}
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      {activeDecision === "modify_score" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground">
                              Adjust Final Score (0 – 100):
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={modifiedScore}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                  setModifiedScore(val);
                                }}
                                className="w-16 h-7 text-center font-bold text-xs bg-background border border-input rounded-md px-1 text-foreground"
                              />
                              <span className="text-xs font-bold text-foreground">%</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={modifiedScore}
                            onChange={(e) => setModifiedScore(Number(e.target.value))}
                            className="w-full accent-primary cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>0% (Critical Gap)</span>
                            <span>50% (Developing)</span>
                            <span>100% (Competent)</span>
                          </div>
                        </div>
                      ) : activeDecision === "accept_ai_score" ? (
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-muted-foreground">
                            Score locked to provisional AI assessment:
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {item.provisionalScore}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-destructive font-medium">
                            Candidate flagged for reassessment (Score reset):
                          </span>
                          <span className="text-sm font-bold text-destructive">0%</span>
                        </div>
                      )}
                    </div>

                    {/* Rationale / Comment Field */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Examiner Rationale &amp; Audit Notes:
                      </label>
                      <textarea
                        rows={2}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Provide rationale for this decision (required for compliance audits)..."
                        className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setActiveModifyingId(null)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSaveDecision(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {item.isHumanReviewed ? "Save Updated Decision" : "Save Decision"}
                      </button>
                    </div>
                  </div>
                ) : item.isHumanReviewed ? (
                  <div className="mt-3 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {item.existingReview?.decision === "accept_ai_score" && "AI Provisional Score Accepted"}
                          {item.existingReview?.decision === "modify_score" && "Score Adjusted by Examiner"}
                          {item.existingReview?.decision === "request_reassessment" && "Reassessment Requested"}
                          {!["accept_ai_score", "modify_score", "request_reassessment"].includes(
                            item.existingReview?.decision || ""
                          ) && "Confirmed"}
                        </span>
                        <span className="font-bold text-foreground">
                          — Final Score: {item.existingReview?.finalScore}%
                        </span>
                        {item.existingReview?.reviewedAt && (
                          <span className="text-[11px] text-muted-foreground">
                            ({new Date(item.existingReview.reviewedAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })})
                          </span>
                        )}
                      </div>
                      {item.existingReview?.comment && (
                        <p className="text-muted-foreground italic">
                          &ldquo;{item.existingReview.comment}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openDecisionEditor(item)}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs cursor-pointer shrink-0"
                    >
                      <Edit3 className="size-3.5" />
                      Update Decision
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">
                      Confirm AI provisional score or adjust before finalizing report.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickAccept(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] text-[var(--success-foreground)] px-3 py-1.5 text-xs font-bold hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Accept AI Score ({item.provisionalScore}%)
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => openDecisionEditor(item, "modify_score")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition cursor-pointer"
                      >
                        <Edit3 className="size-3.5 text-primary" /> Modify Score
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => openDecisionEditor(item, "request_reassessment")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition cursor-pointer"
                      >
                        <RotateCcw className="size-3.5" /> Reassessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
