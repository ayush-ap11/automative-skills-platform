"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Mic, Wifi, VolumeX, Clock, ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startAssessment } from "@/app/(candidate)/assessments/[id]/instructions/actions";

export interface SectionItem {
  id: string;
  title: string;
  order_index: number;
}

interface AssessmentInstructionsProps {
  assessmentId: string;
  templateTitle: string;
  frameworkVersion: string;
  status: string;
  sections: SectionItem[];
  hasVerbalQuestions: boolean;
}

function getSectionDescription(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("verbal")) return "Answer selected questions out loud — no typing required.";
  if (lower.includes("ev") || lower.includes("electric")) return "Evaluate electric vehicle safety, isolation procedures, and diagnostic competencies.";
  if (lower.includes("knowledge")) return "A short set of multiple-choice and scenario questions.";
  if (lower.includes("practical")) return "Demonstrate hands-on diagnostic workflows and workshop safety.";
  return "Structured questions and scenarios aligned with national AUR competency standards.";
}

export function AssessmentInstructions({
  assessmentId,
  templateTitle,
  frameworkVersion,
  status,
  sections,
  hasVerbalQuestions,
}: AssessmentInstructionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleBegin() {
    setLoading(true);
    setErrorMsg(null);
    const res = await startAssessment(assessmentId);
    if (res.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      router.push(`/assessments/${assessmentId}/take`);
    }
  }

  const isContinue = status === "in_progress";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{templateTitle}</h1>
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Layers className="h-3.5 w-3.5" />
            {frameworkVersion}
          </span>
        </div>
        <p className="text-sm font-medium text-secondary">
          This is not a pass/fail exam. It&apos;s a structured way to show us what you already know how to do.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Assessment Structure & Modules</h2>
        <div className="space-y-3">
          {sections.map((sec, idx) => (
            <div key={sec.id} className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{sec.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{getSectionDescription(sec.title)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold text-foreground">What You&apos;ll Need</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-foreground">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 bg-muted/10">
            <VolumeX className="h-4 w-4 text-primary shrink-0" />
            <span>A quiet space free of workshop background noise</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 bg-muted/10">
            <Wifi className="h-4 w-4 text-primary shrink-0" />
            <span>A stable internet connection for saving answers</span>
          </div>
          {hasVerbalQuestions && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 bg-muted/10 sm:col-span-2">
              <Mic className="h-4 w-4 text-secondary shrink-0" />
              <span>Working microphone access for recorded verbal answer responses</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span>You can save and continue at any time — nothing here is timed unless a specific question says so.</span>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          <Info className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="pt-2">
        <Button
          onClick={handleBegin}
          disabled={loading}
          className="w-full sm:w-auto min-w-56 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 text-sm font-semibold"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting...</>
          ) : (
            <>
              {isContinue ? "Continue Assessment" : "Begin Assessment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
