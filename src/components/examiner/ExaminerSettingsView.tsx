"use client";

import { useState } from "react";
import { z } from "zod";
import { Bell, KeyRound, Loader2, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updatePassword, toggleEmailNotifications } from "@/app/(candidate)/settings/actions";

interface Props {
  email: string;
  emailNotificationsEnabled: boolean;
}

const pwSchema = z.string().min(8, "Password must be at least 8 characters");

export function ExaminerSettingsView({ email, emailNotificationsEnabled }: Props) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(emailNotificationsEnabled);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

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
    const res = await toggleEmailNotifications(val);
    if (!res.success) {
      setEmailNotifs(prev);
      setNotifStatus("Failed to update notification settings.");
    } else {
      setNotifStatus("Notification preferences saved.");
      setTimeout(() => setNotifStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Details */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          <Shield className="size-4 text-primary" />
          <span>Examiner Account</span>
        </div>
        <div className="text-xs space-y-1">
          <span className="text-muted-foreground">Registered Examiner Email</span>
          <p className="font-semibold text-foreground">{email}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          <Bell className="size-4 text-primary" />
          <span>Assessment Notifications</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">Email Notifications</p>
            <p className="text-[11px] text-muted-foreground">Receive email alerts when candidates submit assessments or evidence.</p>
          </div>
          <Switch checked={emailNotifs} onCheckedChange={handleToggle} />
        </div>
        {notifStatus && <p className="text-xs text-muted-foreground mt-2">{notifStatus}</p>}
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          <KeyRound className="size-4 text-primary" />
          <span>Change Password</span>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-sm">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary" placeholder="At least 8 characters" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Confirm Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary" placeholder="Re-enter password" />
          </div>
          {pwStatus && (
            <p className={`text-xs flex items-center gap-1 ${pwStatus.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
              {pwStatus.type === "success" && <CheckCircle2 className="size-3.5" />}
              {pwStatus.msg}
            </p>
          )}
          <Button type="submit" size="sm" disabled={pwLoading} className="text-xs cursor-pointer">
            {pwLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
