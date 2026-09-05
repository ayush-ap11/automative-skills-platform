import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssessmentList, AssessmentItem } from "@/components/candidate/AssessmentList";

export const dynamic = "force-dynamic";

const STATUS_PRIORITY: Record<string, number> = {
  in_progress: 1,
  not_started: 2,
  submitted: 3,
  under_review: 4,
  completed: 5,
};

export default async function AssessmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!candidateProfile) {
    redirect("/candidate/dashboard");
  }

  const { data: rawAssessments } = await supabase
    .from("assessments")
    .select("id, template_id, status, assigned_at, overall_score, assessment_templates(title, framework_version)")
    .eq("candidate_profile_id", candidateProfile.id);

  const assessments: AssessmentItem[] = (rawAssessments || [])
    .map((item: any) => ({
      id: item.id,
      template_id: item.template_id,
      status: item.status,
      assigned_at: item.assigned_at,
      overall_score: item.overall_score,
      template: item.assessment_templates
        ? {
            title: item.assessment_templates.title,
            framework_version: item.assessment_templates.framework_version,
          }
        : null,
    }))
    .sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] ?? 99;
      const priorityB = STATUS_PRIORITY[b.status] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assessments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access technical knowledge modules, scenario appraisals, and competency checkpoints.
        </p>
      </div>

      <AssessmentList assessments={assessments} />
    </div>
  );
}
