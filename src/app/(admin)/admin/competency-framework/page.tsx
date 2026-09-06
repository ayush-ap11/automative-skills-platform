import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompetencyFrameworkTable } from "@/components/admin/CompetencyFrameworkTable";

export const dynamic = "force-dynamic";

export default async function AdminCompetencyFrameworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: settings } = await supabase.from("system_settings").select("framework_version").eq("organisation_id", orgId).maybeSingle();
  const defaultFrameworkVersion = settings?.framework_version || "AUR Release 9.0";

  const { data: units } = await supabase
    .from("competency_framework")
    .select("*")
    .eq("organisation_id", orgId)
    .order("unit_code", { ascending: true });

  const { data: questions } = await supabase
    .from("questions")
    .select("competency_mapping, assessment_sections!inner(assessment_templates!inner(organisation_id))")
    .eq("assessment_sections.assessment_templates.organisation_id", orgId);

  const usageCounts: Record<string, number> = {};
  (questions || []).forEach((q: any) => {
    (q.competency_mapping || []).forEach((code: string) => {
      usageCounts[code] = (usageCounts[code] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Competency Framework</h1>
        <p className="text-sm text-muted-foreground">
          Manage Australian Automotive Retail, Service and Repair (AUR) training package competency units and licensing mappings.
        </p>
      </div>

      <CompetencyFrameworkTable
        initialUnits={units || []}
        defaultFrameworkVersion={defaultFrameworkVersion}
        usageCounts={usageCounts}
      />
    </div>
  );
}
