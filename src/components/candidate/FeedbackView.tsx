"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, TrendingUp, MessageSquare, Info } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface AssessmentOption { id: string; title: string; }
export interface ExaminerCommentItem { question_text: string; comment: string; }
export interface SkillGapItem { competency_unit_code: string | null; gap_description: string | null; recommended_action: string | null; }

interface FeedbackViewProps {
  assessmentId: string;
  allCompletedAssessments: AssessmentOption[];
  outcome: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: SkillGapItem[];
  examinerComments: ExaminerCommentItem[];
}

export function FeedbackView({
  assessmentId,
  allCompletedAssessments,
  outcome,
  strengths,
  weaknesses,
  skillGaps,
  examinerComments,
}: FeedbackViewProps) {
  const router = useRouter();
  const isCompetent = outcome === "competent";
  const hasGrowth = weaknesses.length > 0 || skillGaps.length > 0;

  return (
    <div className="space-y-6">
      {allCompletedAssessments.length > 1 && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Assessment:</span>
          <Select value={assessmentId} onValueChange={(val) => val && router.push(`/feedback?assessmentId=${val}`)}>
            <SelectTrigger className="w-full sm:w-64 cursor-pointer"><SelectValue placeholder="Choose assessment" /></SelectTrigger>
            <SelectContent>
              {allCompletedAssessments.map((a) => (
                <SelectItem key={a.id} value={a.id} className="cursor-pointer">{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 1. Outcome Badge */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment Outcome</span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Official Examiner Evaluation</h2>
        </div>
        <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold ${
          isCompetent ? "bg-success/10 text-success border border-success/30" : "bg-warning/10 text-warning border border-warning/30"
        }`}>
          {isCompetent ? "Competent" : "Not Yet Competent"}
        </span>
      </div>

      {/* 2. What You Did Well */}
      {strengths.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-success font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>What You Did Well</span>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Areas for Growth */}
      {hasGrowth && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-warning font-semibold text-sm">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>Areas for Growth</span>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            {weaknesses.map((w, idx) => (
              <li key={`w-${idx}`} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                <span className="leading-relaxed">{w}</span>
              </li>
            ))}
            {skillGaps.map((gap, idx) => (
              <li key={`gap-${idx}`} className="rounded-lg border border-warning/20 bg-card p-3 space-y-1">
                <div className="font-semibold text-xs text-warning">{gap.competency_unit_code || "Competency Checkpoint"}</div>
                {gap.gap_description && <p className="text-xs text-foreground">{gap.gap_description}</p>}
                {gap.recommended_action && <p className="text-xs text-muted-foreground italic">Recommended: {gap.recommended_action}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Examiner Comments */}
      {examinerComments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>Examiner Comments by Question</span>
          </div>
          <Accordion className="rounded-xl border border-border bg-card">
            {examinerComments.map((ec, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b last:border-b-0 border-border px-4">
                <AccordionTrigger className="cursor-pointer py-3.5 text-sm font-medium text-foreground hover:no-underline">
                  {ec.question_text}
                </AccordionTrigger>
                <AccordionContent className="pb-3.5 text-sm leading-relaxed text-muted-foreground">{ec.comment}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* 5. Info Banner */}
      {!isCompetent && (
        <div
          className="flex items-start gap-3 rounded-xl border border-primary/20 p-4 text-sm leading-relaxed shadow-xs"
          style={{ backgroundColor: "color-mix(in srgb, var(--primary) 8%, var(--background))" }}
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-foreground">
            Your organisation will follow up about next steps, which may include gap training or a reassessment. This isn&apos;t a final result — it just means one or more areas need more evidence.
          </p>
        </div>
      )}
    </div>
  );
}
