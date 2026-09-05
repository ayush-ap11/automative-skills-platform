import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportsList, ReportItem } from "@/components/candidate/ReportsList";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cp) redirect("/profile");

  const { data: rawReports } = await supabase
    .from("reports")
    .select("id, report_type, generated_at, file_storage_path")
    .eq("candidate_profile_id", cp.id)
    .order("generated_at", { ascending: false });

  const reports: ReportItem[] = (rawReports || []).map((r) => ({
    id: r.id,
    report_type: r.report_type,
    generated_at: r.generated_at,
    file_storage_path: r.file_storage_path,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download and inspect certified assessment summaries, EV readiness evaluations, and transcripts.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 max-w-md text-sm font-medium text-foreground">
            Your assessment report will appear here once it&apos;s ready.
          </p>
        </div>
      ) : (
        <ReportsList reports={reports} />
      )}
    </div>
  );
}
