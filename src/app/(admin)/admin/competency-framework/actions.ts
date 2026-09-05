"use server";

import { createClient } from "@/lib/supabase/server";

export interface CompetencyUnitInput {
  qualificationCode?: string;
  unitCode: string;
  unitTitle: string;
  skillSet?: string;
  competencyArea?: string;
  assessmentCriteria?: string;
  version: string;
  effectiveDate?: string | null;
  stateApplicability: string[];
  evidenceRequirements?: string;
}

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) return { error: "Forbidden: Admin only" };
  return { supabase, user, orgId: profile.organisation_id };
}

export async function upsertCompetencyUnit(unitId: string | null, data: CompetencyUnitInput) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  if (!data.unitCode?.trim() || !data.unitTitle?.trim()) {
    return { error: "Unit Code and Unit Title are required." };
  }

  const payload = {
    organisation_id: orgId,
    qualification_code: data.qualificationCode?.trim() || null,
    unit_code: data.unitCode.trim(),
    unit_title: data.unitTitle.trim(),
    skill_set: data.skillSet?.trim() || null,
    competency_area: data.competencyArea?.trim() || null,
    assessment_criteria: data.assessmentCriteria?.trim() || null,
    version: data.version?.trim() || "AUR Release 9.0",
    effective_date: data.effectiveDate ? data.effectiveDate : null,
    state_applicability: data.stateApplicability?.length > 0 ? data.stateApplicability : null,
    evidence_requirements: data.evidenceRequirements?.trim() || null,
  };

  if (unitId) {
    const { error } = await supabase
      .from("competency_framework")
      .update(payload)
      .eq("id", unitId)
      .eq("organisation_id", orgId);
    if (error) return { error: error.message };
    return { success: true, id: unitId };
  }

  const { data: inserted, error } = await supabase
    .from("competency_framework")
    .insert(payload)
    .select("id")
    .single();

  if (error || !inserted) return { error: error?.message || "Failed to create competency unit" };
  return { success: true, id: inserted.id };
}

export async function deleteCompetencyUnit(unitId: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { error } = await supabase
    .from("competency_framework")
    .delete()
    .eq("id", unitId)
    .eq("organisation_id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}
