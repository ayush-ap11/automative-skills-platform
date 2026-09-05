"use client";

import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, Bell, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updatePassword, toggleEmailNotifications, revokeConsent } from "@/app/(candidate)/settings/actions";

export interface ConsentItem { id: string; consent_type: string; granted: boolean; granted_at: string; }

interface SettingsViewProps {
  email: string;
  emailNotificationsEnabled: boolean;
  consents: ConsentItem[];
}

const REVOCABLE = new Set(["health_fitness", "health_document_upload", "eye_test", "eye_test_upload"]);
const LABELS: Record<string, string> = {
  health_fitness: "Health & Fitness Medical Consent",
  health_document_upload: "Health Document Consent",
  eye_test: "Vision & Eye Test Consent",
  eye_test_upload: "Eye Test Document Consent",
};

const pwSchema = z.string().min(8, "Password must be at least 8 characters");

export function SettingsView({ email, emailNotificationsEnabled, consents: initialConsents }: SettingsViewProps) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(emailNotificationsEnabled);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const [consents, setConsents] = useState(initialConsents);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [consentMsg, setConsentMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    const parsed = pwSchema.safeParse(newPw);
    if (!parsed.success) return setPwStatus({ type: "error", msg: parsed.error.issues[0].message });
    if (newPw !== confirmPw) return setPwStatus({ type: "error", msg: "Passwords do not match." });

    setPwLoading(true);
    const res = await updatePassword(newPw);
    setPwLoading(false);
    if (res.success) {
      setNewPw("");
      setConfirmPw("");
      setPwStatus({ type: "success", msg: "Password updated successfully." });
      setTimeout(() => setPwStatus(null), 3000);
    } else {
      setPwStatus({ type: "error", msg: res.error || "Failed to update password." });
    }
  };

  const handleToggle = async (val: boolean) => {
    const prev = emailNotifs;
    setEmailNotifs(val);
    setNotifStatus(null);
    const res = await toggleEmailNotifications(val);
    if (res.success) {
      setNotifStatus(val ? "Email notifications enabled" : "Email notifications disabled");
      setTimeout(() => setNotifStatus(null), 3000);
    } else {
      setEmailNotifs(prev);
      setNotifStatus("Failed to update preferences");
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await revokeConsent(id);
    if (res.success) {
      setConsents((prev) => prev.map((c) => (c.id === id ? { ...c, granted: false } : c)));
      setConsentMsg("Consent revoked successfully.");
      setTimeout(() => setConsentMsg(null), 3000);
    } else {
      setConsentMsg(res.error || "Failed to revoke consent.");
    }
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Account & Password */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyRound className="size-4 text-primary" />
          <span>Account Credentials</span>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Account Email</label>
          <input disabled value={email} className="w-full max-w-md rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Contact your organisation to change your email address.</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2 border-t border-border/60 max-w-md">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="password" placeholder="New password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs" />
            <input type="password" placeholder="Confirm password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs" />
          </div>
          {pwStatus && <p className={`text-xs ${pwStatus.type === "success" ? "text-success" : "text-destructive"}`}>{pwStatus.msg}</p>}
          <Button type="submit" disabled={pwLoading} size="sm" className="cursor-pointer">{pwLoading && <Loader2 className="size-3 animate-spin mr-1.5" />}Update Password</Button>
        </form>
      </div>

      {/* 2. Notifications */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Bell className="size-4 text-primary" /><span>Notifications</span></div>
        <div className="flex items-center justify-between max-w-md">
          <div><p className="text-xs font-medium text-foreground">Email Notifications</p><p className="text-[11px] text-muted-foreground">Receive reminders and examiner updates.</p></div>
          <Switch checked={emailNotifs} onCheckedChange={handleToggle} className="cursor-pointer" />
        </div>
        {notifStatus && <p className="text-xs text-primary font-medium">{notifStatus}</p>}
      </div>

      {/* 3. Privacy & Consents */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="size-4 text-primary" /><span>Privacy & Consents</span></div>
        {consentMsg && <p className="text-xs text-primary font-medium">{consentMsg}</p>}
        <div className="divide-y divide-border/60">
          {consents.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2.5 text-xs">
              <div>
                <p className="font-medium text-foreground">{LABELS[c.consent_type] || c.consent_type}</p>
                <p className="text-[11px] text-muted-foreground">Status: {c.granted ? "Granted" : "Revoked"} ({new Date(c.granted_at).toLocaleDateString("en-AU")})</p>
              </div>
              {REVOCABLE.has(c.consent_type) && c.granted && (
                confirmId === c.id ? (
                  <div className="flex gap-1.5"><Button size="sm" variant="destructive" className="h-6 text-[10px] cursor-pointer px-2" onClick={() => handleRevoke(c.id)}>Confirm</Button><Button size="sm" variant="outline" className="h-6 text-[10px] cursor-pointer px-2" onClick={() => setConfirmId(null)}>Cancel</Button></div>
                ) : (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] cursor-pointer text-destructive border-destructive/30" onClick={() => setConfirmId(c.id)}>Revoke</Button>
                )
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground pt-1">Revoking a document consent does not delete files already uploaded — contact your organisation to request deletion.</p>
      </div>
    </div>
  );
}
