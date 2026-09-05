"use client";

import { ProgressCard } from "@/components/shared/ProgressCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface EVReadinessScoreData {
  id?: string;
  assessment_id?: string;
  ev_knowledge: number | null;
  hv_safety_awareness: number | null;
  diagnostics: number | null;
  practical_evidence: number | null;
  training_evidence: number | null;
  verbal_reasoning: number | null;
  overall_score: number | null;
  status: "strong" | "developing" | "significant_gap" | "insufficient_evidence" | null;
  calculation_notes: string | null;
}

interface EVReadinessDashboardProps {
  scores: EVReadinessScoreData;
}

const STATUS_CONFIG: Record<
  "strong" | "developing" | "significant_gap" | "insufficient_evidence",
  { label: string; color: string }
> = {
  strong: { label: "Strong Readiness", color: "var(--success)" },
  developing: { label: "Developing", color: "var(--warning)" },
  significant_gap: { label: "Significant Gap", color: "var(--destructive)" },
  insufficient_evidence: { label: "Insufficient Evidence", color: "var(--muted-foreground)" },
};

export function EVReadinessDashboard({ scores }: EVReadinessDashboardProps) {
  const currentStatus = scores.status ? STATUS_CONFIG[scores.status] : null;
  const overall = Math.round(Number(scores.overall_score ?? 0));

  const categories = [
    { title: "EV Knowledge", value: Number(scores.ev_knowledge ?? 0) },
    { title: "HV Safety Awareness", value: Number(scores.hv_safety_awareness ?? 0) },
    { title: "Diagnostics", value: Number(scores.diagnostics ?? 0) },
    { title: "Practical Evidence", value: Number(scores.practical_evidence ?? 0) },
    { title: "Training Evidence", value: Number(scores.training_evidence ?? 0) },
    { title: "Verbal Reasoning", value: Number(scores.verbal_reasoning ?? 0) },
  ];

  const defaultExplanation =
    "Your EV Readiness Index combines your knowledge assessment results, verbal responses, and documented training/practical evidence across six categories, each weighted by your organisation's assessment framework.";

  return (
    <div className="space-y-6">
      {/* 1. Overall Score Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overall EV Readiness Index
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {overall}
            </span>
            <span className="text-xl font-medium text-muted-foreground">/100</span>
          </div>
        </div>

        {currentStatus && (
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: `color-mix(in srgb, ${currentStatus.color} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${currentStatus.color} 10%, transparent)`,
              color: currentStatus.color,
            }}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: currentStatus.color }}
              aria-hidden="true"
            />
            <span>{currentStatus.label}</span>
          </div>
        )}
      </div>

      {/* 2. Six Category ProgressCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <ProgressCard
            key={cat.title}
            title={cat.title}
            percentage={cat.value}
          />
        ))}
      </div>

      {/* 3. One-line distinction note */}
      <p className="text-xs text-muted-foreground">
        This is an assessment-support metric, not a legal certification of competency to perform high-voltage work.
      </p>

      {/* 4. Collapsible explanation */}
      <Accordion className="rounded-xl border border-border bg-card">
        <AccordionItem value="explanation" className="border-none px-4">
          <AccordionTrigger className="cursor-pointer py-4 text-sm font-semibold text-foreground hover:no-underline">
            How is this score calculated?
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
            {scores.calculation_notes || defaultExplanation}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
