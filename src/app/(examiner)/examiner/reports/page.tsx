import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ExaminerReportsList,
  ExaminerReportItem,
} from "@/components/examiner/ExaminerReportsList";

export const dynamic = "force-dynamic";

export default async function ExaminerReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Find candidate profile IDs assigned to this examiner
  const { data: assessments } = await admin
    .from("assessments")
    .select("candidate_profile_id")
    .eq("assigned_examiner_id", user.id);

  const candidateProfileIds = Array.from(
    new Set((assessments || []).map((a) => a.candidate_profile_id).filter(Boolean))
  ) as string[];

  if (candidateProfileIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Candidate Assessment Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Official competency verification and assessment outcome reports for your assigned candidates.
          </p>
        </div>
        <ExaminerReportsList reports={[]} />
      </div>
    );
  }

  // Fetch reports for these assigned candidates
  const { data: rawReports } = await admin
    .from("reports")
    .select(`
      id,
      candidate_profile_id,
      assessment_id,
      report_type,
      file_storage_path,
      generated_by,
      generated_at,
      candidate_profiles (
        id,
        profiles (
          full_name,
          preferred_name
        )
      )
    `)
    .in("candidate_profile_id", candidateProfileIds)
    .order("generated_at", { ascending: false });

  const reports: ExaminerReportItem[] = (rawReports || []).map((r: any) => {
    const cp = r.candidate_profiles;
    const prof = Array.isArray(cp?.profiles) ? cp.profiles[0] : cp?.profiles;
    const candidateName = prof?.preferred_name || prof?.full_name || "Candidate";

    return {
      id: r.id,
      candidateId: r.candidate_profile_id,
      candidateName,
      reportType: r.report_type,
      generatedAt: r.generated_at,
      generatedBy: r.generated_by || "system",
      fileStoragePath: r.file_storage_path,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidate Assessment Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Official competency verification and assessment outcome reports for your assigned candidates.
        </p>
      </div>

      <ExaminerReportsList reports={reports} />
    </div>
  );
}
