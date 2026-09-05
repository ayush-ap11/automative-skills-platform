import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExaminerManagementTable } from "@/components/admin/ExaminerManagementTable";
import { ExaminerRecord } from "@/components/admin/EditExaminerDialog";

export const dynamic = "force-dynamic";

export default async function AdminExaminersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  let { data: profilesData, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active, examiner_profiles(specialisation_areas, max_active_candidates)")
    .eq("organisation_id", orgId)
    .eq("role", "examiner")
    .order("full_name", { ascending: true });

  if (fetchErr && fetchErr.message?.includes("is_active")) {
    const res = await supabase
      .from("profiles")
      .select("id, full_name, email, examiner_profiles(specialisation_areas, max_active_candidates)")
      .eq("organisation_id", orgId)
      .eq("role", "examiner")
      .order("full_name", { ascending: true });
    profilesData = (res.data || []) as any;
  }

  const examinerIds = (profilesData || []).map((p) => p.id);

  let assessmentsData: Array<{ assigned_examiner_id: string; candidate_profile_id: string; status: string }> = [];
  if (examinerIds.length > 0) {
    const { data: ass } = await supabase
      .from("assessments")
      .select("assigned_examiner_id, candidate_profile_id, status")
      .in("assigned_examiner_id", examinerIds);
    assessmentsData = ass || [];
  }

  const examiners: ExaminerRecord[] = (profilesData || []).map((p: any) => {
    const exmProfile = Array.isArray(p.examiner_profiles) ? p.examiner_profiles[0] : p.examiner_profiles;
    const assignedAss = assessmentsData.filter((a) => a.assigned_examiner_id === p.id);
    const distinctCandidates = new Set(assignedAss.map((a) => a.candidate_profile_id));
    const pendingReviews = assignedAss.filter((a) => a.status === "submitted").length;

    return {
      id: p.id,
      full_name: p.full_name || "Unnamed Examiner",
      email: p.email || "",
      is_active: p.is_active !== false,
      specialisation_areas: exmProfile?.specialisation_areas || [],
      max_active_candidates: exmProfile?.max_active_candidates || 20,
      assigned_candidates_count: distinctCandidates.size,
      pending_reviews_count: pendingReviews,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Examiner Management</h1>
      </div>
      <ExaminerManagementTable examiners={examiners} />
    </div>
  );
}
