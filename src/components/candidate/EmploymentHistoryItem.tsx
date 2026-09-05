"use client";

import { useState } from "react";
import { Trash2, Check, Loader2 } from "lucide-react";
import type { EmploymentHistoryValues } from "@/app/(candidate)/profile/schema";
import {
  upsertEmploymentHistory,
  deleteEmploymentHistory,
} from "@/app/(candidate)/profile/actions";

interface EmploymentHistoryItemProps {
  initialRow: EmploymentHistoryValues;
  onDeleted: (id?: string) => void;
}

export function EmploymentHistoryItem({
  initialRow,
  onDeleted,
}: EmploymentHistoryItemProps) {
  const [row, setRow] = useState<EmploymentHistoryValues>(initialRow);
  const [isPresent, setIsPresent] = useState(!initialRow.end_date);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveRow = async (updated: EmploymentHistoryValues) => {
    if (!updated.employer_name || !updated.role_title || !updated.start_date) return;
    setSaveStatus("saving");
    const res = await upsertEmploymentHistory(updated);
    if (res?.success) {
      if (res.id && !updated.id) setRow((prev) => ({ ...prev, id: res.id }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } else {
      setSaveStatus("error");
    }
  };

  const handleDelete = async () => {
    if (!row.id) { onDeleted(); return; }
    setIsDeleting(true);
    const res = await deleteEmploymentHistory(row.id);
    setIsDeleting(false);
    if (res?.success) onDeleted(row.id);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Entry</span>
          {saveStatus === "saving" && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Saving...</span>}
          {saveStatus === "saved" && <span className="flex items-center gap-1 text-[11px] font-semibold text-success"><Check className="size-3" /> Saved</span>}
          {saveStatus === "error" && <span className="text-[11px] font-semibold text-destructive">Error saving</span>}
        </div>
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-destructive font-medium">Remove role?</span>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="font-bold text-destructive hover:underline cursor-pointer">Confirm</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:underline cursor-pointer">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded p-1 text-muted-foreground hover:text-destructive cursor-pointer">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Employer Name (e.g. Apex Auto)"
          value={row.employer_name}
          onChange={(e) => setRow({ ...row, employer_name: e.target.value })}
          onBlur={() => saveRow(row)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          placeholder="Role Title (e.g. Mechanic)"
          value={row.role_title}
          onChange={(e) => setRow({ ...row, role_title: e.target.value })}
          onBlur={() => saveRow(row)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-semibold text-muted-foreground">Start Date</label>
          <input
            type="date"
            value={row.start_date}
            onChange={(e) => setRow({ ...row, start_date: e.target.value })}
            onBlur={() => saveRow(row)}
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase font-semibold text-muted-foreground">End Date</label>
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={isPresent}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsPresent(val);
                  const updated = { ...row, end_date: val ? null : "" };
                  setRow(updated);
                  saveRow(updated);
                }}
                className="size-3.5 rounded border-border text-primary cursor-pointer"
              />
              <span>Present</span>
            </label>
          </div>
          <input
            type="date"
            disabled={isPresent}
            value={row.end_date || ""}
            onChange={(e) => setRow({ ...row, end_date: e.target.value })}
            onBlur={() => saveRow(row)}
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none disabled:opacity-40"
          />
        </div>
      </div>

      <textarea
        placeholder="Responsibilities, systems worked on, diagnostic tools used..."
        rows={2}
        value={row.description || ""}
        onChange={(e) => setRow({ ...row, description: e.target.value })}
        onBlur={() => saveRow(row)}
        className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
