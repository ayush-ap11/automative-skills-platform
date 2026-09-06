"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Briefcase } from "lucide-react";
import { RolePerformanceData } from "./analytics-types";

interface Props {
  data: RolePerformanceData[];
}

export function PerformanceByRoleChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-80 w-full rounded-xl border border-border bg-card p-4 animate-pulse" />;
  }

  const hasData = data && data.length > 0 && data.some((d) => d.completedCount > 0);

  if (!hasData) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-xs">
        <Briefcase className="size-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Not enough completed assessments yet to show this breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-foreground">Performance by Candidate Role</h3>
        <p className="text-xs text-muted-foreground">Average assessment score across automotive roles and vocations</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="role" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-15} textAnchor="end" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--popover-foreground)",
              }}
              formatter={(val: any) => [`${val}%`, "Average Score"]}
            />
            <Bar dataKey="averageScore" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="divide-y divide-border border-t border-border pt-2 text-xs">
        {data.map((item) => (
          <div key={item.role} className="flex justify-between py-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">{item.role}</span>
            <span>Avg: <strong className="text-foreground">{item.averageScore}%</strong> ({item.completedCount} completed)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
