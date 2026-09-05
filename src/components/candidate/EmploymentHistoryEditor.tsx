"use client";

import { useState } from "react";
import { Plus, Briefcase } from "lucide-react";
import type { EmploymentHistoryValues } from "@/app/(candidate)/profile/schema";
import { EmploymentHistoryItem } from "./EmploymentHistoryItem";

interface EmploymentHistoryEditorProps {
  initialRows: EmploymentHistoryValues[];
}

export function EmploymentHistoryEditor({
  initialRows = [],
}: EmploymentHistoryEditorProps) {
  const [rows, setRows] = useState<EmploymentHistoryValues[]>(initialRows);

  const handleAddRow = () => {
    const newRow: EmploymentHistoryValues = {
      employer_name: "",
      role_title: "",
      start_date: "",
      end_date: null,
      description: "",
    };
    setRows((prev) => [newRow, ...prev]);
  };

  const handleDeleted = (deletedId?: string, index?: number) => {
    if (deletedId) {
      setRows((prev) => prev.filter((r) => r.id !== deletedId));
    } else if (typeof index === "number") {
      setRows((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Previous Roles
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log your automotive employment history. Each role auto-saves as you
            enter details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted cursor-pointer"
        >
          <Plus className="size-4 text-primary" />
          <span>Add Previous Role</span>
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Briefcase className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-foreground">
            No previous roles listed
          </p>
          <p className="text-xs text-muted-foreground">
            Click &ldquo;Add Previous Role&rdquo; to add your employment
            records.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <EmploymentHistoryItem
              key={row.id || `temp-${idx}`}
              initialRow={row}
              onDeleted={(id) => handleDeleted(id, idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
