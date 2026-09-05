import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeedbackView, AssessmentOption, SkillGapItem, ExaminerCommentItem } from "@/components/candidate/FeedbackView";

export const dynamic = "force-dynamic";

interface FeedbackPageProps {
  searchParams: Promise<{ assessmentId?: string }>;
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const { assessmentId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).maybeSingle();
  if (!cp) redirect("/profile");

  const { data: completedAssessments } = await supabase
    .from("assessments")
    .select("id, status, outcome, completed_at, assigned_at, assessment_templates(title)")
    .eq("candidate_profile_id", cp.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (!completedAssessments || completedAssessments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">Examiner observations, strengths, and targeted development recommendations.</p>
        </div>
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 max-w-md text-sm font-medium text-foreground">
            Feedback will appear here once an examiner has reviewed your assessment.
          </p>
        </div>
      </div>
    );
  }

  const selectedAssessment = completedAssessments.find((a) => a.id === assessmentId) || completedAssessments[0];
  const allOptions: AssessmentOption[] = completedAssessments.map((a: any) => {
    const tmpl = Array.isArray(a.assessment_templates) ? a.assessment_templates[0] : a.assessment_templates;
    return { id: a.id, title: tmpl?.title || "Automotive Assessment" };
  });

  const selectedTmpl = Array.isArray((selectedAssessment as any).assessment_templates)
    ? (selectedAssessment as any).assessment_templates[0]
    : (selectedAssessment as any).assessment_templates;
  const assessmentTitle = selectedTmpl?.title || "Automotive Competency Assessment";

  const { data: swot } = await supabase
    .from("swot_analyses")
    .select("strengths, weaknesses")
    .eq("assessment_id", selectedAssessment.id)
    .maybeSingle();

  const { data: rawSkillGaps } = await supabase
    .from("skill_gaps")
    .select("competency_unit_code, gap_description, recommended_action")
    .eq("assessment_id", selectedAssessment.id);

  const adminClient = createAdminClient();
  const { data: examinerReviews } = await adminClient
    .from("examiner_reviews")
    .select(`comment, candidate_answers!inner(assessment_id, questions(question_text))`)
    .eq("candidate_answers.assessment_id", selectedAssessment.id)
    .not("comment", "is", null);

  const examinerComments: ExaminerCommentItem[] = (examinerReviews || [])
    .filter((r: any) => r.comment && r.comment.trim().length > 0)
    .map((r: any) => ({
      question_text: r.candidate_answers?.questions?.question_text || "Assessment Question",
      comment: r.comment,
    }));

  const skillGaps: SkillGapItem[] = (rawSkillGaps || []).map((g) => ({
    competency_unit_code: g.competency_unit_code,
    gap_description: g.gap_description,
    recommended_action: g.recommended_action,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assessment Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {assessmentTitle}
        </p>
      </div>
      <FeedbackView
        assessmentId={selectedAssessment.id}
        allCompletedAssessments={allOptions}
        outcome={selectedAssessment.outcome}
        strengths={swot?.strengths || []}
        weaknesses={swot?.weaknesses || []}
        skillGaps={skillGaps}
        examinerComments={examinerComments}
      />
    </div>
  );
}
