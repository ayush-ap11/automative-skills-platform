"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export interface EVReadinessStatusData {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  data: EVReadinessStatusData[];
}

export function EVReadinessChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-64 w-full rounded-xl border border-border bg-card p-4 animate-pulse" />;
  }

  const hasData = data && data.some((d) => d.count > 0);

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-foreground tracking-tight">EV Readiness Distribution</h3>
        <p className="text-xs text-muted-foreground">High-voltage & EV capability breakdown across candidates</p>
      </div>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center text-xs text-muted-foreground italic">
          No EV readiness evaluations yet
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                className="cursor-pointer"
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
