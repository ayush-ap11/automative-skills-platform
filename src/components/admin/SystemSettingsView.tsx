"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Check, Building2, Clock, Palette, Copy, RefreshCw, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryWeightsCard } from "./CategoryWeightsCard";
import { updateOrganisation, uploadLogo, updateRetentionPolicy, regenerateInviteCode } from "@/app/(admin)/admin/settings/actions";

export interface OrganisationData {
  id: string; name: string; logo_url: string | null;
  primary_color: string | null; secondary_color: string | null; invite_code?: string | null;
}

export interface SystemSettingsData {
  passing_threshold: number; category_weights: Record<string, number> | null; retention_policy_days: number;
}

interface Props { organisation: OrganisationData; settings: SystemSettingsData; }

export function SystemSettingsView({ organisation, settings }: Props) {
  const [orgName, setOrgName] = useState(organisation.name || "");
  const [primaryColor, setPrimaryColor] = useState(organisation.primary_color || "#0284c7");
  const [secondaryColor, setSecondaryColor] = useState(organisation.secondary_color || "#0f172a");
  const [logoUrl, setLogoUrl] = useState<string | null>(organisation.logo_url);
  const [inviteCode, setInviteCode] = useState(organisation.invite_code || "");
  const [orgStatus, setOrgStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(String(settings.retention_policy_days || 2555));
  const [retStatus, setRetStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [retMsg, setRetMsg] = useState<string | null>(null);

  const approxYears = (Number(retentionDays) / 365.25).toFixed(1);

  const handleSaveOrg = async () => {
    setOrgStatus("loading"); setOrgMsg(null);
    const res = await updateOrganisation(orgName, primaryColor, secondaryColor);
    if (res.error) { setOrgStatus("error"); setOrgMsg(res.error); }
    else { setOrgStatus("saved"); setTimeout(() => setOrgStatus("idle"), 2500); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true); setLogoMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadLogo(formData);
    setLogoUploading(false);
    if (res.error) setLogoMsg(res.error);
    else if (res.url) setLogoUrl(res.url);
  };

  const handleRegenerateCode = async () => {
    setCodeStatus("loading"); setCodeMsg(null);
    const res = await regenerateInviteCode();
    if (res.error) { setCodeStatus("error"); setCodeMsg(res.error); }
    else if (res.newCode) {
      setInviteCode(res.newCode); setCodeStatus("saved");
      setTimeout(() => setCodeStatus("idle"), 2500);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveRetention = async () => {
    setRetStatus("loading"); setRetMsg(null);
    const res = await updateRetentionPolicy(Number(retentionDays) || 2555);
    if (res.error) { setRetStatus("error"); setRetMsg(res.error); }
    else { setRetStatus("saved"); setTimeout(() => setRetStatus("idle"), 2500); }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5"><Building2 className="size-4 text-primary" /> Organisation & Branding</h2>
            <p className="text-muted-foreground text-[11px]">Configure tenant identity, portal branding, and candidate registration code.</p>
          </div>
          <Button onClick={handleSaveOrg} disabled={orgStatus === "loading"} size="sm" className="cursor-pointer text-xs h-8 bg-primary text-primary-foreground hover:opacity-90">
            {orgStatus === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : orgStatus === "saved" ? <><Check className="size-3.5 mr-1" /> Saved</> : "Save Details"}
          </Button>
        </div>
        {orgMsg && <p className="text-destructive text-xs">{orgMsg}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold block mb-1">Organisation Legal Name *</label>
            <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full rounded border border-border bg-background p-2 text-xs" required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Organisation Logo (PNG, JPG, SVG - Max 2MB)</label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative size-10 rounded border border-border overflow-hidden bg-muted/40 shrink-0">
                  <Image src={logoUrl} alt="Logo" fill unoptimized className="object-contain p-1" />
                </div>
              ) : <div className="size-10 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0 text-[10px]">No logo</div>}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/40 font-semibold cursor-pointer text-xs">
                {logoUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                <span>{logoUploading ? "Uploading..." : "Upload New Logo"}</span>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleFileChange} disabled={logoUploading} className="hidden" />
              </label>
            </div>
            {logoMsg && <p className="text-destructive text-[11px] mt-1">{logoMsg}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <label className="font-semibold block mb-1 flex items-center gap-1"><Palette className="size-3" /> Primary Brand Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="size-8 rounded border border-border cursor-pointer p-0.5" />
              <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 rounded border border-border bg-background p-1.5 font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1 flex items-center gap-1"><Palette className="size-3" /> Secondary Brand Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="size-8 rounded border border-border cursor-pointer p-0.5" />
              <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-28 rounded border border-border bg-background p-1.5 font-mono text-xs" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold block flex items-center gap-1.5"><KeyRound className="size-3.5 text-primary" /> Candidate Registration Invite Code</label>
            <Button onClick={handleRegenerateCode} disabled={codeStatus === "loading"} variant="outline" size="sm" className="cursor-pointer text-xs h-7 gap-1">
              {codeStatus === "loading" ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {codeStatus === "saved" ? "Regenerated!" : "Regenerate Code"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded border border-border bg-muted/60 font-mono text-xs font-bold tracking-wider text-foreground select-all">{inviteCode || "Not generated"}</div>
            <Button onClick={handleCopyCode} variant="outline" size="sm" className="cursor-pointer text-xs h-7 gap-1">
              {codeCopied ? <><Check className="size-3 text-[var(--success)]" /> Copied</> : <><Copy className="size-3" /> Copy</>}
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px]">Share this 8-character code with candidates to link their account to this organisation.</p>
          {codeMsg && <p className="text-destructive text-xs">{codeMsg}</p>}
        </div>
      </div>

      <CategoryWeightsCard initialThreshold={settings.passing_threshold} initialWeights={settings.category_weights || {}} />

      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5"><Clock className="size-4 text-primary" /> Data Retention Policy</h2>
            <p className="text-muted-foreground text-[11px]">Audit ledger and evidence retention compliance.</p>
          </div>
          <Button onClick={handleSaveRetention} disabled={retStatus === "loading"} size="sm" className="cursor-pointer text-xs h-8 bg-primary text-primary-foreground hover:opacity-90">
            {retStatus === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : retStatus === "saved" ? <><Check className="size-3.5 mr-1" /> Saved</> : "Save Retention"}
          </Button>
        </div>
        {retMsg && <p className="text-destructive text-xs">{retMsg}</p>}
        <div className="flex items-center gap-3 max-w-sm">
          <input type="number" min="30" max="7300" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} className="w-32 rounded border border-border bg-background p-2 text-xs font-semibold" />
          <span className="text-xs text-muted-foreground font-medium">days</span>
          <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded border border-border">(~{approxYears} years)</span>
        </div>
        <p className="text-muted-foreground text-[11px]">Standard ASQA / Standards for RTOs retention mandate is 7 years (2555 days).</p>
      </div>
    </div>
  );
}
