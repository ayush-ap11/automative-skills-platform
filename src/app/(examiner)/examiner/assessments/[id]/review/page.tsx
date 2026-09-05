import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AssessmentReviewScreen,
  CandidateInfo,
  SectionGroup,
} from "@/components/examiner/AssessmentReviewScreen";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessment } = await supabase
    .from("assessments")
    .select(`
      id, template_id, status, overall_score, ev_readiness_score, assigned_examiner_id,
      assessment_templates (title),
      candidate_profiles (id, years_experience, current_role, profiles (full_name, preferred_name, organisation_id))
    `)
    .eq("id", id)
    .maybeSingle();

  if (!assessment || assessment.assigned_examiner_id !== user.id) {
    redirect("/examiner/assessments");
  }

  const cp = assessment.candidate_profiles as any;
  const p = cp?.profiles;
  const { data: settings } = await supabase
    .from("system_settings")
    .select("blind_assessment_mode")
    .eq("organisation_id", p?.organisation_id)
    .maybeSingle();

  const blindMode = Boolean(settings?.blind_assessment_mode) && assessment.status !== "completed";

  const { data: rawSections } = await supabase
    .from("assessment_sections")
    .select(`
      id,
      title,
      order_index,
      questions (
        id,
        question_text,
        question_type,
        safety_critical,
        mandatory,
        marks,
        created_at,
        question_options (
          id,
          option_text,
          is_correct,
          order_index
        )
      )
    `)
    .eq("template_id", assessment.template_id)
    .order("order_index", { ascending: true });

  const { data: answers } = await supabase
    .from("candidate_answers")
    .select(`
      id, question_id, selected_option_ids, answer_text,
      verbal_answers (id, transcripts (transcript_text)),
      ai_analyses (id, provisional_score, technical_score, safety_score, diagnostic_reasoning_score, communication_score, completeness_score, critical_safety_flag, flag_reason),
      examiner_reviews (id, decision, final_score, comment)
    `)
    .eq("assessment_id", id);

  const answerMap = new Map((answers || []).map((a) => [a.question_id, a]));

  let qNumber = 1;
  const sections: SectionGroup[] = (rawSections || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => {
      const sortedQs = (s.questions || []).sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
      return {
        id: s.id,
        title: s.title,
        order_index: s.order_index,
        questions: sortedQs.map((q) => {
          const ans = answerMap.get(q.id);
          const ai = (ans?.ai_analyses as any)?.[0] || null;
          const rev = (ans?.examiner_reviews as any)?.[0] || null;
          const verbal = (ans?.verbal_answers as any)?.[0] || null;
          const transcript = (verbal?.transcripts as any)?.[0]?.transcript_text || null;
          return {
            question: {
              id: q.id, questionNumber: qNumber++, question_text: q.question_text,
              question_type: q.question_type, safety_critical: q.safety_critical,
              mandatory: q.mandatory, marks: Number(q.marks),
              options: (q.question_options || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
            },
            answer: ans ? {
              id: ans.id, selected_option_ids: ans.selected_option_ids, answer_text: ans.answer_text,
              verbal_answer: verbal ? { id: verbal.id, transcript_text: transcript } : null,
            } : null,
            aiAnalysis: ai, existingReview: rev,
          };
        }),
      };
    });

  const candidateInfo: CandidateInfo = {
    id: cp?.id || "",
    fullName: blindMode ? `Candidate #${(cp?.id || "").slice(0, 8)}` : (p?.preferred_name || p?.full_name || "Unknown Candidate"),
    currentRole: cp?.current_role || null,
    yearsExperience: cp?.years_experience || null,
  };

  return (
    <AssessmentReviewScreen
      assessmentId={assessment.id}
      assessmentTitle={(assessment.assessment_templates as any)?.title || "Assessment Review"}
      status={assessment.status}
      overallScore={assessment.overall_score}
      evReadinessScore={assessment.ev_readiness_score}
      candidate={candidateInfo}
      sections={sections}
      blindMode={blindMode}
    />
  );
}
