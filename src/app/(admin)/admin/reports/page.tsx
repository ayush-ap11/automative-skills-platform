import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminReportsList, AdminReportItem } from "@/components/admin/AdminReportsList";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: reportsData } = await supabase
    .from("reports")
    .select(`
      id, candidate_profile_id, report_type, generated_by, generated_at,
      candidate_profiles!inner(
        id,
        profiles!inner(id, full_name, organisation_id)
      )
    `)
    .eq("candidate_profiles.profiles.organisation_id", orgId)
    .order("generated_at", { ascending: false });

  const reports: AdminReportItem[] = (reportsData || []).map((r: any) => ({
    id: r.id,
    candidate_id: r.candidate_profile_id,
    candidate_name: r.candidate_profiles?.profiles?.full_name || "Unknown Candidate",
    report_type: r.report_type,
    generated_by: r.generated_by,
    generated_at: r.generated_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assessment & Compliance Reports</h1>
        <p className="text-sm text-muted-foreground">
          View and download generated candidate assessment transcripts, ASQA audit reports, and EV readiness summaries.
        </p>
      </div>

      <AdminReportsList reports={reports} />
    </div>
  );
}
