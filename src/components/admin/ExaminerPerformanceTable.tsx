"use client";

import React from "react";
import { UserCheck, Clock, Award } from "lucide-react";
import { ExaminerPerformanceData } from "./analytics-types";

interface Props {
  data: ExaminerPerformanceData[];
}

export function ExaminerPerformanceTable({ data }: Props) {
  const hasData = data && data.length > 0 && data.some((d) => d.assessmentsReviewed > 0);

  if (!hasData) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-xs">
        <UserCheck className="size-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">No completed reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-foreground">Examiner Productivity & Turnaround</h3>
        <p className="text-xs text-muted-foreground">Volume of assessments reviewed, average candidate scores, and velocity</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Examiner</th>
              <th className="p-3 text-center">Assessments Reviewed</th>
              <th className="p-3 text-center">Average Candidate Score</th>
              <th className="p-3 text-center">Average Turnaround</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((ex) => (
              <tr key={ex.examinerId} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 font-semibold text-foreground">{ex.examinerName}</td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <UserCheck className="size-3 text-muted-foreground" /> {ex.assessmentsReviewed}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-foreground">
                    <Award className="size-3 text-amber-500" /> {ex.averageScore}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                    <Clock className="size-3" /> {ex.averageTurnaroundDays.toFixed(1)} days
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
