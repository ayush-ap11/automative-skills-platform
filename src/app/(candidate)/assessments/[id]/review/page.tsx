import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_CATEGORIES } from "@/app/(candidate)/documents/types";
import { ReviewSummary, SectionReviewItem } from "@/components/candidate/ReviewSummary";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
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

  if (!cp) redirect("/assessments");

  const adminClient = createAdminClient();

  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, status, template_id, candidate_profile_id, assessment_templates(title, framework_version)")
    .eq("id", id)
    .maybeSingle();

  if (!assessment || assessment.candidate_profile_id !== cp.id) {
    redirect("/assessments");
  }

  // If already submitted or reviewed, redirect to status screen
  if (["submitted", "under_review", "completed"].includes(assessment.status)) {
    redirect(`/assessments/${id}/status`);
  }

  // Fetch sections, questions, and candidate answers to evaluate completion
  const { data: sections } = await adminClient
    .from("assessment_sections")
    .select("id, title, order_index")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const sectionIds = (sections || []).map((s) => s.id);

  const { data: mandatoryQuestions } = await adminClient
    .from("questions")
    .select("id, section_id, mandatory")
    .in("section_id", sectionIds)
    .eq("mandatory", true);

  const { data: answers } = await adminClient
    .from("candidate_answers")
    .select("question_id, selected_option_ids, answer_text, verbal_answers(id)")
    .eq("assessment_id", id);

  const answeredSet = new Set(
    (answers || [])
      .filter(
        (a: any) =>
          (a.selected_option_ids && a.selected_option_ids.length > 0) ||
          (a.answer_text && a.answer_text.trim().length > 0) ||
          (a.verbal_answers &&
            (Array.isArray(a.verbal_answers)
              ? a.verbal_answers.length > 0
              : !!a.verbal_answers?.id))
      )
      .map((a: any) => a.question_id)
  );

  const sectionItems: SectionReviewItem[] = (sections || []).map((sec) => {
    const secMandatory = (mandatoryQuestions || []).filter((q) => q.section_id === sec.id);
    const remaining = secMandatory.filter((q) => !answeredSet.has(q.id)).length;
    return {
      id: sec.id,
      title: sec.title,
      order_index: sec.order_index,
      isComplete: remaining === 0,
      remainingCount: remaining,
    };
  });

  // Calculate document completion count (uploaded or verified categories)
  const { data: documents } = await supabase
    .from("documents")
    .select("category, status")
    .eq("candidate_profile_id", cp.id);

  const validStatuses = ["verified", "pending_review", "ai_extracted", "uploaded"];
  const uploadedCategories = new Set(
    (documents || []).filter((d) => validStatuses.includes(d.status)).map((d) => d.category)
  );

  const documentStats = {
    uploadedCount: uploadedCategories.size,
    totalCategories: DOCUMENT_CATEGORIES.length,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <a
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assessments
        </a>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Review & Submit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your answers and verify your evidence prior to final examiner handoff.
        </p>
      </div>

      <ReviewSummary
        assessmentId={id}
        sections={sectionItems}
        documentStats={documentStats}
      />
    </div>
  );
}
