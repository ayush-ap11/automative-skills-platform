import { TriangleAlert } from "lucide-react";

interface SafetyWarningBannerProps {
  className?: string;
}

export function SafetyWarningBanner({ className = "" }: SafetyWarningBannerProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-r-lg border-l-4 p-4 text-sm leading-relaxed shadow-xs ${className}`}
      style={{
        borderLeftColor: "var(--safety)",
        backgroundColor: "color-mix(in srgb, var(--safety) 8%, var(--background))",
      }}
    >
      <TriangleAlert
        className="mt-0.5 h-5 w-5 shrink-0"
        style={{ color: "var(--safety)" }}
        aria-hidden="true"
      />
      <div className="text-foreground">
        <strong className="font-semibold" style={{ color: "var(--safety)" }}>
          SAFETY-CRITICAL ASSESSMENT
        </strong>
        <span className="text-foreground">
          {" "}— This assessment evaluates knowledge relating to high-voltage electric vehicle systems.
          Assessment results do not themselves authorise a person to perform high-voltage work.
          Actual workplace activities must comply with applicable workplace procedures,
          manufacturer instructions, training/competency requirements and applicable Australian
          standards and regulations.
        </span>
      </div>
    </div>
  );
}
