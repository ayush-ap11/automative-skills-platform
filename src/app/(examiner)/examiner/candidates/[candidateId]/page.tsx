import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  CandidateOverview,
  CandidateData,
  QualificationItem,
} from "@/components/examiner/CandidateOverview";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { candidateId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      id,
      status,
      overall_score,
      ev_readiness_score,
      assigned_at,
      assessment_templates (title)
    `)
    .eq("candidate_profile_id", candidateId)
    .order("assigned_at", { ascending: false });

  if (!assessments || assessments.length === 0) {
    redirect("/examiner/candidates");
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select(`
      id, years_experience, current_role, ev_experience, hybrid_experience,
      heavy_vehicle_experience, light_vehicle_experience, automotive_electrical_experience,
      profiles (full_name, preferred_name, state, organisation_id)
    `)
    .eq("id", candidateId)
    .maybeSingle();

  if (!candidateProfile) {
    redirect("/examiner/candidates");
  }

  const p = candidateProfile.profiles as any;
  const { data: settings } = await supabase
    .from("system_settings")
    .select("blind_assessment_mode")
    .eq("organisation_id", p?.organisation_id)
    .maybeSingle();

  const blindMode = Boolean(settings?.blind_assessment_mode) && assessments.some((a) => a.status !== "completed");
  const fullName = blindMode ? `Candidate #${candidateProfile.id.slice(0, 8)}` : (p?.preferred_name || p?.full_name || "Unknown Candidate");

  const { data: rawQuals } = await supabase
    .from("qualifications")
    .select("id, qualification_name, issuing_body, issue_date, verified")
    .eq("candidate_profile_id", candidateId)
    .order("issue_date", { ascending: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, category, status")
    .eq("candidate_profile_id", candidateId);

  const categoriesSet = new Set((documents || []).map((d) => d.category));
  const verifiedCategories = new Set(
    (documents || []).filter((d) => d.status === "verified").map((d) => d.category)
  );

  const candidateData: CandidateData = {
    id: candidateProfile.id,
    fullName,
    currentRole: candidateProfile.current_role,
    yearsExperience: candidateProfile.years_experience,
    state: p?.state || null,
    evExperience: candidateProfile.ev_experience,
    hybridExperience: candidateProfile.hybrid_experience,
    heavyVehicleExperience: candidateProfile.heavy_vehicle_experience,
    lightVehicleExperience: candidateProfile.light_vehicle_experience,
    autoElectricalExperience: candidateProfile.automotive_electrical_experience,
  };

  const qualifications: QualificationItem[] = (rawQuals || []).map((q) => ({
    id: q.id,
    qualification_name: q.qualification_name,
    issuing_body: q.issuing_body,
    issue_date: q.issue_date,
    verified: q.verified,
  }));

  const assessmentItems = assessments.map((a: any) => ({
    id: a.id,
    title: a.assessment_templates?.title || "Vocational Assessment",
    status: a.status,
    overall_score: a.overall_score,
    ev_readiness_score: a.ev_readiness_score,
    submitted_at: a.assigned_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/examiner/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer mb-2"
        >
          <ArrowLeft className="size-3.5" /> Back to My Candidates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidate Overview
        </h1>
      </div>

      <CandidateOverview
        candidate={candidateData}
        qualifications={qualifications}
        evidenceCompleteness={{
          verifiedCount: verifiedCategories.size,
          totalCount: categoriesSet.size,
        }}
        assessments={assessmentItems}
        blindMode={blindMode}
      />
    </div>
  );
}
