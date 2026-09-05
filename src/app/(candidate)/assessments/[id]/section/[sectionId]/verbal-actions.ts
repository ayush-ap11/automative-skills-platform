"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) return { error: "Candidate profile not found" };

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, candidate_profile_id")
    .eq("id", assessmentId)
    .eq("candidate_profile_id", cp.id)
    .single();
  if (!assessment) return { error: "Assessment unauthorized or not found" };

  const storagePath = `${cp.id}/${assessmentId}/${questionId}.webm`;
  const buffer = Buffer.from(await audioFile.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("verbal-answers")
    .upload(storagePath, buffer, {
      contentType: audioFile.type || "audio/webm",
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: existingCA } = await supabase
    .from("candidate_answers")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("question_id", questionId)
    .maybeSingle();

  let candidateAnswerId = existingCA?.id;
  if (!candidateAnswerId) {
    const { data: newCA, error: caError } = await supabase
      .from("candidate_answers")
      .insert({
        assessment_id: assessmentId,
        question_id: questionId,
        answered_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (caError || !newCA) return { error: caError?.message || "Failed to save answer record" };
    candidateAnswerId = newCA.id;
  } else {
    await supabase.from("candidate_answers").update({ answered_at: new Date().toISOString() }).eq("id", candidateAnswerId);
  }

  const { data: existingVA } = await supabase
    .from("verbal_answers")
    .select("id")
    .eq("candidate_answer_id", candidateAnswerId)
    .maybeSingle();

  let verbalAnswerId = existingVA?.id;
  if (existingVA) {
    const { error: vaErr } = await supabase
      .from("verbal_answers")
      .update({
        audio_storage_path: storagePath,
        duration_seconds: durationSeconds,
        recorded_at: new Date().toISOString(),
      })
      .eq("id", existingVA.id);
    if (vaErr) return { error: vaErr.message };
  } else {
    const { data: newVA, error: vaErr } = await supabase
      .from("verbal_answers")
      .insert({
        candidate_answer_id: candidateAnswerId,
        audio_storage_path: storagePath,
        duration_seconds: durationSeconds,
      })
      .select("id")
      .single();
    if (vaErr || !newVA) return { error: vaErr?.message || "Failed to save verbal recording" };
    verbalAnswerId = newVA.id;
  }

  // TODO: transcription pipeline wired in a later step
  const { data: existingTranscript } = await supabase
    .from("transcripts")
    .select("id")
    .eq("verbal_answer_id", verbalAnswerId)
    .maybeSingle();

  if (!existingTranscript) {
    await supabase.from("transcripts").insert({
      verbal_answer_id: verbalAnswerId,
      transcript_text: null,
      confidence: null,
    });
  }

  revalidatePath(`/assessments/${assessmentId}/section`);
  return { success: true };
}

export async function getVerbalAudioUrl(storagePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const { data, error } = await supabase.storage
    .from("verbal-answers")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) return { error: error?.message || "Failed to retrieve audio" };
  return { success: true, signedUrl: data.signedUrl };
}
