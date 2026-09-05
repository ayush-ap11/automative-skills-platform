"use server";

import { createClient } from "@/lib/supabase/server";

export interface SaveReviewInput {
  finalScore: number;
  comment: string;
  decision: "accept_ai_score" | "modify_score" | "request_reassessment";
}

export async function saveQuestionReview(
  assessmentId: string,
  candidateAnswerId: string,
  data: SaveReviewInput
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, assigned_examiner_id")
    .eq("id", assessmentId)
    .eq("assigned_examiner_id", user.id)
    .maybeSingle();

  if (!assessment) return { error: "Not authorized to review this assessment" };

  const { data: answer } = await supabase
    .from("candidate_answers")
    .select("id, ai_analyses(id)")
    .eq("id", candidateAnswerId)
    .eq("assessment_id", assessmentId)
    .maybeSingle();

  if (!answer) return { error: "Candidate answer not found" };

  const aiAnalysisId = (answer.ai_analyses as any)?.[0]?.id || null;

  const { error: upsertError } = await supabase
    .from("examiner_reviews")
    .upsert(
      {
        candidate_answer_id: candidateAnswerId,
        examiner_id: user.id,
        ai_analysis_id: aiAnalysisId,
        decision: data.decision,
        final_score: data.finalScore,
        comment: data.comment,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "candidate_answer_id" }
    );

  if (upsertError) return { error: upsertError.message };
  return { success: true };
}

export async function getVerbalAudioUrl(
  verbalAnswerId: string
): Promise<{ success?: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: verbal } = await supabase
    .from("verbal_answers")
    .select(`
      id,
      audio_storage_path,
      candidate_answers!inner (
        assessment_id,
        assessments!inner (
          assigned_examiner_id
        )
      )
    `)
    .eq("id", verbalAnswerId)
    .maybeSingle();

  if (!verbal) return { error: "Verbal recording not found" };

  const assignedId = (verbal.candidate_answers as any)?.assessments?.assigned_examiner_id;
  if (assignedId !== user.id) return { error: "Not authorized to access recording" };

  const { data: signed, error: signError } = await supabase.storage
    .from("verbal-answers")
    .createSignedUrl(verbal.audio_storage_path, 3600);

  if (signError || !signed?.signedUrl) {
    return { error: signError?.message || "Failed to generate audio playback URL" };
  }

  return { success: true, url: signed.signedUrl };
}
