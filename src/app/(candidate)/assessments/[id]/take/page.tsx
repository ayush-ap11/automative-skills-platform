import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NON_VERBAL_TYPES = [
  "multiple_choice",
  "multiple_answer",
  "true_false",
  "scenario",
  "short_answer",
  "image_based",
];

interface TakePageProps {
  params: Promise<{ id: string }>;
}

export default async function TakeAssessmentPage({ params }: TakePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!cp) redirect("/assessments");

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, template_id, candidate_profile_id")
    .eq("id", id)
    .single();

  if (!assessment || assessment.candidate_profile_id !== cp.id) {
    redirect("/assessments");
  }

  const { data: sections } = await supabase
    .from("assessment_sections")
    .select("id, order_index")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const { data: answers } = await supabase
    .from("candidate_answers")
    .select("question_id, selected_option_ids, answer_text")
    .eq("assessment_id", id);

  const answeredIds = new Set(
    (answers || [])
      .filter(
        (a) =>
          (a.selected_option_ids && a.selected_option_ids.length > 0) ||
          (a.answer_text && a.answer_text.trim().length > 0)
      )
      .map((a) => a.question_id)
  );

  for (const sec of sections || []) {
    const { data: questions } = await supabase
      .from("questions")
      .select("id")
      .eq("section_id", sec.id)
      .eq("mandatory", true)
      .in("question_type", NON_VERBAL_TYPES);

    const hasUnanswered = (questions || []).some((q) => !answeredIds.has(q.id));
    if (hasUnanswered) {
      redirect(`/assessments/${id}/section/${sec.id}`);
    }
  }

  redirect(`/assessments/${id}/review`);
}
