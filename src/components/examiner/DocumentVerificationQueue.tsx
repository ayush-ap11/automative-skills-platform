"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Calendar, Filter, X, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { DocumentReviewDialog } from "@/components/examiner/DocumentReviewDialog";
import { CATEGORY_LABELS } from "@/app/(examiner)/examiner/documents/constants";

export interface DocumentQueueItem {
  id: string;
  candidateProfileId: string;
  candidateName: string;
  category: string;
  fileName: string;
  status: string;
  expiryDate: string | null;
  uploadedAt: string;
}

interface Props {
  initialDocuments: DocumentQueueItem[];
  candidateFilter?: { id: string; name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  uploaded: { label: "Uploaded", cls: "bg-muted text-muted-foreground border-border" },
  ai_extracted: { label: "AI Extracted", cls: "bg-primary/10 text-primary border-primary/30" },
  pending_review: { label: "Needs Info", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" },
};

function formatExpiry(expiryDate: string | null) {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `Expired (${expiryDate})`, cls: "text-destructive font-medium" };
  if (diffDays <= 30) return { text: `Expiring (${expiryDate})`, cls: "text-[var(--warning)] font-medium" };
  return { text: `Expires ${expiryDate}`, cls: "text-muted-foreground" };
}

export function DocumentVerificationQueue({ initialDocuments, candidateFilter }: Props) {
  const [documents, setDocuments] = useState<DocumentQueueItem[]>(initialDocuments);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleReviewed = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setSelectedDocId(null);
  };

  return (
    <div className="space-y-4">
      {candidateFilter && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="size-4 text-primary shrink-0" />
            <span>Showing documents for <strong className="text-foreground">{candidateFilter.name}</strong></span>
          </div>
          <Link href="/examiner/documents" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
            <X className="size-3.5" /> Clear filter
          </Link>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No documents awaiting verification.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {documents.map((doc) => {
            const statusInfo = STATUS_CONFIG[doc.status] || { label: doc.status, cls: "bg-muted text-muted-foreground border-border" };
            const expiryInfo = formatExpiry(doc.expiryDate);
            const categoryLabel = CATEGORY_LABELS[doc.category] || doc.category;

            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40 cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm truncate">{doc.candidateName}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{categoryLabel}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      {expiryInfo && (
                        <span className={`inline-flex items-center gap-1 ${expiryInfo.cls}`}>
                          <AlertTriangle className="size-3 shrink-0" /> {expiryInfo.text}
                        </span>
                      )}
                      <span className="truncate max-w-[180px] sm:max-w-xs text-muted-foreground/80">{doc.fileName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs font-medium text-primary hidden sm:inline">Review</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DocumentReviewDialog
        documentId={selectedDocId}
        open={Boolean(selectedDocId)}
        onOpenChange={(open) => !open && setSelectedDocId(null)}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
