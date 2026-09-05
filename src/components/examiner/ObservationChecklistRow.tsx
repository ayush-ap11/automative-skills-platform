"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export interface ChecklistItemData {
  id: string;
  label: string;
  rating: "not_demonstrated" | "developing" | "competent" | "highly_competent" | "";
  comment: string;
}

export function ObservationChecklistRow({
  index,
  item,
  onUpdate,
  onRemove,
  showError,
}: {
  index: number;
  item: ChecklistItemData;
  onUpdate: (updated: ChecklistItemData) => void;
  onRemove: () => void;
  showError?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground">
            {index + 1}
          </span>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate({ ...item, label: e.target.value })}
            placeholder="Checklist task or criterion..."
            className="h-8 flex-1 rounded border border-input bg-background px-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-destructive font-medium">Remove?</span>
              <button
                type="button"
                onClick={onRemove}
                className="font-bold text-destructive hover:underline cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-muted-foreground hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
        <div className="space-y-1 sm:col-span-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Performance Rating *</label>
          <select
            value={item.rating}
            onChange={(e) => onUpdate({ ...item, rating: e.target.value as any })}
            className={`h-8 w-full rounded border bg-background px-2 text-xs font-medium text-foreground cursor-pointer focus:border-primary focus:outline-hidden ${
              showError && !item.rating ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          >
            <option value="">Select rating...</option>
            <option value="not_demonstrated">Not Demonstrated</option>
            <option value="developing">Developing</option>
            <option value="competent">Competent</option>
            <option value="highly_competent">Highly Competent</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-muted-foreground">Evidence / Observation Notes</label>
          <input
            type="text"
            value={item.comment}
            onChange={(e) => onUpdate({ ...item, comment: e.target.value })}
            placeholder="Observed actions, measurement readings, or notes..."
            className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
