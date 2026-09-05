"use server";

import { createClient } from "@/lib/supabase/server";

export interface QuestionFormData {
  questionText: string; questionType: string; skillCategory: string;
  difficulty: "easy" | "medium" | "hard"; explanation?: string; competencyMapping: string[];
  marks: number; timeLimitSeconds?: number | null; mandatory: boolean;
  aiEvaluationEnabled: boolean; evRelated: boolean; safetyCritical: boolean;
  status: "draft" | "active" | "retired";
}

export interface QuestionOptionInput {
  text: string;
  isCorrect: boolean;
}

async function verifyAdminAndOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) return { error: "Forbidden: Admin only" };
  return { supabase, user, orgId: profile.organisation_id };
}

async function verifySectionOrg(supabase: any, sectionId: string, orgId: string) {
  const { data: sec } = await supabase.from("assessment_sections")
    .select("id, assessment_templates!inner(organisation_id)").eq("id", sectionId).maybeSingle();
  return sec?.assessment_templates?.organisation_id === orgId;
}

export async function upsertQuestion(
  sectionId: string,
  questionId: string | null,
  data: QuestionFormData,
  options: QuestionOptionInput[] = []
): Promise<{ success?: boolean; id?: string; error?: string }> {
  const auth = await verifyAdminAndOrg();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const validSec = await verifySectionOrg(supabase, sectionId, orgId);
  if (!validSec) return { error: "Invalid section: outside your organisation" };

  const payload: any = {
    section_id: sectionId, question_text: data.questionText.trim(), question_type: data.questionType,
    skill_category: data.skillCategory, difficulty: data.difficulty,
    competency_mapping: data.competencyMapping || [], marks: Number(data.marks) || 1,
    time_limit_seconds: data.timeLimitSeconds ? Number(data.timeLimitSeconds) : null,
    mandatory: Boolean(data.mandatory), ai_evaluation_enabled: Boolean(data.aiEvaluationEnabled),
    ev_related: Boolean(data.evRelated), safety_critical: Boolean(data.safetyCritical), status: data.status || "draft",
  };
  if (data.explanation !== undefined) payload.explanation = data.explanation?.trim() || null;

  let targetId = questionId;
  let qErr: any = null;
  const isExp = (err: any) => err && (err.code === "42703" || err.code === "PGRST204" || err.message?.includes("explanation"));

  if (targetId) {
    let res = await supabase.from("questions").update(payload).eq("id", targetId);
    if (isExp(res.error) && "explanation" in payload) {
      delete payload.explanation;
      res = await supabase.from("questions").update(payload).eq("id", targetId);
    }
    qErr = res.error;
  } else {
    let res = await supabase.from("questions").insert(payload).select("id").single();
    if (isExp(res.error) && "explanation" in payload) {
      delete payload.explanation;
      res = await supabase.from("questions").insert(payload).select("id").single();
    }
    qErr = res.error;
    targetId = res.data?.id;
  }
  if (qErr || !targetId) return { error: qErr?.message || "Failed to save question" };

  await supabase.from("question_options").delete().eq("question_id", targetId);
  if (options.length > 0) {
    const optRows = options.map((opt, idx) => ({
      question_id: targetId, option_text: opt.text.trim(), is_correct: Boolean(opt.isCorrect), order_index: idx,
    }));
    const { error: optErr } = await supabase.from("question_options").insert(optRows);
    if (optErr) return { error: optErr.message };
  }

  return { success: true, id: targetId };
}

export async function duplicateQuestion(
  questionId: string,
  targetSectionId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAdminAndOrg();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const validSec = await verifySectionOrg(supabase, targetSectionId, orgId);
  if (!validSec) return { error: "Target section outside your organisation" };

  const { data: orig } = await supabase.from("questions").select("*, question_options(*)").eq("id", questionId).maybeSingle();
  if (!orig) return { error: "Original question not found" };

  const { id: _, created_at: __, question_options: origOpts, ...dupPayload } = orig;
  dupPayload.section_id = targetSectionId;
  dupPayload.status = "draft";

  let { data: newQ, error: insErr } = await supabase.from("questions").insert(dupPayload).select("id").single();
  if (insErr && (insErr.code === "42703" || insErr.code === "PGRST204" || insErr.message?.includes("explanation")) && "explanation" in dupPayload) {
    delete dupPayload.explanation;
    const retry = await supabase.from("questions").insert(dupPayload).select("id").single();
    newQ = retry.data;
    insErr = retry.error;
  }
  if (insErr || !newQ) return { error: insErr?.message || "Failed to duplicate question" };

  if (origOpts && origOpts.length > 0) {
    const newOpts = origOpts.map((o: any) => ({
      question_id: newQ.id, option_text: o.option_text, is_correct: o.is_correct, order_index: o.order_index,
    }));
    await supabase.from("question_options").insert(newOpts);
  }
  return { success: true };
}

export async function deleteQuestion(
  questionId: string
): Promise<{ success?: boolean; error?: "in_use" | string; message?: string }> {
  const auth = await verifyAdminAndOrg();
  if (auth.error || !auth.supabase) return { error: auth.error };
  const { supabase } = auth;

  const { data: answers } = await supabase.from("candidate_answers").select("id").eq("question_id", questionId).limit(1);
  if (answers && answers.length > 0) {
    return { error: "in_use", message: "This question has already been answered by a candidate — retire it instead of deleting." };
  }

  await supabase.from("question_options").delete().eq("question_id", questionId);
  const { error: delErr } = await supabase.from("questions").delete().eq("id", questionId);
  if (delErr) return { error: delErr.message };

  return { success: true };
}
