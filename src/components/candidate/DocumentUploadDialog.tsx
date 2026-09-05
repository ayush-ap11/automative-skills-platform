"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/candidate/documents/FileDropzone";
import { CategoryDefinition } from "@/app/(candidate)/documents/types";
import { uploadDocument } from "@/app/(candidate)/documents/actions";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDefinition | null;
  existingConsent: boolean;
  onUploadSuccess?: () => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  category,
  existingConsent,
  onUploadSuccess,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!category) return null;
  const requiresConsent = category.isSensitive && !existingConsent;
  const isUploadDisabled = status === "loading" || !file || (requiresConsent && !consentChecked);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !category) return;
    setStatus("loading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("category", category.key);
    formData.append("file", file);
    if (category.hasExpiry && expiryDate) formData.append("expiryDate", expiryDate);
    if (requiresConsent && consentChecked) formData.append("consentGranted", "true");

    const result = await uploadDocument(formData);
    if (result.error) {
      setStatus("error");
      setErrorMessage(result.error);
    } else {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setFile(null);
        setExpiryDate("");
        setConsentChecked(false);
        onOpenChange(false);
        onUploadSuccess?.();
      }, 1000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => status !== "loading" && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category.label}</DialogTitle>
          <DialogDescription>{category.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-4">
          {requiresConsent && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                Privacy & Medical Consent Required
              </div>
              <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span>I consent to uploading this document for assessment purposes.</span>
              </label>
            </div>
          )}

          <FileDropzone
            file={file}
            onFileSelect={setFile}
            disabled={status === "loading" || (requiresConsent && !consentChecked)}
            onError={setErrorMessage}
          />

          {category.hasExpiry && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Document Expiry Date (optional)</label>
              <input
                type="date"
                value={expiryDate}
                disabled={status === "loading"}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={status === "loading"} onClick={() => onOpenChange(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={isUploadDisabled} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 min-w-28">
              {status === "loading" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>}
              {status === "success" && <><CheckCircle2 className="mr-2 h-4 w-4 text-white" />Uploaded</>}
              {status !== "loading" && status !== "success" && "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
