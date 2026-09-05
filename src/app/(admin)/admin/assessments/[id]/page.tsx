import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, User, Award, ChevronRight } from "lucide-react";
import { AdminAssessmentDetailCard } from "@/components/admin/AdminAssessmentDetailCard";
import { buildAdminQuestionItem } from "@/components/admin/admin-assessment-mapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: adminProfile } = await supabase
    .from("profiles").select("organisation_id, role").eq("id", user.id).maybeSingle();
  if (adminProfile?.role !== "admin" || !adminProfile.organisation_id) redirect("/admin/assessments");

  const { data: assessment } = await supabase
    .from("assessments")
    .select(`
      id, status, assigned_at, completed_at, template_id, assigned_examiner_id, candidate_profile_id,
      candidate_profiles!inner (id, profiles!inner (id, full_name, email, organisation_id)),
      assessment_templates!inner (id, title, framework_version),
      assigned_examiner:profiles!assigned_examiner_id (id, full_name, email)
    `)
    .eq("id", id).maybeSingle();

  if (!assessment) redirect("/admin/assessments");

  const candidateProf = (assessment.candidate_profiles as any)?.profiles;
  if (candidateProf?.organisation_id !== adminProfile.organisation_id) redirect("/admin/assessments");
  const examinerProf = assessment.assigned_examiner as any;

  const adminSupabase = createAdminClient();

  const { data: rawSections } = await adminSupabase
    .from("assessment_sections")
    .select(`
      id, title, order_index,
      questions (id, question_text, question_type, safety_critical, mandatory, marks, created_at,
        question_options (id, option_text, is_correct, order_index))
    `)
    .eq("template_id", assessment.template_id).order("order_index", { ascending: true });

  const { data: answers } = await adminSupabase
    .from("candidate_answers")
    .select(`
      id, question_id, selected_option_ids, answer_text,
      verbal_answers (id, audio_storage_path, transcripts (transcript_text)),
      ai_analyses (id, provisional_score, technical_score, safety_score, diagnostic_reasoning_score, communication_score, completeness_score, critical_safety_flag, flag_reason),
      examiner_reviews (id, decision, final_score, comment)
    `)
    .eq("assessment_id", id);

  const answerMap = new Map((answers || []).map((a) => [a.question_id, a]));
  let globalQuestionIndex = 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Link href="/admin/dashboard" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/assessments" className="hover:text-foreground">Assessments</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[250px]">{(assessment.assessment_templates as any).title}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{(assessment.assessment_templates as any).title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Assessment Review & Audit Trail</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-primary/10 text-primary border-primary/20 self-start sm:self-auto">
            {assessment.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={`/admin/candidates/${assessment.candidate_profile_id}`} className="group rounded-xl border border-border bg-card p-4 space-y-1 hover:border-primary/50 transition-colors">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5"><User className="size-3.5 text-primary" /> Candidate</span>
            <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 flex items-center gap-0.5">Profile <ChevronRight className="size-3" /></span>
          </div>
          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{candidateProf?.full_name || "Unknown Candidate"}</p>
          <p className="text-xs text-muted-foreground">{candidateProf?.email}</p>
        </Link>
        <Link href="/admin/examiners" className="group rounded-xl border border-border bg-card p-4 space-y-1 hover:border-primary/50 transition-colors">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Award className="size-3.5 text-primary" /> Assigned Examiner</span>
            <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 flex items-center gap-0.5">Examiners <ChevronRight className="size-3" /></span>
          </div>
          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{examinerProf?.full_name || "Unassigned"}</p>
          <p className="text-xs text-muted-foreground">{examinerProf?.email || "Click to assign examiner"}</p>
        </Link>
      </div>

      <div className="space-y-8">
        {(rawSections || []).map((sec) => {
          const sortedQuestions = [...(sec.questions || [])].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
          return (
            <div key={sec.id} className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">{sec.title}</h2>
              <div className="space-y-4">
                {sortedQuestions.map((q) => {
                  globalQuestionIndex += 1;
                  const ans = answerMap.get(q.id);
                  const cardItem = buildAdminQuestionItem(q, globalQuestionIndex, ans);
                  return <AdminAssessmentDetailCard key={q.id} question={cardItem} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
