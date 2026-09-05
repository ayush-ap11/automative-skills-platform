"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, UserCheck } from "lucide-react";
import { assignAssessment } from "@/app/(admin)/admin/assessments/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Array<{ id: string; name: string; email: string }>;
  templates: Array<{ id: string; title: string }>;
  examiners: Array<{ id: string; name: string; email: string }>;
  onSuccess?: () => void;
}

export function AssignAssessmentDialog({ open, onOpenChange, candidates, templates, examiners, onSuccess }: Props) {
  const [candidateId, setCandidateId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [examinerId, setExaminerId] = useState("");
  const [searchCand, setSearchCand] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCandidateId(candidates[0]?.id || "");
      setTemplateId(templates[0]?.id || "");
      setExaminerId(examiners[0]?.id || "");
      setSearchCand("");
      setErrorMsg(null);
    }
  }, [open, candidates, templates, examiners]);

  const filteredCandidates = useMemo(() => {
    if (!searchCand.trim()) return candidates;
    const q = searchCand.toLowerCase();
    return candidates.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [candidates, searchCand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId) return setErrorMsg("Please select a candidate.");
    if (!templateId) return setErrorMsg("Please select an assessment template.");
    if (!examinerId) return setErrorMsg("Please select an assigned examiner.");
    setLoading(true); setErrorMsg(null);
    const res = await assignAssessment(candidateId, templateId, examinerId);
    setLoading(false);
    if (res.error) setErrorMsg(res.error); else { onOpenChange(false); onSuccess?.(); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign New Assessment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" /><span>{errorMsg}</span>
            </div>
          )}
          <div>
            <label className="font-semibold block mb-1">Select Candidate *</label>
            <input
              type="text" placeholder="Search candidate..." value={searchCand} onChange={(e) => setSearchCand(e.target.value)}
              className="w-full mb-1.5 rounded-md border border-border bg-background p-2 text-xs"
            />
            <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 cursor-pointer" required>
              {filteredCandidates.length === 0 && <option value="">No candidates</option>}
              {filteredCandidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Assessment Template *</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 cursor-pointer" required>
              {templates.length === 0 && <option value="">No templates</option>}
              {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Assigned Examiner *</label>
            <select value={examinerId} onChange={(e) => setExaminerId(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 cursor-pointer" required>
              {examiners.length === 0 && <option value="">No examiners</option>}
              {examiners.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.email})</option>)}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="cursor-pointer">Cancel</Button>
            <Button type="submit" disabled={loading || !candidateId || !templateId || !examinerId} className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
              {loading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Assigning...</> : <><UserCheck className="size-3.5 mr-1" /> Assign Assessment</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
