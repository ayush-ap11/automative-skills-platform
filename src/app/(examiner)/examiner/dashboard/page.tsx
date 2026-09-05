import { redirect } from "next/navigation";
import { Users, Clock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/shared/KpiCard";
import {
  NeedsAttentionList,
  AttentionItem,
} from "@/components/examiner/NeedsAttentionList";

export const dynamic = "force-dynamic";

export default async function ExaminerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.preferred_name || profile?.full_name || "Examiner";

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, candidate_profile_id, status, completed_at");

  const candidateIds = Array.from(
    new Set((assessments || []).map((a) => a.candidate_profile_id).filter(Boolean))
  );

  const pendingReviewsCount = (assessments || []).filter(
    (a) => a.status === "submitted"
  ).length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonthCount = (assessments || []).filter((a) => {
    if (a.status !== "completed" || !a.completed_at) return false;
    return new Date(a.completed_at) >= startOfMonth;
  }).length;

  const { data: flaggedAnalyses } = await supabase
    .from("ai_analyses")
    .select("candidate_answer_id")
    .eq("critical_safety_flag", true);

  const { data: reviewedAnswers } = await supabase
    .from("examiner_reviews")
    .select("candidate_answer_id");

  const reviewedIds = new Set((reviewedAnswers || []).map((r) => r.candidate_answer_id));
  const aiFlagsCount = (flaggedAnalyses || []).filter(
    (fa) => !reviewedIds.has(fa.candidate_answer_id)
  ).length;

  let docsCount = 0;
  if (candidateIds.length > 0) {
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .in("status", ["uploaded", "ai_extracted"])
      .in("candidate_profile_id", candidateIds);
    docsCount = count || 0;
  }

  const { data: attentionAssessments } = await supabase
    .from("assessments")
    .select(`
      id,
      submitted_at,
      candidate_profile_id,
      assessment_templates (title),
      candidate_profiles (profiles (full_name, preferred_name))
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  const attentionItems: AttentionItem[] = (attentionAssessments || []).map((item: any) => {
    const prof = item.candidate_profiles?.profiles;
    return {
      id: item.id,
      candidate_profile_id: item.candidate_profile_id,
      candidate_name: prof?.preferred_name || prof?.full_name || "Candidate",
      title: item.assessment_templates?.title || "Assessment",
      submitted_at: item.submitted_at,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back, {fullName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is an overview of your candidate assessments and reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Assigned Candidates" value={candidateIds.length} icon={Users} />
        <KpiCard label="Pending Reviews" value={pendingReviewsCount} icon={Clock} />
        <KpiCard
          label="AI Flags"
          value={aiFlagsCount}
          icon={AlertTriangle}
          accentColor={aiFlagsCount > 0 ? "var(--warning)" : "var(--foreground)"}
        />
        <KpiCard
          label="Docs Awaiting Verification"
          value={docsCount}
          icon={FileText}
          accentColor={docsCount > 0 ? "var(--warning)" : "var(--foreground)"}
        />
        <KpiCard
          label="Completed This Month"
          value={completedThisMonthCount}
          icon={CheckCircle2}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Needs Your Attention
        </h2>
        <NeedsAttentionList items={attentionItems} />
      </div>
    </div>
  );
}
