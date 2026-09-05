import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SystemSettingsView, OrganisationData, SystemSettingsData } from "@/components/admin/SystemSettingsView";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  let org: any = null;
  const { data: orgWithCode, error: orgErr } = await supabase
    .from("organisations")
    .select("id, name, logo_url, primary_color, secondary_color, invite_code")
    .eq("id", orgId)
    .maybeSingle();

  if (orgErr) {
    const { data: fallbackOrg } = await supabase
      .from("organisations")
      .select("id, name, logo_url, primary_color, secondary_color")
      .eq("id", orgId)
      .maybeSingle();
    org = fallbackOrg;
  } else {
    org = orgWithCode;
  }

  const { data: settingsRow } = await supabase
    .from("system_settings")
    .select("passing_threshold, category_weights, retention_policy_days")
    .eq("organisation_id", orgId)
    .maybeSingle();

  const organisation: OrganisationData = {
    id: org?.id || orgId,
    name: org?.name || "Automotive Skills Assessment Centre",
    logo_url: org?.logo_url || null,
    primary_color: org?.primary_color || null,
    secondary_color: org?.secondary_color || null,
    invite_code: org?.invite_code || null,
  };

  const settings: SystemSettingsData = {
    passing_threshold: Number(settingsRow?.passing_threshold) || 60,
    category_weights: settingsRow?.category_weights || null,
    retention_policy_days: Number(settingsRow?.retention_policy_days) || 2555,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenant identity, branding, grading criteria, and ASQA data retention mandates.
        </p>
      </div>

      <SystemSettingsView organisation={organisation} settings={settings} />
    </div>
  );
}
