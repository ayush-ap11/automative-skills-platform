"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { ChecklistItem, CategoryDefinition } from "@/app/(candidate)/documents/types";
import { DocumentChecklistRow } from "@/components/candidate/documents/DocumentChecklistRow";
import { DocumentUploadDialog } from "@/components/candidate/DocumentUploadDialog";

interface DocumentChecklistProps {
  items: ChecklistItem[];
}

export function DocumentChecklist({ items }: DocumentChecklistProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalCategories = items.length;
  const uploadedCount = items.filter((i) => i.document !== null).length;
  const verifiedCount = items.filter((i) => i.document?.status === "verified").length;
  const pendingCount = items.filter((i) => i.document?.status === "uploaded" || i.document?.status === "pending_review").length;

  const currentItem = activeCategory ? items.find((i) => i.category.key === activeCategory.key) : null;
  const hasConsent = currentItem?.hasConsent ?? false;

  function handleOpenUpload(category: CategoryDefinition) {
    setActiveCategory(category);
    setIsDialogOpen(true);
  }

  function handleUploadSuccess() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileCheck className="h-4 w-4 text-primary" />
            Uploaded
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {uploadedCount} <span className="text-xs font-normal text-muted-foreground">/ {totalCategories}</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Verified
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">{verifiedCount}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock className="h-4 w-4 text-warning" />
            Pending Review
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">{pendingCount}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Missing
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">{totalCategories - uploadedCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Required Evidence & Certificates</h2>
          <span className="text-xs text-muted-foreground">
            {uploadedCount} of {totalCategories} categories submitted
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <DocumentChecklistRow
              key={item.category.key}
              item={item}
              onUploadClick={handleOpenUpload}
            />
          ))}
        </div>
      </div>

      <DocumentUploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={activeCategory}
        existingConsent={hasConsent}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
