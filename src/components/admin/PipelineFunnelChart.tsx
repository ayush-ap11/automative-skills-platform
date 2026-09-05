"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export interface PipelineStageData {
  stage: string;
  count: number;
}

interface Props {
  data: PipelineStageData[];
}

export function PipelineFunnelChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-64 w-full rounded-xl border border-border bg-card p-4 animate-pulse" />;
  }

  const hasData = data && data.some((d) => d.count > 0);

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground tracking-tight">Candidate Pipeline Funnel</h3>
        <p className="text-xs text-muted-foreground">Progression of candidates across qualification stages</p>
      </div>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center text-xs text-muted-foreground italic">
          No candidates in pipeline yet
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="stage"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} className="cursor-pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
