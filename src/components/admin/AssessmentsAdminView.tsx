"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutTemplate, UserCheck, Layers, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { AssignAssessmentDialog } from "./AssignAssessmentDialog";
import { AdminAssignedAssessmentsList, AssignedItem } from "./AdminAssignedAssessmentsList";

export interface TemplateItem {
  id: string; title: string; framework_version: string; section_count: number; created_at: string;
}

interface Props {
  templates: TemplateItem[]; assignedAssessments: AssignedItem[];
  candidates: Array<{ id: string; name: string; email: string }>;
  examiners: Array<{ id: string; name: string; email: string }>;
  frameworkVersion: string; initialTab?: string; initialStatus?: string; initialAction?: string;
}

export function AssessmentsAdminView({ templates, assignedAssessments, candidates, examiners, frameworkVersion, initialTab = "templates", initialStatus = "all", initialAction }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"templates" | "assigned">(initialTab === "assigned" ? "assigned" : "templates");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(initialAction === "assign");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const pendingCount = assignedAssessments.filter(a => a.status === "submitted" || a.status === "under_review").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Rounded Sliding Segmented Control */}
        <div className="relative inline-grid grid-cols-2 p-1 rounded-full bg-muted/80 border border-border shadow-inner backdrop-blur-xs select-none min-w-[320px] sm:min-w-[360px]">
          {/* Animated Slider Pill that slides on active */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[var(--primary)] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              activeTab === "templates" ? "left-1" : "left-1/2"
            }`}
          />

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`relative z-10 flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-200 ${
              activeTab === "templates" ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutTemplate className="size-3.5" />
            <span>Templates</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "templates" ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground border border-border"
            }`}>
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={`relative z-10 flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-200 ${
              activeTab === "assigned" ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-3.5" />
            <span>Assigned</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "assigned" ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground border border-border"
            }`}>
              {assignedAssessments.length}
            </span>
            {pendingCount > 0 && (
              <span className={`size-2 rounded-full transition-colors ${
                activeTab === "assigned" ? "bg-amber-300 ring-2 ring-white/30" : "bg-amber-500"
              } animate-pulse`} title={`${pendingCount} pending review`} />
            )}
          </button>
        </div>

        {activeTab === "templates" ? (
          <Button onClick={() => setTemplateDialogOpen(true)} className="rounded-full text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 px-4">
            <Plus className="size-4" /> New Template
          </Button>
        ) : (
          <Button onClick={() => setAssignDialogOpen(true)} className="rounded-full text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 px-4">
            <Plus className="size-4" /> Assign New Assessment
          </Button>
        )}
      </div>

      {activeTab === "templates" ? (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">No assessment templates found.</div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {templates.map((t) => (
                <div key={t.id} onClick={() => router.push(`/admin/assessments/templates/${t.id}`)} className="flex items-center justify-between p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-xs sm:text-sm text-foreground hover:underline">{t.title}</div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {t.section_count} {t.section_count === 1 ? "Section" : "Sections"}</span>
                      <span>•</span><span>Framework: {t.framework_version || "Standard"}</span>
                      <span>•</span><span className="inline-flex items-center gap-1" suppressHydrationWarning><Calendar className="size-3" /> {new Date(t.created_at).toLocaleDateString("en-AU")}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <AdminAssignedAssessmentsList
          items={assignedAssessments}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          pendingCount={pendingCount}
        />
      )}

      <TemplateFormDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} defaultFrameworkVersion={frameworkVersion} onSuccess={() => router.refresh()} />
      <AssignAssessmentDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} candidates={candidates} templates={templates.map(t => ({ id: t.id, title: t.title }))} examiners={examiners} onSuccess={() => router.refresh()} />
    </div>
  );
}
