"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, XCircle, HelpCircle, Loader2, AlertCircle } from "lucide-react";
import { getDocumentDetails, reviewDocument, DocumentDetailsResult } from "@/app/(examiner)/examiner/documents/actions";

interface Props {
  documentId: string | null; open: boolean;
  onOpenChange: (open: boolean) => void; onReviewed: (docId: string) => void;
}

const DECISIONS = [
  { key: "verified" as const, label: "Verify", icon: CheckCircle2, cls: "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10" },
  { key: "rejected" as const, label: "Reject", icon: XCircle, cls: "border-destructive text-destructive bg-destructive/10" },
  { key: "needs_more_info" as const, label: "Needs Info", icon: HelpCircle, cls: "border-[var(--warning)] text-[var(--warning)] bg-[var(--warning)]/10" },
];

export function DocumentReviewDialog({ documentId, open, onOpenChange, onReviewed }: Props) {
  const [details, setDetails] = useState<DocumentDetailsResult | null>(null);
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
    getDocumentDetails(documentId).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else setDetails(res);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, documentId]);

  const handleSubmit = async () => {
    if (!documentId || !decision) return;
    setSubmitting(true); setSubmitError(null);
    const res = await reviewDocument(documentId, decision, comment);
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
          <DialogTitle>{details?.categoryLabel || "Document Review"}</DialogTitle>
          <DialogDescription className="truncate">
            {details?.fileName || (loading ? "Loading file details..." : "Verification details and evidence review")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-44 items-center justify-center text-muted-foreground"><Loader2 className="size-6 animate-spin mr-2" /> Loading document...</div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg"><AlertCircle className="size-4 shrink-0" /> {error}</div>
        ) : details ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center rounded-lg border border-border p-2.5 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground truncate mr-2">{details.fileName}</span>
              {details.fileUrl && (
                <a href={details.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
                  <ExternalLink className="size-3.5" /> View File
                </a>
              )}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI-Extracted Data</h4>
              {hasAiData ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(aiData as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="overflow-hidden">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}: </span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground italic">AI extraction not yet available for this document</p>}
            </div>

            {details.pastReviews && details.pastReviews.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Past Reviews</h4>
                <div className="space-y-2 max-h-28 overflow-y-auto">
                  {details.pastReviews.map((r) => (
                    <div key={r.id} className="text-xs border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span className="text-foreground">{r.reviewerName}</span>
                        <span>{new Date(r.reviewedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="capitalize text-primary font-semibold">{r.decision.replace(/_/g, " ")}</div>
                      {r.comment && <p className="text-muted-foreground mt-0.5">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {DECISIONS.map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <button key={btn.key} type="button" onClick={() => setDecision(btn.key)}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${decision === btn.key ? btn.cls : "border-border hover:bg-muted/40"}`}>
                      <Icon className="size-4" /> {btn.label}
                    </button>
                  );
                })}
              </div>
              {decision && (
                <div className="mt-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground block">Comment {decision === "verified" ? "(Optional)" : "(Recommended)"}</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add verification feedback or reason..."
                    rows={2} className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer" />
                </div>
              )}
            </div>

            {submitError && <div className="p-2 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20">{submitError}</div>}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!decision || submitting || loading} className="cursor-pointer">
            {submitting ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...</> : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
