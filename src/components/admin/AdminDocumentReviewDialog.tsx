"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, XCircle, HelpCircle, Loader2, AlertCircle, Lock } from "lucide-react";
import { getAdminDocumentDetails, reviewDocumentAdmin, AdminDocumentDetailsResult } from "@/app/(admin)/admin/documents/actions";

interface Props {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: (docId: string) => void;
}

const DECISIONS = [
  { key: "verified" as const, label: "Verify", icon: CheckCircle2, cls: "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10" },
  { key: "rejected" as const, label: "Reject", icon: XCircle, cls: "border-destructive text-destructive bg-destructive/10" },
  { key: "needs_more_info" as const, label: "Needs Info", icon: HelpCircle, cls: "border-[var(--warning)] text-[var(--warning)] bg-[var(--warning)]/10" },
];

export function AdminDocumentReviewDialog({ documentId, open, onOpenChange, onReviewed }: Props) {
  const [details, setDetails] = useState<AdminDocumentDetailsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<"verified" | "rejected" | "needs_more_info" | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId) {
      setDetails(null); setDecision(null); setComment(""); setError(null); setSubmitError(null); return;
    }
    let cancelled = false;
    setLoading(true);
    getAdminDocumentDetails(documentId).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error); else setDetails(res);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, documentId]);

  const handleSubmit = async () => {
    if (!documentId || !decision) return;
    setSubmitting(true); setSubmitError(null);
    const res = await reviewDocumentAdmin(documentId, decision, comment);
    setSubmitting(false);
    if (res.error) setSubmitError(res.error);
    else { onOpenChange(false); onReviewed(documentId); }
  };

  const aiData = details?.aiExtractedData;
  const hasAiData = aiData && typeof aiData === "object" && Object.keys(aiData).length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{details?.categoryLabel || "Document Oversight"}</DialogTitle>
            {details?.isSensitive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <Lock className="size-3" /> Sensitive Document
              </span>
            )}
          </div>
          <DialogDescription className="truncate">{details?.fileName || "Loading evidence record..."}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-44 items-center justify-center text-muted-foreground"><Loader2 className="size-6 animate-spin mr-2" /> Loading document...</div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg"><AlertCircle className="size-4 shrink-0" /> {error}</div>
        ) : details ? (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center rounded-lg border border-border p-2.5 bg-muted/20">
              <span className="font-medium text-muted-foreground truncate mr-2">{details.fileName}</span>
              {details.fileUrl && (
                <a href={details.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline cursor-pointer">
                  <ExternalLink className="size-3.5" /> View File
                </a>
              )}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">AI-Extracted Data</h4>
              {hasAiData ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(aiData as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="overflow-hidden">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}: </span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground italic text-[11px]">AI extraction not available for this record</p>}
            </div>

            {details.pastReviews && details.pastReviews.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Past Reviews (All Reviewers)</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {details.pastReviews.map((r) => (
                    <div key={r.id} className="border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span className="text-foreground font-semibold">{r.reviewerName}</span>
                        <span className="capitalize">{r.decision.replace(/_/g, " ")} • {new Date(r.reviewedAt).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <p className="text-foreground mt-0.5 italic">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1 border-t border-border">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Admin Review Decision</h4>
              <div className="grid grid-cols-3 gap-2">
                {DECISIONS.map((d) => {
                  const Icon = d.icon; const isSel = decision === d.key;
                  return (
                    <button type="button" key={d.key} onClick={() => setDecision(d.key)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${isSel ? d.cls + " ring-2 ring-primary ring-offset-1" : "border-border hover:bg-muted/50 text-foreground"}`}>
                      <Icon className="size-4 mb-1" />{d.label}
                    </button>
                  );
                })}
              </div>
              <textarea rows={2} placeholder="Optional review comment or feedback..." value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 text-xs" />
            </div>

            {submitError && <div className="text-xs text-destructive flex items-center gap-1.5"><AlertCircle className="size-3.5 shrink-0" /> {submitError}</div>}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="cursor-pointer">Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={!decision || submitting || loading} className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
            {submitting ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...</> : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
