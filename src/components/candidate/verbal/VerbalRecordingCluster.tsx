"use client";

import { useMemo } from "react";
import { Mic, Square, RotateCcw, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorderStatus } from "@/hooks/useVoiceRecorder";

interface VerbalRecordingClusterProps {
  status: VoiceRecorderStatus;
  audioBlob: Blob | null;
  elapsedSeconds: number;
  submitStatus: "idle" | "loading" | "success" | "error";
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSubmit: () => void;
  isLast: boolean;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VerbalRecordingCluster({
  status,
  audioBlob,
  elapsedSeconds,
  submitStatus,
  onStart,
  onStop,
  onReset,
  onSubmit,
  isLast,
}: VerbalRecordingClusterProps) {
  const audioUrl = useMemo(() => {
    return audioBlob ? URL.createObjectURL(audioBlob) : null;
  }, [audioBlob]);

  if (status === "permission-denied") {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Microphone access is needed to answer this question.
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Please allow microphone permissions in your browser settings to continue with verbal questions.
        </p>
        <Button type="button" variant="outline" onClick={onStart} className="cursor-pointer text-xs mt-2">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Try Again
        </Button>
      </div>
    );
  }

  if (status === "recorded") {
    return (
      <div className="flex flex-col items-center space-y-5">
        {audioUrl && (
          <div className="w-full max-w-md rounded-lg border border-border bg-muted/20 p-3">
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitStatus === "loading"}
            onClick={onReset}
            className="cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Record Again
          </Button>

          <Button
            type="button"
            disabled={submitStatus === "loading" || submitStatus === "success"}
            onClick={onSubmit}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 min-w-36"
          >
            {submitStatus === "loading" ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Submitting...</>
            ) : submitStatus === "success" ? (
              <><Check className="h-4 w-4 mr-1.5" />Submitted</>
            ) : (
              <><Check className="h-4 w-4 mr-1.5" />{isLast ? "Submit & Finish" : "Submit Answer"}</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-4">
      {status === "recording" ? (
        <button
          type="button"
          onClick={onStop}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-transform active:scale-95 cursor-pointer"
          title="Stop Recording"
        >
          <Square className="h-8 w-8 fill-current" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={status === "requesting-permission"}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
          title="Start Recording"
        >
          {status === "requesting-permission" ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Mic className="h-9 w-9" />
          )}
        </button>
      )}

      {status === "recording" ? (
        <div className="flex flex-col items-center space-y-1">
          <span className="font-mono text-xl font-bold tracking-wider text-foreground">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-xs text-muted-foreground">Recording in progress — tap square to finish</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          {status === "requesting-permission" ? "Requesting microphone access..." : "Tap to start recording your answer"}
        </span>
      )}
    </div>
  );
}
