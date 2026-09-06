"use client";

import { ChevronLeft, ChevronRight, Clock, FilterX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuditLogDetailDialog,
  type AuditLogEntry,
} from "./AuditLogDetailDialog";

interface ActorOption {
  id: string;
  name: string;
}
interface Props {
  entries: AuditLogEntry[];
  actions: string[];
  entityTypes: string[];
  actors: ActorOption[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentFilters: {
    action?: string;
    entityType?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function AuditLogViewer({
  entries,
  actions,
  entityTypes,
  actors,
  currentPage,
  totalPages,
  totalCount,
  currentFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );

  const updateParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    if (!("page" in updates)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="space-y-4 text-xs">
      {/* Filters */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground uppercase text-[10px] tracking-wider">
            Filter Ledger
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <FilterX className="size-3" /> Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <select
            value={currentFilters.action || ""}
            onChange={(e) => updateParam({ action: e.target.value || null })}
            className="rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={currentFilters.entityType || ""}
            onChange={(e) =>
              updateParam({ entityType: e.target.value || null })
            }
            className="rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer"
          >
            <option value="">All Entities</option>
            {entityTypes.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
          <select
            value={currentFilters.actorId || ""}
            onChange={(e) => updateParam({ actorId: e.target.value || null })}
            className="rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer"
          >
            <option value="">All Actors</option>
            {actors.map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={currentFilters.dateFrom || ""}
            onChange={(e) => updateParam({ dateFrom: e.target.value || null })}
            className="rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer"
            title="From date"
          />
          <input
            type="date"
            value={currentFilters.dateTo || ""}
            onChange={(e) => updateParam({ dateTo: e.target.value || null })}
            className="rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer"
            title="To date"
          />
        </div>
      </div>

      {/* Log list / table */}
      {entries.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <Clock className="size-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            No audit log entries match these filters.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs divide-y divide-border">
          <div className="hidden md:grid grid-cols-12 gap-2 p-3 bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            <div className="col-span-2">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-3">Entity</div>
            <div className="col-span-2">IP / Device</div>
            <div className="col-span-2 text-right">Timestamp</div>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="p-3.5 md:grid md:grid-cols-12 md:gap-2 md:items-center space-y-1 md:space-y-0 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="md:col-span-2 font-medium text-foreground truncate">
                {entry.actor_name}
              </div>
              <div className="md:col-span-3 font-mono text-[11px] text-primary truncate">
                {entry.action}
              </div>
              <div className="md:col-span-3 text-muted-foreground truncate">
                <span className="font-medium text-foreground">
                  {entry.entity_type}
                </span>
                {entry.entity_id ? ` #${entry.entity_id.slice(0, 8)}` : ""}
              </div>
              <div className="md:col-span-2 font-mono text-[11px] text-muted-foreground truncate">
                {entry.ip_address || "Not tracked"}
              </div>
              <div className="md:col-span-2 text-muted-foreground md:text-right text-[11px]">
                {new Date(entry.created_at).toLocaleDateString("en-AU", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between p-2">
        <span className="text-muted-foreground text-[11px]">
          Showing {entries.length} of {totalCount} events (Page {currentPage} of{" "}
          {Math.max(1, totalPages)})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => updateParam({ page: String(currentPage - 1) })}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => updateParam({ page: String(currentPage + 1) })}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <AuditLogDetailDialog
        entry={selectedEntry}
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />
    </div>
  );
}
