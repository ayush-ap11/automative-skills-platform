"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { upsertTemplate } from "@/app/(admin)/admin/assessments/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFrameworkVersion?: string;
  onSuccess?: () => void;
}

export function TemplateFormDialog({ open, onOpenChange, defaultFrameworkVersion = "AUR Release 9.0", onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [frameworkVersion, setFrameworkVersion] = useState(defaultFrameworkVersion);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setFrameworkVersion(defaultFrameworkVersion || "AUR Release 9.0");
      setErrorMsg(null);
    }
  }, [open, defaultFrameworkVersion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a template title.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const res = await upsertTemplate(null, title, frameworkVersion);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Assessment Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1 text-foreground">Template Title *</label>
            <input
              type="text"
              placeholder="e.g. AUR30620 Light Vehicle Mechanical Stage 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">Framework Version *</label>
            <input
              type="text"
              placeholder="e.g. AUR Release 9.0"
              value={frameworkVersion}
              onChange={(e) => setFrameworkVersion(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">Pre-filled from organisation settings, editable per template.</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-1" /> Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
