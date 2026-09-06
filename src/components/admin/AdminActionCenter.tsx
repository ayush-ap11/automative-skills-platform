"use client";

import Link from "next/link";
import { AlertCircle, Clock, FileCheck, ArrowRight, UserPlus, FilePlus2, Users, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionCenterProps {
  pendingReviews: number;
  docsAwaitingVerification: number;
  safetyFlags: number;
  aiFlags: number;
}

export function AdminActionCenter({
  pendingReviews,
  docsAwaitingVerification,
  safetyFlags,
}: ActionCenterProps) {
  const hasPendingItems = pendingReviews > 0 || docsAwaitingVerification > 0 || safetyFlags > 0;

  return (
    <div className="space-y-4">
      {hasPendingItems && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3">
            <AlertCircle className="size-4 text-amber-600" />
            <span>Operational Items Requiring Admin Action</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReviews > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{pendingReviews} Assessment{pendingReviews > 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-muted-foreground">Submitted for review</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/assessments?tab=assigned&status=submitted" />} className="h-7 text-xs px-2.5 cursor-pointer border-amber-500/30 text-amber-700 hover:bg-amber-500/10">
                  Review <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}

            {docsAwaitingVerification > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileCheck className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{docsAwaitingVerification} Document{docsAwaitingVerification > 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-muted-foreground">Awaiting verification</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/documents" />} className="h-7 text-xs px-2.5 cursor-pointer">
                  Verify <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}

            {safetyFlags > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
                    <AlertCircle className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-700">{safetyFlags} Safety Flag{safetyFlags > 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-muted-foreground">Flagged responses</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/assessments?tab=assigned" />} className="h-7 text-xs px-2.5 cursor-pointer border-rose-500/30 text-rose-700 hover:bg-rose-500/10">
                  Inspect <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Flow Launchpad */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card text-xs">
        <span className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider px-1">
          Quick Workflow:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/assessments?tab=assigned&action=assign" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted font-medium text-foreground transition-colors cursor-pointer">
            <FilePlus2 className="size-3.5 text-primary" /> Assign Assessment
          </Link>
          <Link href="/admin/examiners?action=invite" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted font-medium text-foreground transition-colors cursor-pointer">
            <UserPlus className="size-3.5 text-primary" /> Invite Examiner
          </Link>
          <Link href="/admin/candidates" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted font-medium text-foreground transition-colors cursor-pointer">
            <Users className="size-3.5 text-primary" /> Candidate Directory
          </Link>
          <Link href="/admin/questions" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted font-medium text-foreground transition-colors cursor-pointer">
            <HelpCircle className="size-3.5 text-primary" /> Question Bank
          </Link>
        </div>
      </div>
    </div>
  );
}
