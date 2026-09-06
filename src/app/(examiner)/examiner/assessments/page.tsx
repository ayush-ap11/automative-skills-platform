import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AssessmentQueueList,
  AssessmentQueueItem,
} from "@/components/examiner/AssessmentQueueList";

export const dynamic = "force-dynamic";

export default async function ExaminerAssessmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawAssessments } = await supabase
    .from("assessments")
    .select(`
      id,
      status,
      assigned_at,
      candidate_profile_id,
      assessment_templates (title),
      candidate_profiles (
        profiles (
          full_name,
          preferred_name
        )
      )
    `)
    .eq("assigned_examiner_id", user.id);

  const sorted = [...(rawAssessments || [])].sort((a, b) => {
    if (a.status === "submitted" && b.status !== "submitted") return -1;
    if (a.status !== "submitted" && b.status === "submitted") return 1;
    const dateA = new Date(a.assigned_at || 0).getTime();
    const dateB = new Date(b.assigned_at || 0).getTime();
    return dateB - dateA;
  });

  const items: AssessmentQueueItem[] = sorted.map((a: any) => {
    const p = a.candidate_profiles?.profiles;
    const candidateName = p?.preferred_name || p?.full_name || "Unknown Candidate";
    return {
      id: a.id,
      candidateName,
      templateTitle: a.assessment_templates?.title || "Vocational Assessment",
      status: a.status,
      submittedAt: a.assigned_at,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Assessments Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          All vocational and technical assessments assigned to you across candidates.
        </p>
      </div>

      <AssessmentQueueList assessments={items} />
    </div>
  );
}
