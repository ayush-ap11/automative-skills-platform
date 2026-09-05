"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, Plus, X, ShieldAlert, KeyRound } from "lucide-react";
import { updateExaminer, resetUserPassword } from "@/app/(admin)/admin/examiners/actions";
import { OneTimePasswordPanel } from "@/components/admin/OneTimePasswordPanel";

export interface ExaminerRecord {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  specialisation_areas: string[];
  max_active_candidates: number;
  assigned_candidates_count: number;
  pending_reviews_count: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examiner: ExaminerRecord | null;
  onSuccess: () => void;
}

export function EditExaminerDialog({ open, onOpenChange, examiner, onSuccess }: Props) {
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [customSpec, setCustomSpec] = useState("");
  const [maxCandidates, setMaxCandidates] = useState("20");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setNewPassword(null);
    if (examiner) {
      setSpecialisations(examiner.specialisation_areas || []);
      setMaxCandidates(String(examiner.max_active_candidates || 20));
      setIsActive(examiner.is_active !== false);
    }
  }, [open, examiner]);

  const addSpec = (item: string) => {
    const val = item.trim();
    if (val && !specialisations.includes(val)) setSpecialisations([...specialisations, val]);
  };

  const removeSpec = (item: string) => setSpecialisations(specialisations.filter((s) => s !== item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examiner?.id) return;
    setLoading(true); setErrorMsg(null);
    const res = await updateExaminer(examiner.id, specialisations, Number(maxCandidates) || 20, isActive);
    setLoading(false);
    if (res.error) setErrorMsg(res.error);
    else { onOpenChange(false); onSuccess(); }
  };

  const handleResetPassword = async () => {
    if (!examiner?.id) return;
    setResetting(true); setErrorMsg(null);
    const res = await resetUserPassword(examiner.id);
    setResetting(false);
    if (res.error) setErrorMsg(res.error);
    else if (res.newPassword) setNewPassword(res.newPassword);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && !resetting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{newPassword ? "Temporary Password Generated" : "Edit Examiner Profile"}</DialogTitle>
          {examiner && <p className="text-xs text-muted-foreground">{examiner.full_name} ({examiner.email})</p>}
        </DialogHeader>

        {newPassword ? (
          <OneTimePasswordPanel
            email={examiner?.email || ""}
            password={newPassword}
            roleLabel="examiner"
            onDone={() => { setNewPassword(null); onOpenChange(false); onSuccess(); }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="size-4 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="font-semibold block mb-1">Specialisation Areas</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {specialisations.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                    {s} <button type="button" onClick={() => removeSpec(s)} className="cursor-pointer hover:text-destructive"><X className="size-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input type="text" placeholder="Add area..." value={customSpec} onChange={(e) => setCustomSpec(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(customSpec); setCustomSpec(""); } }} className="flex-1 rounded border border-border bg-background p-1.5 text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={() => { addSpec(customSpec); setCustomSpec(""); }} className="h-7 text-xs cursor-pointer"><Plus className="size-3" /> Add</Button>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Max Active Candidates</label>
              <input type="number" min="1" max="100" value={maxCandidates} onChange={(e) => setMaxCandidates(e.target.value)} className="w-full rounded border border-border bg-background p-2" required />
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-foreground">Examiner Active Status</span>
                  <span className="text-[11px] text-muted-foreground">{isActive ? "Permitted to login and receive assignments" : "Deactivated"}</span>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} className="cursor-pointer" />
              </div>
              {!isActive && (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  <ShieldAlert className="size-3.5 shrink-0 mt-0.5" />
                  <span>Deactivating stops new assignments and login access — existing reviews and history are kept.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={handleResetPassword} disabled={loading || resetting} className="cursor-pointer text-amber-600 border-amber-500/30 hover:bg-amber-500/10 h-8 text-xs">
                {resetting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <KeyRound className="size-3.5 mr-1" />}
                Reset Password
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading || resetting} className="cursor-pointer h-8 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={loading || resetting} className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 h-8 text-xs">
                  {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Changes
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
