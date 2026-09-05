"use client";

import React, { useState } from "react";
import { Lock, ExternalLink, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/candidate/DocumentStatusBadge";
import { ChecklistItem, CategoryDefinition } from "@/app/(candidate)/documents/types";
import { getSignedUrl } from "@/app/(candidate)/documents/actions";

interface DocumentChecklistRowProps {
  item: ChecklistItem;
  onUploadClick: (category: CategoryDefinition) => void;
}

export function DocumentChecklistRow({ item, onUploadClick }: DocumentChecklistRowProps) {
  const { category, document } = item;
  const [isViewing, setIsViewing] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  async function handleViewDocument() {
    if (!document) return;
    setIsViewing(true);
    setViewError(null);
    const res = await getSignedUrl(document.id);
    setIsViewing(false);
    if (res.signedUrl) {
      window.open(res.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setViewError(res.error || "Unable to open document");
      setTimeout(() => setViewError(null), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{category.label}</span>
          <DocumentStatusBadge status={document?.status} />
        </div>

        <p className="text-xs text-muted-foreground">{category.description}</p>

        {category.isSensitive && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            <span>Only you and organisation admins can view this document.</span>
          </div>
        )}

        {document && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="truncate max-w-[200px] font-mono text-foreground">{document.file_name}</span>
            <span>Uploaded: {new Date(document.uploaded_at).toLocaleDateString("en-AU")}</span>
            {document.expiry_date && (
              <span className="font-medium text-warning">
                Expires: {new Date(document.expiry_date).toLocaleDateString("en-AU")}
              </span>
            )}
          </div>
        )}

        {viewError && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{viewError}</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        {document ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isViewing}
              onClick={handleViewDocument}
              className="cursor-pointer text-xs"
            >
              {isViewing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ExternalLink className="h-3.5 w-3.5 mr-1" />}
              View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUploadClick(category)}
              className="cursor-pointer text-xs text-primary hover:bg-primary/5"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Replace
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onUploadClick(category)}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}
