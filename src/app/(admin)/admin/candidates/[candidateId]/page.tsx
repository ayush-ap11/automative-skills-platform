import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminCandidateDetail, AdminCandidateDetailData } from "@/components/admin/AdminCandidateDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function AdminCandidateDetailPage({ params }: PageProps) {
  const { candidateId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile?.organisation_id) redirect("/admin/candidates");

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select(`
      id, current_role, years_experience, ev_experience, hybrid_experience,
      heavy_vehicle_experience, light_vehicle_experience, automotive_electrical_experience,
      profiles!inner (id, full_name, preferred_name, email, state, organisation_id)
    `)
    .eq("id", candidateId)
    .maybeSingle();

  const candOrgId = (candidateProfile?.profiles as any)?.organisation_id;
  if (!candidateProfile || candOrgId !== adminProfile.organisation_id) {
    redirect("/admin/candidates");
  }

  const [
    { data: rawEmpHistory },
    { data: rawQualifications },
    { data: rawDocuments },
    { data: rawAssessments },
    { data: rawExaminers },
  ] = await Promise.all([
    supabase.from("employment_history").select("*").eq("candidate_profile_id", candidateId).order("start_date", { ascending: false }),
    supabase.from("qualifications").select("*").eq("candidate_profile_id", candidateId).order("issue_date", { ascending: false }),
    supabase.from("documents").select("id, category, file_name, status, expiry_date, is_sensitive, uploaded_at").eq("candidate_profile_id", candidateId).order("uploaded_at", { ascending: false }),
    supabase.from("assessments").select(`
      id, status, overall_score, ev_readiness_score, assigned_at, assigned_examiner_id,
      assessment_templates (title),
      examiner:profiles!assessments_assigned_examiner_id_fkey (id, full_name, preferred_name)
    `).eq("candidate_profile_id", candidateId).order("assigned_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, preferred_name").eq("role", "examiner").eq("organisation_id", adminProfile.organisation_id).order("full_name", { ascending: true }),
  ]);

  const p = candidateProfile.profiles as any;
  const examiners = (rawExaminers || []).map((e) => ({
    id: e.id,
    name: e.preferred_name || e.full_name || "Examiner",
  }));

  const candidateData: AdminCandidateDetailData = {
    id: candidateProfile.id,
    fullName: p?.preferred_name || p?.full_name || "Unknown Candidate",
    email: p?.email || "",
    state: p?.state || null,
    currentRole: candidateProfile.current_role,
    yearsExperience: candidateProfile.years_experience,
    evExperience: Boolean(candidateProfile.ev_experience),
    hybridExperience: Boolean(candidateProfile.hybrid_experience),
    heavyVehicleExperience: Boolean(candidateProfile.heavy_vehicle_experience),
    lightVehicleExperience: Boolean(candidateProfile.light_vehicle_experience),
    autoElectricalExperience: Boolean(candidateProfile.automotive_electrical_experience),
    qualifications: rawQualifications || [],
    employmentHistory: rawEmpHistory || [],
    documents: rawDocuments || [],
    assessments: (rawAssessments || []).map((a: any) => ({
      id: a.id,
      title: a.assessment_templates?.title || "Vocational Assessment",
      status: a.status,
      overallScore: a.overall_score !== null ? Number(a.overall_score) : null,
      evReadinessScore: a.ev_readiness_score !== null ? Number(a.ev_readiness_score) : null,
      assignedExaminerId: a.assigned_examiner_id,
      examinerName: a.examiner?.preferred_name || a.examiner?.full_name || null,
    })),
  };

  return (
    <div className="space-y-6">
      <AdminCandidateDetail candidate={candidateData} examiners={examiners} />
    </div>
  );
}
