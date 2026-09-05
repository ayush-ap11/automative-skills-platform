"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeVerbalAnswer } from "@/lib/ai/verbal-analysis";

export async function submitVerbalAnswer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const assessmentId = formData.get("assessmentId") as string;
  const questionId = formData.get("questionId") as string;
  const audioFile = formData.get("audio") as File | null;
  const durationSeconds = Number(formData.get("durationSeconds") || 0);

  if (!audioFile || typeof audioFile === "string" || audioFile.size === 0) {
    return { error: "No audio recording provided." };
  }

  const adminClient = createAdminClient();
  const { data: cp } = await adminClient.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) return { error: "Candidate profile not found" };

  const { data: assessment } = await adminClient
    .from("assessments")
    .select("id, status")
    .eq("id", assessmentId)
    .eq("candidate_profile_id", cp.id)
    .single();
  if (!assessment) return { error: "Assessment unauthorized or not found" };

  if (assessment.status === "not_started") {
    await adminClient.from("assessments").update({ status: "in_progress" }).eq("id", assessmentId);
  }

  const storagePath = `${cp.id}/${assessmentId}/${questionId}.webm`;
  const buffer = Buffer.from(await audioFile.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from("verbal-answers")
    .upload(storagePath, buffer, { contentType: audioFile.type || "audio/webm", upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { data: existingCA } = await adminClient
    .from("candidate_answers")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("question_id", questionId)
    .maybeSingle();

  let candidateAnswerId = existingCA?.id;
  if (!candidateAnswerId) {
    const { data: newCA, error: caError } = await adminClient
      .from("candidate_answers")
      .insert({ assessment_id: assessmentId, question_id: questionId, answered_at: new Date().toISOString() })
      .select("id")
      .single();
    if (caError || !newCA) return { error: caError?.message || "Failed to save answer record" };
    candidateAnswerId = newCA.id;
  } else {
    await adminClient.from("candidate_answers").update({ answered_at: new Date().toISOString() }).eq("id", candidateAnswerId);
  }

  const { data: existingVA } = await adminClient
    .from("verbal_answers")
    .select("id")
    .eq("candidate_answer_id", candidateAnswerId)
    .maybeSingle();

  let verbalAnswerId = existingVA?.id;
  if (existingVA) {
    await adminClient.from("verbal_answers").update({
      audio_storage_path: storagePath, duration_seconds: durationSeconds, recorded_at: new Date().toISOString(),
    }).eq("id", existingVA.id);
  } else {
    const { data: newVA, error: vaErr } = await adminClient
      .from("verbal_answers")
      .insert({ candidate_answer_id: candidateAnswerId, audio_storage_path: storagePath, duration_seconds: durationSeconds })
      .select("id")
      .single();
    if (vaErr || !newVA) return { error: vaErr?.message || "Failed to save verbal recording" };
    verbalAnswerId = newVA.id;
  }

  const { data: existingT } = await adminClient.from("transcripts").select("id").eq("verbal_answer_id", verbalAnswerId).maybeSingle();
  let transcriptId = existingT?.id;
  if (!transcriptId) {
    const { data: newT } = await adminClient.from("transcripts").insert({ verbal_answer_id: verbalAnswerId }).select("id").single();
    transcriptId = newT?.id;
  }

  const { data: question } = await adminClient
    .from("questions")
    .select("question_text, safety_critical, marks")
    .eq("id", questionId)
    .maybeSingle();

  if (question) {
    const analysis = await analyzeVerbalAnswer(
      buffer,
      audioFile.type || "audio/webm",
      question.question_text,
      Boolean(question.safety_critical),
      Number(question.marks) || 10
    );

    if (analysis) {
      if (transcriptId) {
        await adminClient.from("transcripts").update({
          transcript_text: analysis.transcript,
          confidence: analysis.transcriptConfidence,
        }).eq("id", transcriptId);
      }

      await adminClient.from("ai_analyses").delete().eq("candidate_answer_id", candidateAnswerId);
      await adminClient.from("ai_analyses").insert({
        candidate_answer_id: candidateAnswerId,
        technical_score: analysis.technicalScore, safety_score: analysis.safetyScore,
        diagnostic_reasoning_score: analysis.diagnosticReasoningScore, communication_score: analysis.communicationScore,
        completeness_score: analysis.completenessScore, provisional_score: analysis.provisionalScore,
        critical_safety_flag: analysis.criticalSafetyFlag, flag_reason: analysis.flagReason,
        model_version: analysis.modelVersion, confidence_level: analysis.confidenceLevel,
      });
    }
  }

  revalidatePath(`/assessments/${assessmentId}/section`);
  return { success: true };
}

export async function getVerbalAudioUrl(storagePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage.from("verbal-answers").createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return { error: error?.message || "Failed to retrieve audio" };
  return { success: true, signedUrl: data.signedUrl };
}
