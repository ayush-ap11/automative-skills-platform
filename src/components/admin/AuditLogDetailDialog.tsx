"use client";

import { Activity, Clock, Database, Globe, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface Props {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDialog({ entry, open, onOpenChange }: Props) {
  if (!entry) return null;

  const renderJsonBlock = (val: Record<string, unknown> | null) => {
    if (!val || Object.keys(val).length === 0) {
      return (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground italic font-mono">
          None
        </div>
      );
    }
    return (
      <pre className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Audit Log Event Detail
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cryptographic ledger entry {entry.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
                <User className="size-3" /> Actor
              </span>
              <p className="font-medium text-foreground">{entry.actor_name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
                <Activity className="size-3" /> Action
              </span>
              <p className="font-medium text-primary font-mono">
                {entry.action}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
                <Database className="size-3" /> Entity
              </span>
              <p className="font-medium text-foreground">
                <span className="font-semibold">{entry.entity_type}</span>
                {entry.entity_id ? ` (${entry.entity_id})` : ""}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
                <Clock className="size-3" /> Timestamp
              </span>
              <p className="font-medium text-foreground">
                {new Date(entry.created_at).toLocaleString("en-AU")}
              </p>
            </div>
            <div className="col-span-2 space-y-1 pt-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
                <Globe className="size-3" /> IP / Device
              </span>
              <p className="font-mono text-foreground">
                {entry.ip_address || "Not tracked"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-foreground text-xs block">
              Previous Value
            </span>
            {renderJsonBlock(entry.previous_value)}
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-foreground text-xs block">
              New Value
            </span>
            {renderJsonBlock(entry.new_value)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
