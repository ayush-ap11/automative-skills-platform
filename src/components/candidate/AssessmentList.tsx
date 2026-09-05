"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight, Calendar, Layers } from "lucide-react";
import { AssessmentStatusBadge } from "@/components/candidate/AssessmentStatusBadge";

export interface AssessmentItem {
  id: string;
  template_id: string | null;
  status: string;
  assigned_at: string;
  overall_score?: number | null;
  template?: {
    title: string;
    framework_version?: string | null;
  } | null;
}

interface AssessmentListProps {
  assessments: AssessmentItem[];
}

export function AssessmentList({ assessments }: AssessmentListProps) {
  const router = useRouter();

  function handleCardClick(assessment: AssessmentItem) {
    if (assessment.status === "not_started" || assessment.status === "in_progress") {
      router.push(`/assessments/${assessment.id}/instructions`);
    } else if (assessment.status === "submitted" || assessment.status === "under_review") {
      router.push(`/assessments/${assessment.id}/status`);
    } else if (assessment.status === "completed") {
      router.push(`/assessments/${assessment.id}/summary`);
    }
  }

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Assessments Assigned</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          No assessments assigned yet — your organisation will notify you when one is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assessments.map((assessment) => {
        const title = assessment.template?.title || "Automotive Competency Assessment";
        const framework = assessment.template?.framework_version || "AUR Framework";

        return (
          <div
            key={assessment.id}
            onClick={() => handleCardClick(assessment)}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                  {title}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  {framework}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Assigned: {new Date(assessment.assigned_at).toLocaleDateString("en-AU")}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center pt-2 sm:pt-0 border-t border-border/50 sm:border-0">
              <AssessmentStatusBadge status={assessment.status} />
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
