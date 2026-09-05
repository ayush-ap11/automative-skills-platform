import { Bot, AlertTriangle } from "lucide-react";

export interface AiAnalysisData {
  id: string;
  provisional_score: number | null;
  technical_score: number | null;
  safety_score: number | null;
  diagnostic_reasoning_score: number | null;
  communication_score: number | null;
  completeness_score: number | null;
  critical_safety_flag: boolean;
  flag_reason: string | null;
}

export function AiAnalysisPanel({ analysis }: { analysis: AiAnalysisData | null }) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Bot className="size-4 text-muted-foreground" />
        <span>AI analysis not yet available</span>
      </div>
    );
  }

  const subScores = [
    { label: "Technical", val: analysis.technical_score },
    { label: "Safety", val: analysis.safety_score },
    { label: "Diagnostic", val: analysis.diagnostic_reasoning_score },
    { label: "Communication", val: analysis.communication_score },
    { label: "Completeness", val: analysis.completeness_score },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Provisional:</span>
          <span className="font-bold text-foreground">{analysis.provisional_score !== null ? `${analysis.provisional_score}%` : "—"}</span>
        </div>
      </div>

      {analysis.critical_safety_flag && (
        <div
          className="flex items-start gap-2 rounded-md border p-2.5 text-xs font-medium"
          style={{
            borderColor: "var(--destructive)",
            backgroundColor: "color-mix(in srgb, var(--destructive) 8%, transparent)",
            color: "var(--destructive)",
          }}
        >
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Critical Safety Flag</p>
            <p className="text-[11px] opacity-90">{analysis.flag_reason || "Safety violation identified in response."}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {subScores.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-muted/30 p-2 text-center">
            <span className="block text-[10px] text-muted-foreground truncate">{s.label}</span>
            <span className="block text-xs font-semibold text-foreground mt-0.5">{s.val !== null ? `${s.val}%` : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
