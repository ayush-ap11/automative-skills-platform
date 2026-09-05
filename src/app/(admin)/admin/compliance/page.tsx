import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComplianceConfigView } from "@/components/admin/ComplianceConfigView";

export const dynamic = "force-dynamic";

export default async function AdminCompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: settings } = await supabase.from("system_settings").select("framework_version").eq("organisation_id", orgId).maybeSingle();
  const frameworkVersion = settings?.framework_version || "AUR Release 9.0";

  const { data: reqs } = await supabase
    .from("state_requirements")
    .select("id, state, applies_to, requirement_text")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Regulatory Mandates</h1>
        <p className="text-sm text-muted-foreground">
          Maintain training package standards, ASQA compliance, and state-level licensing requirements.
        </p>
      </div>

      <ComplianceConfigView
        initialFrameworkVersion={frameworkVersion}
        initialRequirements={reqs || []}
      />
    </div>
  );
}
