"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ChevronRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitAssessment } from "@/app/(candidate)/assessments/[id]/review/actions";

export interface SectionReviewItem {
  id: string;
  title: string;
  order_index: number;
  isComplete: boolean;
  remainingCount: number;
}

interface ReviewSummaryProps {
  assessmentId: string;
  sections: SectionReviewItem[];
  documentStats: { uploadedCount: number; totalCategories: number };
}

export function ReviewSummary({ assessmentId, sections, documentStats }: ReviewSummaryProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allComplete = sections.every((s) => s.isComplete);
  const incompleteSections = sections.filter((s) => !s.isComplete);
  const canSubmit = confirmed && allComplete && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await submitAssessment(assessmentId);
      if (res.success) {
        router.push(`/assessments/${assessmentId}/status`);
      } else if (res.missingSections && res.missingSections.length > 0) {
        setErrorMessage(`Please complete all mandatory questions in: ${res.missingSections.join(", ")}`);
        setIsSubmitting(false);
      } else {
        setErrorMessage(res.message || "Failed to submit assessment. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("A network error occurred while submitting. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Assessment Sections
        </h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/assessments/${assessmentId}/section/${section.id}`}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {section.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
                )}
                <span className="text-sm font-medium text-foreground">{section.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    section.isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}
                >
                  {section.isComplete ? "Complete" : `Incomplete — ${section.remainingCount} remaining`}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-xs">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{documentStats.uploadedCount} of {documentStats.totalCategories} document categories have something uploaded</span>
        </div>
        <Link href="/documents" className="text-xs font-semibold text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer">
          Review Documents
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
          />
          <span className="text-sm text-foreground leading-snug">
            I confirm the information and answers I&apos;ve provided are accurate to the best of my knowledge.
          </span>
        </label>

        {errorMessage && (
          <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        <div>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto cursor-pointer">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Assessment"}
          </Button>

          {!allComplete && (
            <p className="mt-2 text-xs text-warning">
              Sections needing attention: {incompleteSections.map((s) => s.title).join(", ")}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
