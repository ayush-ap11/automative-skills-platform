"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerbalQuestionItem, ExistingVerbalAnswer } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/types";
import { submitVerbalAnswer } from "@/app/(candidate)/assessments/[id]/section/[sectionId]/verbal-actions";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VerbalRecordingCluster } from "./verbal/VerbalRecordingCluster";

interface VerbalAssessmentRunnerProps {
  assessmentId: string;
  sectionId: string;
  sectionTitle: string;
  questions: VerbalQuestionItem[];
  existingAnswers: Record<string, ExistingVerbalAnswer>;
}

export function VerbalAssessmentRunner({
  assessmentId,
  sectionId,
  sectionTitle,
  questions,
  existingAnswers,
}: VerbalAssessmentRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorder = useVoiceRecorder();
  const total = questions.length;
  const currentQ = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const existingAns = currentQ ? existingAnswers[currentQ.id] : null;

  useEffect(() => {
    recorder.resetRecording();
    setSubmitStatus("idle");
    setErrorMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  if (!currentQ) return null;

  async function handleSubmit() {
    if (!recorder.audioBlob) return;
    setSubmitStatus("loading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("assessmentId", assessmentId);
    formData.append("questionId", currentQ.id);
    formData.append("durationSeconds", String(recorder.elapsedSeconds));
    formData.append("audio", recorder.audioBlob, "recording.webm");

    const res = await submitVerbalAnswer(formData);
    if (res.error) {
      setSubmitStatus("error");
      setErrorMessage(res.error);
    } else {
      setSubmitStatus("success");
      setTimeout(() => {
        if (isLast) {
          router.push(`/assessments/${assessmentId}/take`);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 1500);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-foreground">{sectionTitle}</span>
          <span>Question {currentIndex + 1} of {total}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6 text-center">
        <div className="space-y-2 max-w-xl mx-auto">
          {existingAns && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-0.5 text-xs font-medium text-success">
              <FileAudio className="h-3.5 w-3.5" />
              <span>Answer previously recorded ({existingAns.duration_seconds}s)</span>
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-bold leading-relaxed text-foreground">
            {currentQ.question_text}
          </h2>
          <p className="text-xs text-muted-foreground">
            Speak clearly as if explaining to a workshop apprentice or customer. Take your time.
          </p>
        </div>

        <VerbalRecordingCluster
          status={recorder.status}
          audioBlob={recorder.audioBlob}
          elapsedSeconds={recorder.elapsedSeconds}
          submitStatus={submitStatus}
          onStart={recorder.startRecording}
          onStop={recorder.stopRecording}
          onReset={recorder.resetRecording}
          onSubmit={handleSubmit}
          isLast={isLast}
        />

        {submitStatus === "success" && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3 text-xs text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>Response submitted. Processing transcript...</span>
          </div>
        )}

        {errorMessage && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentIndex === 0 || submitStatus === "loading" || recorder.status === "recording"}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous Question
          </Button>

          <span className="text-xs text-muted-foreground">
            Re-record anytime before moving forward
          </span>
        </div>
      </div>
    </div>
  );
}
