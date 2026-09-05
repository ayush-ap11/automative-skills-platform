"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Mail, Plus, X } from "lucide-react";
import { inviteExaminer } from "@/app/(admin)/admin/examiners/actions";
import { OneTimePasswordPanel } from "@/components/admin/OneTimePasswordPanel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COMMON_SPECIALISATIONS = ["EV & High Voltage", "Hybrid Powertrain", "Light Vehicle Mechanical", "Heavy Commercial", "Electrical Diagnostics", "Air Conditioning", "Braking & Safety Systems"];

export function InviteExaminerDialog({ open, onOpenChange, onSuccess }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialisations, setSpecialisations] = useState<string[]>(["Light Vehicle Mechanical"]);
  const [customSpec, setCustomSpec] = useState("");
  const [maxCandidates, setMaxCandidates] = useState("20");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFullName(""); setEmail(""); setSpecialisations(["Light Vehicle Mechanical"]);
      setCustomSpec(""); setMaxCandidates("20"); setLoading(false); setErrorMsg(null); setTemporaryPassword(null);
    }
  }, [open]);

  const addSpec = (item: string) => {
    const val = item.trim();
    if (val && !specialisations.includes(val)) setSpecialisations([...specialisations, val]);
  };

  const removeSpec = (item: string) => {
    setSpecialisations(specialisations.filter((s) => s !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return setErrorMsg("Full name and email are required.");
    setLoading(true); setErrorMsg(null);

    const res = await inviteExaminer(fullName, email, specialisations, Number(maxCandidates) || 20);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.temporaryPassword) {
      setTemporaryPassword(res.temporaryPassword);
    }
  };

  const handleDone = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{temporaryPassword ? "Examiner Account Created" : "Invite Assessment Examiner"}</DialogTitle>
        </DialogHeader>

        {temporaryPassword ? (
          <OneTimePasswordPanel
            email={email}
            password={temporaryPassword}
            roleLabel="examiner"
            onDone={handleDone}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="size-4 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}
            <div>
              <label className="font-semibold block mb-1">Full Name *</label>
              <input type="text" placeholder="e.g. Sarah Jenkins" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded border border-border bg-background p-2" required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Email Address *</label>
              <input type="email" placeholder="sarah.jenkins@skills.edu.au" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-border bg-background p-2" required />
            </div>
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
                <input type="text" placeholder="Add custom area..." value={customSpec} onChange={(e) => setCustomSpec(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(customSpec); setCustomSpec(""); } }} className="flex-1 rounded border border-border bg-background p-1.5 text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={() => { addSpec(customSpec); setCustomSpec(""); }} className="h-7 text-xs cursor-pointer"><Plus className="size-3" /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_SPECIALISATIONS.filter((s) => !specialisations.includes(s)).slice(0, 3).map((cs) => (
                  <button key={cs} type="button" onClick={() => addSpec(cs)} className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-border text-muted-foreground hover:text-foreground cursor-pointer">
                    + {cs}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-semibold block mb-1">Max Active Candidates</label>
              <input type="number" min="1" max="100" value={maxCandidates} onChange={(e) => setMaxCandidates(e.target.value)} className="w-full rounded border border-border bg-background p-2" required />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={loading} className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
                {loading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Creating...</> : <><Mail className="size-3.5 mr-1" /> Create Examiner</>}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
