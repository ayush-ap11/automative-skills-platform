import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AssessmentInstructions, SectionItem } from "@/components/candidate/AssessmentInstructions";

export const dynamic = "force-dynamic";

interface InstructionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentInstructionsPage({ params }: InstructionsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!candidateProfile) redirect("/assessments");

  const adminClient = createAdminClient();

  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, template_id, status, candidate_profile_id, assessment_templates(title, framework_version)")
    .eq("id", id)
    .single();

  if (!assessment || assessment.candidate_profile_id !== candidateProfile.id) {
    redirect("/assessments");
  }

  const { data: rawSections } = await adminClient
    .from("assessment_sections")
    .select("id, title, order_index")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const sections: SectionItem[] = (rawSections || []).map((s) => ({
    id: s.id,
    title: s.title,
    order_index: s.order_index,
  }));

  const sectionIds = sections.map((s) => s.id);
  let hasVerbalQuestions = false;
  if (sectionIds.length > 0) {
    const { data: verbal } = await adminClient
      .from("questions")
      .select("id")
      .in("section_id", sectionIds)
      .eq("question_type", "verbal")
      .limit(1);
    hasVerbalQuestions = (verbal || []).length > 0;
  }

  const templateTitle = (assessment.assessment_templates as any)?.title || "Automotive Competency Assessment";
  const frameworkVersion = (assessment.assessment_templates as any)?.framework_version || "AUR Framework";

  return (
    <AssessmentInstructions
      assessmentId={assessment.id}
      templateTitle={templateTitle}
      frameworkVersion={frameworkVersion}
      status={assessment.status}
      sections={sections}
      hasVerbalQuestions={hasVerbalQuestions}
    />
  );
}
