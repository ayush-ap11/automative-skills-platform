"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  AlertTriangle,
  MailCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OneTimePasswordPanelProps {
  email: string;
  password: string;
  roleLabel?: string; // e.g. "examiner" or "candidate"
  emailSent?: boolean;
  emailWarning?: string | null;
  onDone: () => void;
}

export function OneTimePasswordPanel({
  email,
  password,
  roleLabel = "examiner",
  emailSent,
  emailWarning,
  onDone,
}: OneTimePasswordPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
      const textarea = document.createElement("textarea");
      textarea.value = password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">
          Account Email
        </label>
        <div className="rounded border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
          {email}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">
          Temporary Password
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded border border-border bg-muted/50 px-3 py-2 font-mono text-sm font-semibold tracking-wider text-foreground select-all">
            {password}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 px-3 text-xs cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="size-3.5 mr-1 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {emailSent && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <MailCheck className="size-4 shrink-0 text-emerald-600" />
          <span>
            Examiner invite email successfully sent via Brevo with login link
            and credentials.
          </span>
        </div>
      )}

      {emailWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-semibold">Email could not be delivered:</span>{" "}
            {emailWarning}
            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300/90">
              Please copy the temporary password below and provide it to the
              examiner manually.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <span className="font-bold">
          This password is shown only once — copy it now and share it directly
          with the {roleLabel}.
        </span>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="button"
          onClick={onDone}
          className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 text-xs px-5"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
