import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ExaminerAiReviewsList,
  AiReviewItem,
} from "@/components/examiner/ExaminerAiReviewsList";

export const dynamic = "force-dynamic";

export default async function ExaminerAiReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Find assessments assigned to this examiner
  const { data: assessments } = await admin
    .from("assessments")
    .select("id, candidate_profile_id")
    .eq("assigned_examiner_id", user.id);

  const assessmentIds = (assessments || []).map((a) => a.id);

  if (assessmentIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI Reviews &amp; Provisional Scores
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and confirm AI-evaluated verbal and written candidate responses.
          </p>
        </div>
        <ExaminerAiReviewsList items={[]} />
      </div>
    );
  }

  // Fetch answers with AI analyses and candidate details
  const { data: rawAnswers } = await admin
    .from("candidate_answers")
    .select(`
      id,
      assessment_id,
      answer_text,
      questions (
        id,
        question_text,
        skill_category
      ),
      verbal_answers (
        id,
        transcripts (
          transcript_text
        )
      ),
      assessments!inner (
        id,
        candidate_profiles!inner (
          profiles!inner (
            full_name,
            preferred_name
          )
        )
      ),
      ai_analyses (
        id,
        provisional_score,
        confidence_level,
        critical_safety_flag,
        flag_reason,
        technical_score,
        safety_score,
        diagnostic_reasoning_score,
        communication_score,
        completeness_score,
        generated_at
      ),
      examiner_reviews (
        id,
        decision,
        final_score,
        comment,
        reviewed_at
      )
    `)
    .in("assessment_id", assessmentIds);

  const items: AiReviewItem[] = [];

  for (const ans of rawAnswers || []) {
    const aiList = ans.ai_analyses as any;
    const ai = Array.isArray(aiList) ? aiList[0] : aiList;
    if (!ai) continue; // Only show answers that have AI evaluation

    const q = Array.isArray(ans.questions) ? ans.questions[0] : ans.questions;
    const ass = Array.isArray(ans.assessments) ? ans.assessments[0] : ans.assessments;
    const cp = Array.isArray((ass as any)?.candidate_profiles)
      ? (ass as any).candidate_profiles[0]
      : (ass as any)?.candidate_profiles;
    const prof = Array.isArray(cp?.profiles) ? cp.profiles[0] : (cp?.profiles as any);
    const candName = prof?.preferred_name || prof?.full_name || "Candidate";

    const verbal = Array.isArray(ans.verbal_answers) ? ans.verbal_answers[0] : (ans.verbal_answers as any);
    const transcripts = verbal?.transcripts;
    const transcriptText = Array.isArray(transcripts)
      ? transcripts[0]?.transcript_text
      : (transcripts?.transcript_text || null);

    const revList = ans.examiner_reviews as any;
    const rev = Array.isArray(revList) ? revList[0] : revList;

    items.push({
      id: ai.id,
      candidateAnswerId: ans.id,
      assessmentId: ans.assessment_id,
      candidateName: candName,
      questionText: q?.question_text || "Assessment question",
      skillCategory: q?.skill_category || undefined,
      answerText: ans.answer_text,
      transcriptText,
      provisionalScore: Number(ai.provisional_score) || 0,
      confidenceLevel: ai.confidence_level != null ? Number(ai.confidence_level) : null,
      criticalSafetyFlag: Boolean(ai.critical_safety_flag),
      flagReason: ai.flag_reason || null,
      technicalScore: ai.technical_score != null ? Number(ai.technical_score) : null,
      safetyScore: ai.safety_score != null ? Number(ai.safety_score) : null,
      diagnosticReasoningScore:
        ai.diagnostic_reasoning_score != null ? Number(ai.diagnostic_reasoning_score) : null,
      communicationScore:
        ai.communication_score != null ? Number(ai.communication_score) : null,
      completenessScore:
        ai.completeness_score != null ? Number(ai.completeness_score) : null,
      isHumanReviewed: Boolean(rev),
      existingReview: rev
        ? {
            decision: rev.decision,
            finalScore: Number(rev.final_score) || 0,
            comment: rev.comment || null,
            reviewedAt: rev.reviewed_at || null,
          }
        : null,
    });
  }

  // Sort: pending first, then safety flagged, then newest
  items.sort((a, b) => {
    if (!a.isHumanReviewed && b.isHumanReviewed) return -1;
    if (a.isHumanReviewed && !b.isHumanReviewed) return 1;
    if (a.criticalSafetyFlag && !b.criticalSafetyFlag) return -1;
    if (!a.criticalSafetyFlag && b.criticalSafetyFlag) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AI Reviews &amp; Provisional Scores
        </h1>
        <p className="text-sm text-muted-foreground">
          Review, confirm, or adjust AI-evaluated responses for your assigned candidates before finalizing outcomes.
        </p>
      </div>

      <ExaminerAiReviewsList items={items} />
    </div>
  );
}
