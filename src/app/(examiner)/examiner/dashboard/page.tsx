import { redirect } from "next/navigation";
import { Users, Clock, AlertTriangle, FileText, CheckCircle2, ShieldCheck, Activity, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/shared/KpiCard";
import { ProgressCard } from "@/components/shared/ProgressCard";
import { NeedsAttentionList, AttentionItem } from "@/components/examiner/NeedsAttentionList";

export const dynamic = "force-dynamic";

export default async function ExaminerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_name, examiner_profiles(max_active_candidates)")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.preferred_name || profile?.full_name || "Examiner";
  const exm = Array.isArray(profile?.examiner_profiles) ? profile?.examiner_profiles[0] : profile?.examiner_profiles;
  const maxCapacity = exm?.max_active_candidates || 20;

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, candidate_profile_id, status, outcome, completed_at")
    .eq("assigned_examiner_id", user.id);

  const allAss = assessments || [];
  const candidateIds = Array.from(new Set(allAss.map((a) => a.candidate_profile_id).filter(Boolean)));
  const pendingReviewsCount = allAss.filter((a) => a.status === "submitted" || a.status === "under_review").length;
  const completedCount = allAss.filter((a) => a.status === "completed").length;
  const competentCount = allAss.filter((a) => a.outcome === "competent").length;

  const capacityPct = Math.min(100, Math.round((candidateIds.length / maxCapacity) * 100));
  const reviewCompletionPct = allAss.length > 0 ? Math.round((completedCount / allAss.length) * 100) : 100;
  const competencyRatePct = completedCount > 0 ? Math.round((competentCount / completedCount) * 100) : 100;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonthCount = allAss.filter((a) => a.status === "completed" && a.completed_at && new Date(a.completed_at) >= startOfMonth).length;

  const { data: flaggedAnalyses } = await supabase
    .from("ai_analyses")
    .select(`
      id, candidate_answer_id, flag_reason, generated_at,
      candidate_answers!inner (
        id, assessment_id,
        questions (question_text),
        assessments!inner (
          id, candidate_profile_id, assigned_examiner_id,
          candidate_profiles (profiles (full_name, preferred_name))
        ),
        examiner_reviews (id)
      )
    `)
    .eq("critical_safety_flag", true)
    .eq("candidate_answers.assessments.assigned_examiner_id", user.id);

  const pendingFlags = (flaggedAnalyses || []).filter((fa: any) => {
    const ans = fa.candidate_answers;
    const revs = ans?.examiner_reviews;
    return !revs || revs.length === 0;
  });

  const aiFlagsCount = pendingFlags.length;

  const { data: pendingDocs } =
    candidateIds.length > 0
      ? await supabase
          .from("documents")
          .select(`
            id, category, file_name, status, uploaded_at, candidate_profile_id,
            candidate_profiles (profiles (full_name, preferred_name))
          `)
          .in("candidate_profile_id", candidateIds)
          .in("status", ["uploaded", "ai_extracted", "pending_review"])
          .eq("is_sensitive", false)
          .order("uploaded_at", { ascending: true })
      : { data: [] };

  const docsCount = (pendingDocs || []).length;

  const { data: attentionAssessments } = await supabase
    .from("assessments")
    .select("id, assigned_at, candidate_profile_id, assessment_templates (title), candidate_profiles (profiles (full_name, preferred_name))")
    .eq("assigned_examiner_id", user.id)
    .in("status", ["submitted", "under_review"])
    .order("assigned_at", { ascending: true });

  const attentionItems: AttentionItem[] = [];

  // 1. Safety flags (highest priority)
  for (const flag of (pendingFlags || []) as any[]) {
    const ans = Array.isArray(flag.candidate_answers) ? flag.candidate_answers[0] : flag.candidate_answers;
    const q = Array.isArray(ans?.questions) ? ans.questions[0] : ans?.questions;
    const ass = Array.isArray(ans?.assessments) ? ans.assessments[0] : ans?.assessments;
    const cp = Array.isArray(ass?.candidate_profiles) ? ass.candidate_profiles[0] : ass?.candidate_profiles;
    const p = Array.isArray(cp?.profiles) ? cp.profiles[0] : cp?.profiles;
    attentionItems.push({
      id: flag.id,
      type: "safety_flag",
      candidate_profile_id: ass?.candidate_profile_id || "",
      candidate_name: p?.preferred_name || p?.full_name || "Candidate",
      title: q?.question_text || "Critical Safety Procedure",
      subtitle: flag.flag_reason || "Automated Safety Violation Flagged",
      submitted_at: flag.generated_at,
      href: "/examiner/ai-reviews",
    });
  }

  // 2. Assessment reviews
  for (const item of (attentionAssessments || []) as any[]) {
    const cp = Array.isArray(item.candidate_profiles) ? item.candidate_profiles[0] : item.candidate_profiles;
    const prof = Array.isArray(cp?.profiles) ? cp.profiles[0] : cp?.profiles;
    const tpl = Array.isArray(item.assessment_templates) ? item.assessment_templates[0] : item.assessment_templates;
    attentionItems.push({
      id: item.id,
      type: "assessment_review",
      candidate_profile_id: item.candidate_profile_id,
      candidate_name: prof?.preferred_name || prof?.full_name || "Candidate",
      title: tpl?.title || "Assessment Review",
      subtitle: "Vocational & Technical Assessment",
      submitted_at: item.assigned_at,
      href: `/examiner/assessments/${item.id}/review`,
    });
  }

  // 3. Document verifications
  for (const doc of (pendingDocs || []) as any[]) {
    const cp = Array.isArray(doc.candidate_profiles) ? doc.candidate_profiles[0] : doc.candidate_profiles;
    const p = Array.isArray(cp?.profiles) ? cp.profiles[0] : cp?.profiles;
    attentionItems.push({
      id: doc.id,
      type: "document_verification",
      candidate_profile_id: doc.candidate_profile_id,
      candidate_name: p?.preferred_name || p?.full_name || "Candidate",
      title: doc.file_name,
      subtitle: doc.category.replace(/_/g, " "),
      submitted_at: doc.uploaded_at,
      href: `/examiner/documents?candidateId=${doc.candidate_profile_id}`,
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome back, {fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comprehensive overview of your candidate workload, assessment reviews, and competency metrics.</p>
      </div>

      {/* Systematic Progress & Percentage Gauges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProgressCard
          title="Workload Capacity"
          percentage={capacityPct}
          badgeText={`${candidateIds.length}/${maxCapacity} Active`}
          badgeVariant={capacityPct > 80 ? "warning" : "success"}
          icon={Users}
          description="Assigned candidate quota"
          tooltip="Assigned candidate quota relative to your maximum active capacity."
          href="/examiner/candidates"
        />
        <ProgressCard
          title="Review Completion"
          percentage={reviewCompletionPct}
          badgeText={`${completedCount}/${allAss.length} Finalized`}
          badgeVariant={reviewCompletionPct === 100 ? "success" : "warning"}
          icon={Activity}
          description="Assessment review throughput"
          href="/examiner/assessments"
        />
        <ProgressCard
          title="Competency Rate"
          percentage={competencyRatePct}
          badgeText={`${competentCount} Competent`}
          badgeVariant="success"
          icon={Award}
          description="Outcome achievement ratio"
          tooltip="Percentage of evaluated candidates achieving competent outcome."
          href="/examiner/reports"
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Assigned Candidates" value={candidateIds.length} icon={Users} href="/examiner/candidates" />
        <KpiCard label="Pending Reviews" value={pendingReviewsCount} icon={Clock} accentColor={pendingReviewsCount > 0 ? "var(--warning)" : "var(--foreground)"} href="/examiner/assessments" />
        <KpiCard
          label="AI Safety Flags"
          value={aiFlagsCount}
          icon={AlertTriangle}
          accentColor={aiFlagsCount > 0 ? "var(--destructive)" : "var(--foreground)"}
          tooltip="Automated flags detecting high-voltage or critical safety procedure failures."
          href="/examiner/ai-reviews"
        />
        <KpiCard label="Docs for Review" value={docsCount} icon={FileText} accentColor={docsCount > 0 ? "var(--warning)" : "var(--foreground)"} href="/examiner/documents" />
        <KpiCard label="Completed This Month" value={completedThisMonthCount} icon={CheckCircle2} href="/examiner/reports" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Needs Your Attention</h2>
        <NeedsAttentionList items={attentionItems} />
      </div>
    </div>
  );
}
