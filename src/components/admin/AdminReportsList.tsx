"use client";

import {
  AlertCircle,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  generateAdminReportAction,
  getAdminReportUrl,
} from "@/app/(admin)/admin/reports/actions";
import { Button } from "@/components/ui/button";

export interface AdminReportItem {
  id: string;
  candidate_id: string;
  candidate_name: string;
  report_type: string;
  generated_by: string;
  generated_at: string;
  has_report?: boolean;
  assessment_id?: string;
}

interface Props {
  reports: AdminReportItem[];
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  assessment_report: "Assessment Report",
  ev_readiness_report: "EV Readiness Report",
};

export function AdminReportsList({ reports }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<{ id: string; text: string } | null>(
    null,
  );

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (
        search &&
        !r.candidate_name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (typeFilter !== "all" && r.report_type !== typeFilter) return false;
      return true;
    });
  }, [reports, search, typeFilter]);

  const handleViewReport = async (reportId: string) => {
    setLoadingId(reportId);
    setErrorMsg(null);
    const res = await getAdminReportUrl(reportId);
    setLoadingId(null);
    if (res.error) {
      setErrorMsg({ id: reportId, text: res.error });
    } else if (res.url) {
      window.open(res.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleGenerateReport = async (assessmentId: string, itemId: string) => {
    setLoadingId(itemId);
    setErrorMsg(null);
    const res = await generateAdminReportAction(assessmentId);
    setLoadingId(null);
    if (res.error) {
      setErrorMsg({ id: itemId, text: res.error });
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by candidate name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-xs"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border bg-background p-1.5 text-xs text-foreground cursor-pointer"
          >
            <option value="all">All Report Types</option>
            <option value="assessment_report">Assessment Report</option>
            <option value="ev_readiness_report">EV Readiness Report</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <FileText className="size-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            No reports match your current filters.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {filtered.map((r) => {
            const isLoading = loadingId === r.id;
            const err = errorMsg?.id === r.id ? errorMsg.text : null;
            const isReady = r.has_report !== false;

            return (
              <div
                key={r.id}
                className="p-4 space-y-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-foreground">
                        {r.candidate_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        • {REPORT_TYPE_LABELS[r.report_type] || r.report_type}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isReady ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"}`}
                      >
                        {isReady ? "Ready" : "Pending Generation"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span
                        className="inline-flex items-center gap-1"
                        suppressHydrationWarning
                      >
                        <Calendar className="size-3" />{" "}
                        {new Date(r.generated_at).toLocaleDateString("en-AU")}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="size-3" /> Generated by:{" "}
                        <strong className="capitalize text-foreground">
                          {r.generated_by}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {isReady ? (
                    <Button
                      onClick={() => handleViewReport(r.id)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer text-xs font-semibold gap-1.5 self-start sm:self-auto h-8"
                    >
                      {isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="size-3.5" />
                      )}
                      <span>{isLoading ? "Preparing..." : "View Report"}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        handleGenerateReport(r.assessment_id || r.id, r.id)
                      }
                      disabled={isLoading}
                      size="sm"
                      className="cursor-pointer text-xs font-semibold gap-1.5 self-start sm:self-auto h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                    >
                      {isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FileText className="size-3.5" />
                      )}
                      <span>
                        {isLoading ? "Generating..." : "Generate Report"}
                      </span>
                    </Button>
                  )}
                </div>

                {err && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
