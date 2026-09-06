import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/admin/AnalyticsView";
import type {
  AssessmentPerformanceData,
  ExaminerPerformanceData,
  QualificationPerformanceData,
  RolePerformanceData,
} from "@/components/admin/analytics-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id)
    redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: rawAssessments } = await supabase
    .from("assessments")
    .select(`
      id, overall_score, assigned_at, completed_at, assigned_examiner_id,
      template:assessment_templates!inner(id, title, organisation_id),
      candidate:candidate_profiles!inner(
        id, current_role,
        profiles!inner(id, organisation_id),
        qualifications(qualification_name)
      ),
      examiner:profiles!assigned_examiner_id(id, full_name)
    `)
    .eq("template.organisation_id", orgId)
    .eq("status", "completed");

  const completedAssessments: any[] = rawAssessments || [];

  const candidateIds = completedAssessments
    .map((a) => {
      const cand = Array.isArray(a.candidate) ? a.candidate[0] : a.candidate;
      return cand?.id;
    })
    .filter(Boolean);

  const empHistoryMap = new Map<string, string>();
  if (candidateIds.length > 0) {
    const { data: empHistory } = await supabase
      .from("employment_history")
      .select("candidate_profile_id, role_title")
      .in("candidate_profile_id", candidateIds)
      .order("start_date", { ascending: false });

    for (const h of empHistory || []) {
      if (!empHistoryMap.has(h.candidate_profile_id) && h.role_title?.trim()) {
        empHistoryMap.set(h.candidate_profile_id, h.role_title.trim());
      }
    }
  }

  const roleMap: Record<string, { total: number; count: number }> = {};
  const qualMap: Record<string, { total: number; count: number }> = {};
  const tmplMap: Record<string, { total: number; count: number }> = {};
  const exmMap: Record<
    string,
    { name: string; totalScore: number; count: number; totalDays: number }
  > = {};

  for (const a of completedAssessments) {
    const score = Number(a.overall_score) || 0;
    const cand = Array.isArray(a.candidate) ? a.candidate[0] : a.candidate;
    const tmpl = Array.isArray(a.template) ? a.template[0] : a.template;
    const exm = Array.isArray(a.examiner) ? a.examiner[0] : a.examiner;

    // 1. By Role (from candidate_profiles.current_role or employment_history)
    const role =
      cand?.current_role?.trim() ||
      empHistoryMap.get(cand?.id) ||
      "Unspecified Role";
    if (!roleMap[role]) roleMap[role] = { total: 0, count: 0 };
    roleMap[role].total += score;
    roleMap[role].count += 1;

    // 2. By Qualification (Note: Simplified view since a candidate can hold multiple qualifications)
    const quals = cand?.qualifications;
    if (quals && quals.length > 0) {
      for (const q of quals) {
        const qName = q.qualification_name || "Unspecified Qualification";
        if (!qualMap[qName]) qualMap[qName] = { total: 0, count: 0 };
        qualMap[qName].total += score;
        qualMap[qName].count += 1;
      }
    } else {
      const qName = "No Prior Qualification";
      if (!qualMap[qName]) qualMap[qName] = { total: 0, count: 0 };
      qualMap[qName].total += score;
      qualMap[qName].count += 1;
    }

    // 3. By Assessment
    const tmplTitle = tmpl?.title || "Standard Assessment";
    if (!tmplMap[tmplTitle]) tmplMap[tmplTitle] = { total: 0, count: 0 };
    tmplMap[tmplTitle].total += score;
    tmplMap[tmplTitle].count += 1;

    // 4. By Examiner
    const exmId = a.assigned_examiner_id;
    if (exmId) {
      const exmName = exm?.full_name || "Examiner";
      let days = 1.0;
      if (a.completed_at) {
        const start = new Date(a.submitted_at || a.assigned_at).getTime();
        const end = new Date(a.completed_at).getTime();
        days = Math.max(0.1, (end - start) / (1000 * 3600 * 24));
      }
      if (!exmMap[exmId])
        exmMap[exmId] = {
          name: exmName,
          totalScore: 0,
          count: 0,
          totalDays: 0,
        };
      exmMap[exmId].totalScore += score;
      exmMap[exmId].totalDays += days;
      exmMap[exmId].count += 1;
    }
  }

  const roleData: RolePerformanceData[] = Object.entries(roleMap).map(
    ([role, d]) => ({
      role,
      averageScore: Math.round(d.total / d.count),
      completedCount: d.count,
    }),
  );

  const qualificationData: QualificationPerformanceData[] = Object.entries(
    qualMap,
  ).map(([qualification, d]) => ({
    qualification,
    averageScore: Math.round(d.total / d.count),
    completedCount: d.count,
  }));

  const assessmentData: AssessmentPerformanceData[] = Object.entries(
    tmplMap,
  ).map(([templateTitle, d]) => ({
    templateTitle,
    averageScore: Math.round(d.total / d.count),
    completedCount: d.count,
  }));

  const examinerData: ExaminerPerformanceData[] = Object.entries(exmMap).map(
    ([examinerId, d]) => ({
      examinerId,
      examinerName: d.name,
      assessmentsReviewed: d.count,
      averageScore: Math.round(d.totalScore / d.count),
      averageTurnaroundDays: Number((d.totalDays / d.count).toFixed(1)),
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics Drill-Down
        </h1>
        <p className="text-sm text-muted-foreground">
          Detailed performance breakdowns by vocation role, prior
          qualifications, curriculum modules, and examiner velocity.
        </p>
      </div>

      <AnalyticsView
        roleData={roleData}
        qualificationData={qualificationData}
        assessmentData={assessmentData}
        examinerData={examinerData}
      />
    </div>
  );
}
