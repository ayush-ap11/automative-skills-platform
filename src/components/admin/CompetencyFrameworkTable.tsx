"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetencyUnitFormDialog, CompetencyUnitRecord } from "./CompetencyUnitFormDialog";
import { deleteCompetencyUnit } from "@/app/(admin)/admin/competency-framework/actions";

interface Props {
  initialUnits: CompetencyUnitRecord[];
  defaultFrameworkVersion: string;
  usageCounts: Record<string, number>;
}

export function CompetencyFrameworkTable({ initialUnits, defaultFrameworkVersion, usageCounts }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<CompetencyUnitRecord | null>(null);

  const filtered = useMemo(() => {
    return initialUnits.filter((u) => {
      const matchText = search ? u.unit_code.toLowerCase().includes(search.toLowerCase()) || u.unit_title.toLowerCase().includes(search.toLowerCase()) : true;
      if (!matchText) return false;
      if (selectedState !== "all") {
        if (!u.state_applicability || u.state_applicability.length === 0) return true;
        return u.state_applicability.includes(selectedState);
      }
      return true;
    });
  }, [initialUnits, search, selectedState]);

  const handleDelete = async (e: React.MouseEvent, unit: CompetencyUnitRecord) => {
    e.stopPropagation();
    const count = usageCounts[unit.unit_code] || 0;
    const warn = count > 0 ? `\n\nWarning: Used by ${count} question(s) — they'll keep the reference as plain text.` : "";
    if (!confirm(`Are you sure you want to delete ${unit.unit_code} (${unit.unit_title})?${warn}`)) return;
    await deleteCompetencyUnit(unit.id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <input type="text" placeholder="Search unit code or title..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background" />
          </div>
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-xs cursor-pointer">
            <option value="all">All States / National</option>
            {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button onClick={() => { setSelectedUnit(null); setDialogOpen(true); }} className="w-full sm:w-auto text-xs font-semibold cursor-pointer gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
          <Plus className="size-4" /> Add Unit
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
          No competency units configured yet.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {filtered.map((u) => (
            <div key={u.id} onClick={() => { setSelectedUnit(u); setDialogOpen(true); }} className="p-4 hover:bg-muted/40 cursor-pointer transition-colors space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground border border-border">{u.unit_code}</span>
                    <span className="font-semibold text-xs text-foreground">{u.unit_title}</span>
                    {u.qualification_code && <span className="text-[10px] text-muted-foreground">({u.qualification_code})</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                    {u.competency_area && <span>Area: {u.competency_area}</span>}
                    {u.skill_set && <><span>•</span><span>Skill Set: {u.skill_set}</span></>}
                    <span>•</span>
                    <span>Version: {u.version}</span>
                    {u.effective_date && <><span>•</span><span className="inline-flex items-center gap-1" suppressHydrationWarning><Calendar className="size-3" /> {new Date(u.effective_date).toLocaleDateString("en-AU")}</span></>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={(e) => handleDelete(e, u)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive cursor-pointer transition-colors" title="Delete Unit">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Applicability:</span>
                {(!u.state_applicability || u.state_applicability.length === 0) ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">All States</span>
                ) : (
                  u.state_applicability.map((st) => (
                    <span key={st} className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">{st}</span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CompetencyUnitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} defaultFrameworkVersion={defaultFrameworkVersion} onSuccess={() => router.refresh()} />
    </div>
  );
}
