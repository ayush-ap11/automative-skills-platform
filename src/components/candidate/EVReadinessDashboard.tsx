"use client";

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
    {
      title: "EV Knowledge",
      value: Number(scores.ev_knowledge ?? 0),
      explanation: "Understanding of EV powertrain architectures, battery chemistry, and high-voltage electrical principles.",
    },
    {
      title: "HV Safety Awareness",
      value: Number(scores.hv_safety_awareness ?? 0),
      explanation: "Mastery of high-voltage isolation, lockout/tagout procedures, PPE requirements, and zero-potential testing.",
    },
    {
      title: "Diagnostics",
      value: Number(scores.diagnostics ?? 0),
      explanation: "Ability to troubleshoot EV fault codes, analyze battery management system data, and isolate component faults.",
    },
    {
      title: "Practical Evidence",
      value: Number(scores.practical_evidence ?? 0),
      explanation: "Hands-on tasks and physical workshop procedures observed, evaluated, and verified by an examiner.",
    },
    {
      title: "Training Evidence",
      value: Number(scores.training_evidence ?? 0),
      explanation: "Accredited EV/HV training certificates and formal manufacturer certifications verified on record.",
    },
    {
      title: "Verbal Reasoning",
      value: Number(scores.verbal_reasoning ?? 0),
      explanation: "Clear spoken articulation of safety rationale, isolation sequences, and emergency response steps.",
    },
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

      {/* 2. Six Category Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.title}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat.title}
                </h3>
                <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {Math.round(cat.value)}%
                </span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round(cat.value)))}%` }}
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2.5">
              {cat.explanation}
            </p>
          </div>
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
