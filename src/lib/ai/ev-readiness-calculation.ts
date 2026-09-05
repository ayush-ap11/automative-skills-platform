import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const KNOWLEDGE_TYPES = new Set(["multiple_choice", "multiple_answer", "true_false", "scenario", "short_answer"]);
const TRAINING_DOC_CATEGORIES = new Set(["ev_training_certificate", "safety_training", "manufacturer_training", "training_certificate"]);
const RATING_MAP: Record<string, number> = { not_demonstrated: 0, developing: 40, competent: 75, highly_competent: 100 };

function avgScore(items: any[]): number | null {
  const scores: number[] = [];
  for (const item of items) {
    const rev = Array.isArray(item.examiner_reviews) ? item.examiner_reviews[0] : item.examiner_reviews;
    if (rev?.final_score != null) scores.push(Number(rev.final_score));
  }
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export async function calculateEVReadiness(assessmentId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: assessment } = await admin.from("assessments").select("id, candidate_profile_id").eq("id", assessmentId).single();
  if (!assessment) return;

  const candidateProfileId = assessment.candidate_profile_id;
  const { data: rawAnswers } = await admin
    .from("candidate_answers")
    .select("id, question_id, questions (id, question_type, skill_category, ev_related, safety_critical), examiner_reviews (id, final_score)")
    .eq("assessment_id", assessmentId);

  const { data: rawDocs } = await admin
    .from("documents")
    .select("id, category, status")
    .eq("candidate_profile_id", candidateProfileId);

  const answers = rawAnswers || [];
  const documents = rawDocs || [];
  const evQuestions = answers.filter((a: any) => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return Boolean(q?.ev_related);
  });

  const hasEvDocs = documents.some((d) => d.category === "ev_training_certificate");
  if (evQuestions.length === 0 && !hasEvDocs) return;

  // 1. ev_knowledge
  const knowledgeAnswers = evQuestions.filter((a: any) => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return KNOWLEDGE_TYPES.has(q?.question_type);
  });
  const ev_knowledge = avgScore(knowledgeAnswers);

  // 2. hv_safety_awareness
  const safetyAnswers = evQuestions.filter((a: any) => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return Boolean(q?.safety_critical);
  });
  const hv_safety_awareness = avgScore(safetyAnswers);

  // 3. diagnostics
  const diagAnswers = evQuestions.filter((a: any) => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return q?.skill_category && String(q.skill_category).toLowerCase().includes("diagnostic");
  });
  const diagnostics = avgScore(diagAnswers);

  // 4. practical_evidence
  const { data: practicalObs } = await admin.from("practical_observations").select("id, overall_rating").eq("assessment_id", assessmentId);
  let practical_evidence: number | null = null;
  if (practicalObs && practicalObs.length > 0) {
    const mapped = practicalObs.map((p) => (p.overall_rating ? RATING_MAP[p.overall_rating] : null)).filter((s): s is number => s !== null);
    if (mapped.length > 0) practical_evidence = Math.round(mapped.reduce((a, b) => a + b, 0) / mapped.length);
  }
  if (practical_evidence === null) {
    const evCertDocs = documents.filter((d) => d.category === "ev_training_certificate");
    if (evCertDocs.length > 0) {
      practical_evidence = Math.round((evCertDocs.filter((d) => d.status === "verified").length / evCertDocs.length) * 100);
    }
  }

  // 5. training_evidence
  const trainingDocs = documents.filter((d) => TRAINING_DOC_CATEGORIES.has(d.category));
  const training_evidence = trainingDocs.length > 0
    ? Math.round((trainingDocs.filter((d) => d.status === "verified").length / trainingDocs.length) * 100)
    : null;

  // 6. verbal_reasoning
  const verbalAnswers = evQuestions.filter((a: any) => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return q?.question_type === "verbal";
  });
  const verbal_reasoning = avgScore(verbalAnswers);

  const categories = [ev_knowledge, hv_safety_awareness, diagnostics, practical_evidence, training_evidence, verbal_reasoning].filter((v): v is number => v !== null);
  const overall_score = categories.length > 0 ? Math.round((categories.reduce((a, b) => a + b, 0) / categories.length) * 10) / 10 : null;

  let status: "strong" | "developing" | "significant_gap" | "insufficient_evidence" = "insufficient_evidence";
  if (categories.length >= 3 && overall_score !== null) {
    if (overall_score >= 75) status = "strong";
    else if (overall_score >= 50) status = "developing";
    else status = "significant_gap";
  }

  const parts: string[] = [];
  if (evQuestions.length > 0) parts.push(`${evQuestions.length} EV-related question${evQuestions.length > 1 ? "s" : ""}`);
  if (practicalObs && practicalObs.length > 0) parts.push(`${practicalObs.length} practical observation${practicalObs.length > 1 ? "s" : ""}`);
  const verifiedCount = trainingDocs.filter((d) => d.status === "verified").length;
  if (verifiedCount > 0) parts.push(`${verifiedCount} verified training document${verifiedCount > 1 ? "s" : ""}`);
  const calculation_notes = parts.length > 0 ? `Based on ${parts.join(", ")}.` : "Computed from available assessment evidence.";

  await admin.from("ev_readiness_scores").upsert(
    {
      assessment_id: assessmentId,
      ev_knowledge, hv_safety_awareness, diagnostics, practical_evidence, training_evidence, verbal_reasoning,
      overall_score, status, calculation_notes, generated_at: new Date().toISOString(),
    },
    { onConflict: "assessment_id" }
  );

  if (overall_score !== null) {
    await admin.from("assessments").update({ ev_readiness_score: overall_score }).eq("id", assessmentId);
  }
}
