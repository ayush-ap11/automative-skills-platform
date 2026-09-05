import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AIGovernanceView, AIAnalysisRecord } from "@/components/admin/AIGovernanceView";

export const dynamic = "force-dynamic";

export default async function AdminAiGovernancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: settings } = await supabase
    .from("system_settings")
    .select("blind_assessment_mode")
    .eq("organisation_id", orgId)
    .maybeSingle();

  const blindMode = Boolean(settings?.blind_assessment_mode);

  const { data: rawAnalyses } = await supabase
    .from("ai_analyses")
    .select(`
      id, model_version, confidence_level, critical_safety_flag, generated_at,
      candidate_answers!inner (
        id,
        questions!inner ( question_text ),
        assessments!inner (
          id,
          candidate_profiles!inner (
            id,
            profiles!inner ( id, full_name, organisation_id )
          )
        ),
        examiner_reviews ( id )
      )
    `)
    .eq("candidate_answers.assessments.candidate_profiles.profiles.organisation_id", orgId)
    .order("generated_at", { ascending: false });

  const analyses: AIAnalysisRecord[] = (rawAnalyses || []).map((row: any) => {
    const ans = Array.isArray(row.candidate_answers) ? row.candidate_answers[0] : row.candidate_answers;
    const q = Array.isArray(ans?.questions) ? ans.questions[0] : ans?.questions;
    const ass = Array.isArray(ans?.assessments) ? ans.assessments[0] : ans?.assessments;
    const cp = Array.isArray(ass?.candidate_profiles) ? ass.candidate_profiles[0] : ass?.candidate_profiles;
    const p = Array.isArray(cp?.profiles) ? cp.profiles[0] : cp?.profiles;
    const revs = ans?.examiner_reviews;

    return {
      id: row.id,
      candidate_name: p?.full_name || "Candidate",
      question_text: q?.question_text || "Assessment prompt",
      model_version: row.model_version || "gemini-2.5-flash",
      confidence_level: row.confidence_level != null ? Number(row.confidence_level) : null,
      critical_safety_flag: Boolean(row.critical_safety_flag),
      generated_at: row.generated_at,
      is_human_reviewed: Boolean(revs && revs.length > 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Governance &amp; Anti-Bias Controls</h1>
        <p className="text-sm text-muted-foreground">
          Model traceability, confidence scoring, automated safety flags, and Blind Assessment Mode enforcement.
        </p>
      </div>

      <AIGovernanceView initialBlindMode={blindMode} analyses={analyses} />
    </div>
  );
}
