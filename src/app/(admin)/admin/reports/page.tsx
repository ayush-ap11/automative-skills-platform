import { redirect } from "next/navigation";
import React from "react";
import {
  type AdminReportItem,
  AdminReportsList,
} from "@/components/admin/AdminReportsList";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id)
    redirect("/auth/login");
  const orgId = profile.organisation_id;

  const [{ data: reportsData }, { data: assessmentsData }] = await Promise.all([
    supabase
      .from("reports")
      .select(`
        id, candidate_profile_id, assessment_id, report_type, generated_by, generated_at,
        candidate_profiles!inner(
          id,
          profiles!inner(id, full_name, organisation_id)
        )
      `)
      .eq("candidate_profiles.profiles.organisation_id", orgId)
      .order("generated_at", { ascending: false }),
    supabase
      .from("assessments")
      .select(`
        id, candidate_profile_id, status, overall_score, completed_at,
        candidate_profiles!inner(
          id,
          profiles!inner(id, full_name, organisation_id)
        )
      `)
      .eq("candidate_profiles.profiles.organisation_id", orgId)
      .in("status", ["submitted", "completed"]),
  ]);

  const reportedAssessmentIds = new Set<string>();
  const reports: AdminReportItem[] = (reportsData || []).map((r: any) => {
    if (r.assessment_id) reportedAssessmentIds.add(r.assessment_id);
    return {
      id: r.id,
      candidate_id: r.candidate_profile_id,
      candidate_name:
        r.candidate_profiles?.profiles?.full_name || "Unknown Candidate",
      report_type: r.report_type,
      generated_by: r.generated_by,
      generated_at: r.generated_at,
      has_report: true,
      assessment_id: r.assessment_id,
    };
  });

  for (const a of assessmentsData || []) {
    if (!reportedAssessmentIds.has(a.id)) {
      const candidateProfile = Array.isArray(a.candidate_profiles)
        ? a.candidate_profiles[0]
        : a.candidate_profiles;
      const candProfile = Array.isArray(candidateProfile?.profiles)
        ? candidateProfile.profiles[0]
        : candidateProfile?.profiles;
      reports.push({
        id: `pending-${a.id}`,
        candidate_id: a.candidate_profile_id,
        candidate_name: candProfile?.full_name || "Candidate",
        report_type: "assessment_report",
        generated_by: "system",
        generated_at: a.completed_at || new Date().toISOString(),
        has_report: false,
        assessment_id: a.id,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Assessment & Compliance Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          View and download generated candidate assessment transcripts, ASQA
          audit reports, and EV readiness summaries.
        </p>
      </div>

      <AdminReportsList reports={reports} />
    </div>
  );
}
