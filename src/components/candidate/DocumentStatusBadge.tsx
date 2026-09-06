import { CheckCircle2, Clock, AlertCircle, FileQuestion, Sparkles } from "lucide-react";

interface DocumentStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function DocumentStatusBadge({ status, className = "" }: DocumentStatusBadgeProps) {
  if (!status) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
        style={{
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
          backgroundColor: "transparent",
        }}
      >
        <FileQuestion className="h-3 w-3" />
        Not Uploaded
      </span>
    );
  }

  switch (status) {
    case "uploaded":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          <Clock className="h-3 w-3" />
          Uploaded
        </span>
      );

    case "ai_extracted":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--secondary) 15%, transparent)",
            color: "var(--secondary)",
            border: "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)",
          }}
        >
          <Sparkles className="h-3 w-3" />
          AI Extracted
        </span>
      );

    case "pending_review":
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
          Pending Review
        </span>
      );

    case "verified":
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
          Verified
        </span>
      );

    case "rejected":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--destructive) 15%, transparent)",
            color: "var(--destructive)",
            border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
          }}
        >
          <AlertCircle className="h-3 w-3" />
          Rejected
        </span>
      );

    case "expired":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--destructive) 15%, transparent)",
            color: "var(--destructive)",
            border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
          }}
        >
          <AlertCircle className="h-3 w-3" />
          Expired
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
          {status}
        </span>
      );
  }
}
