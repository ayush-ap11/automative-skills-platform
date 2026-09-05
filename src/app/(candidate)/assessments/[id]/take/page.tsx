import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

  const adminClient = createAdminClient();

  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, status, template_id, candidate_profile_id")
    .eq("id", id)
    .single();

  if (!assessment || assessment.candidate_profile_id !== cp.id) {
    redirect("/assessments");
  }

  // Ensure assessment status is marked in_progress
  if (assessment.status === "not_started") {
    await adminClient
      .from("assessments")
      .update({ status: "in_progress" })
      .eq("id", id);
  }

  const { data: sections } = await adminClient
    .from("assessment_sections")
    .select("id, order_index")
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const { data: answers } = await adminClient
    .from("candidate_answers")
    .select("question_id, selected_option_ids, answer_text, verbal_answers(id)")
    .eq("assessment_id", id);

  const answeredIds = new Set(
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

  for (const sec of sections || []) {
    const { data: questions } = await adminClient
      .from("questions")
      .select("id")
      .eq("section_id", sec.id)
      .eq("mandatory", true);

    const hasUnanswered = (questions || []).some((q) => !answeredIds.has(q.id));
    if (hasUnanswered) {
      redirect(`/assessments/${id}/section/${sec.id}`);
    }
  }

  redirect(`/assessments/${id}/review`);
}

