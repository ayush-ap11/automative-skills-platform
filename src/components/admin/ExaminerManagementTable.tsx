"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, Clock, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteExaminerDialog } from "./InviteExaminerDialog";
import { EditExaminerDialog, ExaminerRecord } from "./EditExaminerDialog";

interface Props {
  examiners: ExaminerRecord[];
  initialAction?: string;
}

export function ExaminerManagementTable({ examiners, initialAction }: Props) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(initialAction === "invite");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerRecord | null>(null);

  const handleEditClick = (e: React.MouseEvent, ex: ExaminerRecord) => {
    e.stopPropagation();
    setSelectedExaminer(ex);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Manage authorized vocational examiners, workload capacity, and credentials.</p>
        <Button onClick={() => setInviteOpen(true)} className="w-full sm:w-auto text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
          <UserPlus className="size-4" /> Invite Examiner
        </Button>
      </div>

      {examiners.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
          No examiners yet — invite your first one.
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Examiner</th>
                  <th className="p-3">Specialisations</th>
                  <th className="p-3 text-center">Assigned Candidates</th>
                  <th className="p-3 text-center">Pending Reviews</th>
                  <th className="p-3 text-center">Max Capacity</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {examiners.map((ex) => (
                  <tr key={ex.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{ex.full_name}</div>
                      <div className="text-[11px] text-muted-foreground">{ex.email}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {ex.specialisation_areas?.length > 0 ? (
                          ex.specialisation_areas.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">{s}</span>
                          ))
                        ) : <span className="text-muted-foreground">—</span>}
                        {ex.specialisation_areas?.length > 3 && <span className="text-[10px] text-muted-foreground">+{ex.specialisation_areas.length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center font-medium">
                      <span className="inline-flex items-center gap-1"><Users className="size-3 text-muted-foreground" /> {ex.assigned_candidates_count}</span>
                    </td>
                    <td className="p-3 text-center font-medium">
                      {ex.pending_reviews_count > 0 ? (
                        <button type="button" onClick={() => router.push("/admin/assessments?tab=assigned")} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 font-semibold cursor-pointer transition-colors text-[11px]" title="Click to view pending assigned assessments">
                          <Clock className="size-3" /> {ex.pending_reviews_count} Pending
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="size-3" /> 0</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{ex.max_active_candidates}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ex.is_active ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : "bg-muted text-[var(--muted-foreground)] border-border"}`}>
                        {ex.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => router.push("/admin/assessments?tab=assigned")} className="h-7 px-2 text-xs cursor-pointer">
                          <Eye className="size-3 mr-1" /> Assessments
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, ex)} className="h-7 px-2 text-xs cursor-pointer">
                          <Edit3 className="size-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2.5">
            {examiners.map((ex) => (
              <div key={ex.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-xs text-foreground">{ex.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{ex.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ex.is_active ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : "bg-muted text-[var(--muted-foreground)] border-border"}`}>
                    {ex.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60 text-muted-foreground">
                  <span>Assigned: <strong className="text-foreground">{ex.assigned_candidates_count}</strong> / {ex.max_active_candidates}</span>
                  <span>Pending: {ex.pending_reviews_count > 0 ? (
                    <button type="button" onClick={() => router.push("/admin/assessments?tab=assigned")} className="text-amber-600 font-bold underline cursor-pointer">{ex.pending_reviews_count}</button>
                  ) : <strong className="text-foreground">0</strong>}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                  <Button variant="outline" size="sm" onClick={() => router.push("/admin/assessments?tab=assigned")} className="h-7 px-2.5 text-xs cursor-pointer">
                    <Eye className="size-3 mr-1" /> View Assessments
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, ex)} className="h-7 px-2.5 text-xs cursor-pointer">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <InviteExaminerDialog open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={() => router.refresh()} />
      <EditExaminerDialog open={editOpen} onOpenChange={setEditOpen} examiner={selectedExaminer} onSuccess={() => router.refresh()} />
    </div>
  );
}
