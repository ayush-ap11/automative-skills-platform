"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { upsertCompetencyUnit } from "@/app/(admin)/admin/competency-framework/actions";

export interface CompetencyUnitRecord {
  id: string;
  qualification_code: string | null;
  unit_code: string;
  unit_title: string;
  skill_set: string | null;
  competency_area: string | null;
  assessment_criteria: string | null;
  version: string;
  effective_date: string | null;
  state_applicability: string[] | null;
  evidence_requirements: string | null;
}

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: CompetencyUnitRecord | null;
  defaultFrameworkVersion?: string;
  onSuccess: () => void;
}

export function CompetencyUnitFormDialog({ open, onOpenChange, unit, defaultFrameworkVersion = "AUR Release 9.0", onSuccess }: Props) {
  const [qualCode, setQualCode] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [skillSet, setSkillSet] = useState("");
  const [area, setArea] = useState("");
  const [criteria, setCriteria] = useState("");
  const [version, setVersion] = useState(defaultFrameworkVersion);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (unit) {
      setQualCode(unit.qualification_code || "");
      setCode(unit.unit_code);
      setTitle(unit.unit_title);
      setSkillSet(unit.skill_set || "");
      setArea(unit.competency_area || "");
      setCriteria(unit.assessment_criteria || "");
      setVersion(unit.version || defaultFrameworkVersion);
      setEffectiveDate(unit.effective_date ? unit.effective_date.slice(0, 10) : "");
      setStates(unit.state_applicability || []);
      setEvidence(unit.evidence_requirements || "");
    } else {
      setQualCode(""); setCode(""); setTitle(""); setSkillSet(""); setArea("");
      setCriteria(""); setVersion(defaultFrameworkVersion); setEffectiveDate("");
      setStates([]); setEvidence("");
    }
  }, [open, unit, defaultFrameworkVersion]);

  const toggleState = (st: string) => {
    setStates((prev) => (prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return setErrorMsg("Unit Code and Unit Title are required.");
    setLoading(true); setErrorMsg(null);

    const res = await upsertCompetencyUnit(unit?.id || null, {
      qualificationCode: qualCode,
      unitCode: code,
      unitTitle: title,
      skillSet,
      competencyArea: area,
      assessmentCriteria: criteria,
      version,
      effectiveDate: effectiveDate || null,
      stateApplicability: states,
      evidenceRequirements: evidence,
    });

    setLoading(false);
    if (res.error) setErrorMsg(res.error);
    else { onOpenChange(false); onSuccess(); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{unit ? "Edit Competency Unit" : "Add Competency Unit"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {errorMsg && <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs"><AlertCircle className="size-4 shrink-0" /> {errorMsg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="font-semibold block mb-1">Qualification Code</label><input type="text" placeholder="AUR30620" value={qualCode} onChange={(e) => setQualCode(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
            <div><label className="font-semibold block mb-1">Unit Code *</label><input type="text" placeholder="AURETR005" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded border border-border bg-background p-2 font-mono uppercase" required /></div>
            <div><label className="font-semibold block mb-1">Version *</label><input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full rounded border border-border bg-background p-2" required /></div>
          </div>
          <div><label className="font-semibold block mb-1">Unit Title *</label><input type="text" placeholder="e.g. Install automotive electrical components" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border border-border bg-background p-2" required /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="font-semibold block mb-1">Skill Set</label><input type="text" placeholder="EV / Hybrid" value={skillSet} onChange={(e) => setSkillSet(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
            <div><label className="font-semibold block mb-1">Competency Area</label><input type="text" placeholder="Electrical" value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
            <div><label className="font-semibold block mb-1">Effective Date</label><input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full rounded border border-border bg-background p-2" /></div>
          </div>
          <div>
            <label className="font-semibold block mb-1">State Applicability (Empty = All States)</label>
            <div className="flex flex-wrap gap-1.5">
              {AU_STATES.map((st) => {
                const active = states.includes(st);
                return (
                  <button type="button" key={st} onClick={() => toggleState(st)} className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
          <div><label className="font-semibold block mb-1">Assessment Criteria</label><textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={2} placeholder="Mandatory performance criteria..." className="w-full rounded border border-border bg-background p-2" /></div>
          <div><label className="font-semibold block mb-1">Evidence Requirements</label><textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={2} placeholder="Workplace logbooks, third party reports, or practical observations..." className="w-full rounded border border-border bg-background p-2" /></div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="cursor-pointer">Cancel</Button>
            <Button type="submit" disabled={loading} className="cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">{loading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...</> : unit ? "Save Changes" : <><Plus className="size-3.5 mr-1" /> Add Unit</>}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
