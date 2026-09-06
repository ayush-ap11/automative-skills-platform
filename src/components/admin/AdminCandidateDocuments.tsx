"use client";

import { useState } from "react";
import { Lock, FileText, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { getAdminDocumentUrl } from "@/app/(admin)/admin/candidates/actions";
import { CATEGORY_LABELS } from "@/app/(admin)/admin/documents/constants";

export interface DocumentItem {
  id: string;
  category: string;
  file_name: string;
  status: string;
  expiry_date: string | null;
  is_sensitive: boolean;
  uploaded_at: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" },
  pending_review: { label: "Needs Info", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30" },
  uploaded: { label: "Uploaded", cls: "bg-muted text-muted-foreground border-border" },
  ai_extracted: { label: "AI Extracted", cls: "bg-primary/10 text-primary border-primary/30" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function AdminCandidateDocuments({ documents }: { documents: DocumentItem[] }) {
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [errorDocId, setErrorDocId] = useState<{ id: string; msg: string } | null>(null);

  const handleView = async (docId: string) => {
    setLoadingDocId(docId);
    setErrorDocId(null);
    const res = await getAdminDocumentUrl(docId);
    setLoadingDocId(null);
    if (res.signedUrl) {
      window.open(res.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setErrorDocId({ id: docId, msg: res.error || "Could not load document" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-sm font-bold text-foreground">Compliance & Verification Documents</h3>
        <span className="text-xs text-muted-foreground">{documents.length} uploaded</span>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">No documents uploaded yet.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {documents.map((doc) => {
            const isSensitive = doc.is_sensitive || ["health_fitness", "eye_test"].includes(doc.category);
            const statusConfig = STATUS_MAP[doc.status] || { label: doc.status, cls: "bg-muted text-muted-foreground" };
            const catLabel = CATEGORY_LABELS[doc.category] || doc.category;
            const isLoading = loadingDocId === doc.id;

            return (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground mt-0.5">
                    <FileText className="size-3.5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate">{catLabel}</span>
                      {isSensitive && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.2 text-[10px] font-semibold text-destructive">
                          <Lock className="size-2.5" /> Sensitive
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-medium ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[200px]">{doc.file_name}</span>
                      {doc.expiry_date && <span>&bull; Exp: {doc.expiry_date}</span>}
                    </div>
                    {errorDocId?.id === doc.id && (
                      <p className="text-[11px] text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> {errorDocId.msg}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleView(doc.id)}
                  disabled={isLoading}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <><Loader2 className="size-3 animate-spin" /> Loading...</> : <><ExternalLink className="size-3.5" /> View</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
