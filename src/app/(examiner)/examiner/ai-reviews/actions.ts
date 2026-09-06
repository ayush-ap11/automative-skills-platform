"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface SubmitAiReviewInput {
  candidateAnswerId: string;
  aiAnalysisId?: string | null;
  decision: "accept_ai_score" | "modify_score" | "request_reassessment";
  finalScore: number;
  comment?: string;
}

export async function submitAiReviewAction(
  input: SubmitAiReviewInput
): Promise<{ success?: boolean; error?: string; review?: any }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // Verify answer exists
    const { data: answer, error: ansErr } = await admin
      .from("candidate_answers")
      .select(`
        id,
        assessment_id,
        assessments (
          id,
          assigned_examiner_id
        )
      `)
      .eq("id", input.candidateAnswerId)
      .maybeSingle();

    if (ansErr || !answer) {
      return { error: "Assessment answer record not found." };
    }

    // Check existing review
    const { data: existingRev } = await admin
      .from("examiner_reviews")
      .select("id, decision, final_score, comment")
      .eq("candidate_answer_id", input.candidateAnswerId)
      .maybeSingle();

    const { data: savedRev, error: upsertError } = await admin
      .from("examiner_reviews")
      .upsert(
        {
          candidate_answer_id: input.candidateAnswerId,
          examiner_id: user.id,
          ai_analysis_id: input.aiAnalysisId || null,
          decision: input.decision,
          final_score: input.finalScore,
          comment: input.comment?.trim() || (input.decision === "accept_ai_score" ? "AI provisional score confirmed by examiner." : null),
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "candidate_answer_id" }
      )
      .select("id, reviewed_at")
      .single();

    if (upsertError) {
      return { error: upsertError.message };
    }

    // Log update or creation to audit_logs
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: existingRev ? "examiner_review_updated" : "examiner_review_created",
      entity_type: "examiner_reviews",
      entity_id: savedRev?.id || existingRev?.id || input.candidateAnswerId,
      previous_value: existingRev
        ? {
            decision: existingRev.decision,
            final_score: existingRev.final_score,
            comment: existingRev.comment,
          }
        : null,
      new_value: {
        decision: input.decision,
        final_score: input.finalScore,
        comment: input.comment?.trim() || null,
      },
    });

    revalidatePath("/examiner/ai-reviews");
    revalidatePath("/examiner/dashboard");
    revalidatePath("/examiner/assessments");

    return { success: true, review: savedRev };
  } catch (err: any) {
    return { error: err.message || "Failed to submit review decision." };
  }
}
