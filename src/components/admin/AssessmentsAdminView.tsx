"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutTemplate, UserCheck, Layers, Calendar, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { AssignAssessmentDialog } from "./AssignAssessmentDialog";

interface TemplateItem {
  id: string;
  title: string;
  framework_version: string;
  section_count: number;
  created_at: string;
}

interface AssignedItem {
  id: string;
  candidate_name: string;
  template_title: string;
  examiner_name: string;
  status: string;
  assigned_at: string;
}

interface Props {
  templates: TemplateItem[];
  assignedAssessments: AssignedItem[];
  candidates: Array<{ id: string; name: string; email: string }>;
  examiners: Array<{ id: string; name: string; email: string }>;
  frameworkVersion: string;
}

export function AssessmentsAdminView({ templates, assignedAssessments, candidates, examiners, frameworkVersion }: Props) {
  const router = useRouter();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      not_started: "bg-muted text-muted-foreground border-border",
      in_progress: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      submitted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      under_review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${map[status] || map.not_started}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="templates">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="templates" className="cursor-pointer gap-1.5">
              <LayoutTemplate className="size-3.5" /> Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="cursor-pointer gap-1.5">
              <UserCheck className="size-3.5" /> Assigned ({assignedAssessments.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="templates" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setTemplateDialogOpen(true)} className="text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
              <Plus className="size-4" /> New Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
              No assessment templates found — create your first one.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/admin/assessments/templates/${t.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-xs sm:text-sm text-foreground hover:underline">{t.title}</div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {t.section_count} {t.section_count === 1 ? "Section" : "Sections"}</span>
                      <span>•</span>
                      <span>Framework: {t.framework_version || "Standard"}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setAssignDialogOpen(true)} className="text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
              <Plus className="size-4" /> Assign New Assessment
            </Button>
          </div>

          {assignedAssessments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
              No assessments assigned yet — assign one to a candidate.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {assignedAssessments.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-xs sm:text-sm text-foreground">{a.candidate_name}</div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{a.template_title}</span>
                      <span>•</span>
                      <span>Examiner: {a.examiner_name}</span>
                      <span>•</span>
                      <span>Assigned: {new Date(a.assigned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto">{getStatusBadge(a.status)}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TemplateFormDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} defaultFrameworkVersion={frameworkVersion} onSuccess={() => router.refresh()} />
      <AssignAssessmentDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} candidates={candidates} templates={templates.map(t => ({ id: t.id, title: t.title }))} examiners={examiners} onSuccess={() => router.refresh()} />
    </div>
  );
}
