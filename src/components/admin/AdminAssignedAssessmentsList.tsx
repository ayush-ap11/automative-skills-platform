"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AssignedItem {
  id: string;
  candidate_id?: string;
  candidate_name: string;
  template_title: string;
  examiner_name: string;
  status: string;
  assigned_at: string;
}

interface Props {
  items: AssignedItem[];
  statusFilter: string;
  onFilterChange: (status: string) => void;
  pendingCount: number;
}

export function AdminAssignedAssessmentsList({ items, statusFilter, onFilterChange, pendingCount }: Props) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      not_started: "bg-muted text-muted-foreground border-border",
      in_progress: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      submitted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      under_review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${map[status] || map.not_started}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const filtered = items.filter((a) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "submitted") return a.status === "submitted" || a.status === "under_review";
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs border-b border-border pb-2">
        <button onClick={() => onFilterChange("all")} className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${statusFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>All ({items.length})</button>
        <button onClick={() => onFilterChange("submitted")} className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${statusFilter === "submitted" ? "bg-amber-600 text-white border-amber-600" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>Pending Review ({pendingCount})</button>
        <button onClick={() => onFilterChange("in_progress")} className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${statusFilter === "in_progress" ? "bg-sky-600 text-white border-sky-600" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>In Progress</button>
        <button onClick={() => onFilterChange("completed")} className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${statusFilter === "completed" ? "bg-emerald-600 text-white border-emerald-600" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>Completed</button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">No assessments matching selected filter.</div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {filtered.map((a) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {a.candidate_id ? (
                    <Link href={`/admin/candidates/${a.candidate_id}`} className="font-semibold text-xs sm:text-sm text-foreground hover:text-primary hover:underline">{a.candidate_name}</Link>
                  ) : <span className="font-semibold text-xs sm:text-sm text-foreground">{a.candidate_name}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{a.template_title}</span>
                  <span>•</span>
                  <Link href="/admin/examiners" className="hover:underline">Examiner: <strong className="text-foreground">{a.examiner_name}</strong></Link>
                  <span>•</span>
                  <span suppressHydrationWarning>Assigned: {new Date(a.assigned_at).toLocaleDateString("en-AU")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {getStatusBadge(a.status)}
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/assessments/${a.id}`)} className="text-xs h-7.5 px-2.5 cursor-pointer">
                  <Eye className="size-3.5 mr-1" /> View Assessment
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
