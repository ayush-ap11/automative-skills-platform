import React from "react";
import { CheckCircle2, Clock, PlayCircle, HelpCircle } from "lucide-react";

interface AssessmentStatusBadgeProps {
  status: string;
  className?: string;
}

export function AssessmentStatusBadge({ status, className = "" }: AssessmentStatusBadgeProps) {
  switch (status) {
    case "not_started":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
            backgroundColor: "transparent",
          }}
        >
          <PlayCircle className="h-3 w-3" />
          Not Started
        </span>
      );

    case "in_progress":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--primary)",
            border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
        >
          <Clock className="h-3 w-3" />
          In Progress
        </span>
      );

    case "submitted":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
            color: "var(--success)",
            border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)",
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Submitted
        </span>
      );

    case "under_review":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--warning) 15%, transparent)",
            color: "var(--warning)",
            border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
          }}
        >
          <Clock className="h-3 w-3" />
          Under Review
        </span>
      );

    case "completed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
            color: "var(--success)",
            border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          <HelpCircle className="h-3 w-3" />
          {status}
        </span>
      );
  }
}
