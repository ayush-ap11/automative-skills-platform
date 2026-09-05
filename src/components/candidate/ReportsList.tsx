"use client";

import { useState } from "react";
import { FileText, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReportSignedUrl } from "@/app/(candidate)/reports/actions";

export interface ReportItem {
  id: string;
  report_type: "assessment_report" | "ev_readiness_report" | string;
  generated_at: string;
  file_storage_path?: string | null;
}

interface ReportsListProps {
  reports: ReportItem[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const formatReportType = (type: string) => {
    if (type === "ev_readiness_report") return "EV Readiness Report";
    if (type === "assessment_report") return "Assessment Report";
    return "Assessment Report";
  };

  const handleViewReport = async (reportId: string) => {
    setLoadingId(reportId);
    setErrorMap((prev) => ({ ...prev, [reportId]: "" }));

    try {
      const res = await getReportSignedUrl(reportId);
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        setErrorMap((prev) => ({
          ...prev,
          [reportId]: res.error || "Unable to retrieve report document.",
        }));
      }
    } catch {
      setErrorMap((prev) => ({
        ...prev,
        [reportId]: "A connection error occurred while loading the report.",
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const isLoading = loadingId === report.id;
          const errorMessage = errorMap[report.id];

          return (
            <div
              key={report.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {formatReportType(report.report_type)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {new Date(report.generated_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {errorMessage && (
                  <p className="rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive">
                    {errorMessage}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border/60">
                <Button
                  onClick={() => handleViewReport(report.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Generating Link..." : "View Report"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
