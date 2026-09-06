"use client";

import { Check, Loader2, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import {
  deleteStateRequirement,
  updateFrameworkVersion,
  upsertStateRequirement,
} from "@/app/(admin)/admin/compliance/actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type StateRequirementItem,
  StateRequirementRow,
} from "./StateRequirementRow";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

interface Props {
  initialFrameworkVersion: string;
  initialRequirements: StateRequirementItem[];
}

export function ComplianceConfigView({
  initialFrameworkVersion,
  initialRequirements,
}: Props) {
  const router = useRouter();
  const [version, setVersion] = useState(initialFrameworkVersion);
  const [vStatus, setVStatus] = useState<
    "idle" | "loading" | "saved" | "error"
  >("idle");
  const [vMsg, setVMsg] = useState<string | null>(null);

  const [reqs, setReqs] = useState<StateRequirementItem[]>(initialRequirements);
  const [activeTab, setActiveTab] = useState("NSW");
  const [isAdding, setIsAdding] = useState(false);
  const [newAppliesTo, setNewAppliesTo] = useState("");
  const [newText, setNewText] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSaveVersion = async () => {
    setVStatus("loading");
    setVMsg(null);
    const res = await updateFrameworkVersion(version);
    if (res.error) {
      setVStatus("error");
      setVMsg(res.error);
    } else {
      setVStatus("saved");
      setTimeout(() => setVStatus("idle"), 2500);
      router.refresh();
    }
  };

  const handleUpdateReq = async (
    id: string,
    appliesTo: string,
    text: string,
  ): Promise<string | null> => {
    const res = await upsertStateRequirement(id, activeTab, appliesTo, text);
    if (res.error) return res.error;
    setReqs((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, applies_to: appliesTo, requirement_text: text }
          : r,
      ),
    );
    router.refresh();
    return null;
  };

  const handleDeleteReq = async (id: string): Promise<string | null> => {
    const res = await deleteStateRequirement(id);
    if (res.error) return res.error;
    setReqs((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
    return null;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return setAddError("Requirement text is required.");
    setAddLoading(true);
    setAddError(null);
    const res = await upsertStateRequirement(
      null,
      activeTab,
      newAppliesTo,
      newText,
    );
    setAddLoading(false);
    if (res.error) {
      setAddError(res.error);
    } else {
      setReqs([
        ...reqs,
        {
          id: res.id || crypto.randomUUID(),
          state: activeTab,
          applies_to: newAppliesTo.trim() || null,
          requirement_text: newText.trim(),
        },
      ]);
      setIsAdding(false);
      setNewAppliesTo("");
      setNewText("");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Framework Version
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            Authoritative Standard
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="text-xl font-bold rounded-lg border border-border bg-background p-2.5 text-foreground flex-1"
          />
          <Button
            onClick={handleSaveVersion}
            disabled={
              vStatus === "loading" || version === initialFrameworkVersion
            }
            className="sm:w-28 text-xs cursor-pointer bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            {vStatus === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : vStatus === "saved" ? (
              <>
                <Check className="size-3.5 mr-1" /> Saved
              </>
            ) : (
              "Save Version"
            )}
          </Button>
        </div>
        {vMsg && <p className="text-xs text-destructive">{vMsg}</p>}
        <p className="text-xs text-muted-foreground">
          Update this when training.gov.au publishes a new release.
        </p>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-medium">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        <span>
          State/Territory requirements may vary. Verify applicable requirements
          before relying on this assessment.
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            State & Territory Specific Mandates
          </h2>
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            size="sm"
            className="text-xs font-semibold cursor-pointer gap-1"
          >
            <Plus className="size-3.5" /> Add Requirement
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto gap-1">
            {AU_STATES.map((st) => {
              const count = reqs.filter((r) => r.state === st).length;
              return (
                <TabsTrigger
                  key={st}
                  value={st}
                  className="cursor-pointer font-medium px-3 py-1.5 flex items-center gap-1.5 text-xs"
                >
                  <span>{st}</span>
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] rounded-full font-mono font-semibold ${count > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {AU_STATES.map((st) => {
            const stateReqs = reqs.filter((r) => r.state === st);
            return (
              <TabsContent key={st} value={st} className="space-y-3">
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  {stateReqs.length === 0 && !isAdding && (
                    <div className="flex min-h-[160px] flex-col items-center justify-center p-8 text-center">
                      <ShieldAlert className="size-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        No specific licensing requirements registered for {st}.
                      </p>
                    </div>
                  )}
                  {stateReqs.map((item) => (
                    <StateRequirementRow
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateReq}
                      onDelete={handleDeleteReq}
                    />
                  ))}
                  {isAdding && (
                    <form
                      onSubmit={handleAddSubmit}
                      className="p-3.5 bg-muted/20 border-t border-border space-y-3"
                    >
                      <input
                        type="text"
                        placeholder="Applies to (e.g. Fair Trading Motor Dealers & Repairers Act)"
                        value={newAppliesTo}
                        onChange={(e) => setNewAppliesTo(e.target.value)}
                        className="w-full text-xs rounded border border-border bg-background p-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="Mandatory compliance clause or requirement..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        className="w-full text-xs rounded border border-border bg-background p-2"
                        required
                      />
                      {addError && (
                        <p className="text-[11px] text-destructive">
                          {addError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAdding(false)}
                          disabled={addLoading}
                          className="cursor-pointer text-xs h-7"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addLoading}
                          className="cursor-pointer text-xs h-7 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                        >
                          {addLoading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
