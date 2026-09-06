"use server";

import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) return { error: "Forbidden: Admin only" };
  return { supabase, user, orgId: profile.organisation_id };
}

export async function upsertTemplate(templateId: string | null, title: string, frameworkVersion: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, user, orgId } = auth;
  if (!title.trim()) return { error: "Title is required" };

  if (templateId) {
    const { error } = await supabase.from("assessment_templates")
      .update({ title: title.trim(), framework_version: frameworkVersion.trim() })
      .eq("id", templateId).eq("organisation_id", orgId);
    if (error) return { error: error.message };
    return { success: true, id: templateId };
  }
  const { data, error } = await supabase.from("assessment_templates")
    .insert({ title: title.trim(), framework_version: frameworkVersion.trim(), organisation_id: orgId, created_by: user.id })
    .select("id").single();
  if (error || !data) return { error: error?.message || "Failed to create template" };
  return { success: true, id: data.id };
}

export async function upsertSection(templateId: string, sectionId: string | null, title: string, orderIndex: number, weightPct: number) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;
  const { data: tmpl } = await supabase.from("assessment_templates").select("id").eq("id", templateId).eq("organisation_id", orgId).maybeSingle();
  if (!tmpl) return { error: "Template not found or outside organization" };

  if (sectionId) {
    const { error } = await supabase.from("assessment_sections").update({ title: title.trim(), weight_pct: weightPct }).eq("id", sectionId).eq("template_id", templateId);
    if (error) return { error: error.message };
    return { success: true };
  }
  const { data: newSec, error } = await supabase
    .from("assessment_sections")
    .insert({
      template_id: templateId,
      title: title.trim(),
      order_index: orderIndex,
      weight_pct: weightPct,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { success: true, id: newSec?.id };
}

export async function reorderSection(sectionId: string, direction: "up" | "down") {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: cur } = await supabase.from("assessment_sections").select("id, template_id, order_index, assessment_templates!inner(organisation_id)").eq("id", sectionId).maybeSingle();
  if (!cur || (cur as any).assessment_templates?.organisation_id !== orgId) return { error: "Section not found" };

  const { data: secs } = await supabase.from("assessment_sections").select("id, order_index").eq("template_id", cur.template_id).order("order_index", { ascending: true });
  if (!secs || secs.length < 2) return { success: true };

  const idx = secs.findIndex((s) => s.id === sectionId);
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= secs.length) return { success: true };

  const other = secs[targetIdx];
  await supabase.from("assessment_sections").update({ order_index: other.order_index }).eq("id", cur.id);
  await supabase.from("assessment_sections").update({ order_index: cur.order_index }).eq("id", other.id);
  return { success: true };
}

export async function deleteSection(sectionId: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: sec } = await supabase.from("assessment_sections").select("id, assessment_templates!inner(organisation_id)").eq("id", sectionId).maybeSingle();
  if (!sec || (sec as any).assessment_templates?.organisation_id !== orgId) return { error: "Section not found" };

  const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("section_id", sectionId);
  if (count && count > 0) return { error: "has_questions" };

  const { error } = await supabase.from("assessment_sections").delete().eq("id", sectionId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function assignAssessment(candidateProfileId: string, templateId: string, examinerId: string) {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, user, orgId } = auth;

  const { data: cand } = await supabase.from("candidate_profiles").select("id, profile_id, profiles!inner(organisation_id)").eq("id", candidateProfileId).maybeSingle();
  if (!cand || (cand as any).profiles?.organisation_id !== orgId) return { error: "Invalid candidate" };

  const { data: tmpl } = await supabase.from("assessment_templates").select("id").eq("id", templateId).eq("organisation_id", orgId).maybeSingle();
  if (!tmpl) return { error: "Invalid template" };

  const { data: exm } = await supabase.from("profiles").select("id").eq("id", examinerId).eq("organisation_id", orgId).maybeSingle();
  if (!exm) return { error: "Invalid examiner" };

  const { data: ass, error: assErr } = await supabase.from("assessments").insert({
    candidate_profile_id: candidateProfileId, template_id: templateId, assigned_examiner_id: examinerId, status: "not_started",
  }).select("id").single();
  if (assErr || !ass) return { error: assErr?.message || "Failed to assign assessment" };

  await supabase.from("notifications").insert({
    recipient_id: cand.profile_id, type: "assessment_assigned", title: "New Assessment Assigned", message: "A new assessment has been assigned to you",
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id, action: "assessment_assigned", entity_type: "assessment", entity_id: ass.id,
    new_value: { template_id: templateId, candidate_profile_id: candidateProfileId, assigned_examiner_id: examinerId },
  });

  return { success: true };
}

export async function createBlankTemplate(): Promise<{
  success?: boolean;
  id?: string;
  error?: string;
}> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: tmpl, error } = await supabase
    .from("assessment_templates")
    .insert({
      organisation_id: orgId,
      title: "Untitled Assessment Template",
      framework_version: "AUR Release 9.0",
    })
    .select("id")
    .single();

  if (error || !tmpl)
    return { error: error?.message || "Failed to create template" };

  await supabase.from("assessment_sections").insert({
    template_id: tmpl.id,
    title: "Section 1: General Knowledge",
    order_index: 0,
    weight_pct: 100,
  });

  return { success: true, id: tmpl.id };
}

export async function updateTemplateDetails(
  templateId: string,
  title: string,
  frameworkVersion: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { error } = await supabase
    .from("assessment_templates")
    .update({
      title: title.trim(),
      framework_version: frameworkVersion.trim(),
    })
    .eq("id", templateId)
    .eq("organisation_id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addQuestionsFromBank(
  questionIds: string[],
  targetSectionId: string,
): Promise<{ success?: boolean; addedCount?: number; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: sec } = await supabase
    .from("assessment_sections")
    .select("id, assessment_templates!inner(organisation_id)")
    .eq("id", targetSectionId)
    .maybeSingle();

  if (!sec || (sec as any).assessment_templates?.organisation_id !== orgId) {
    return { error: "Target section not found or unauthorized" };
  }

  let added = 0;
  for (const qId of questionIds) {
    const { data: orig } = await supabase
      .from("questions")
      .select("*, question_options(*)")
      .eq("id", qId)
      .maybeSingle();

    if (!orig) continue;

    const {
      id: _,
      created_at: __,
      question_options: origOpts,
      ...dupPayload
    } = orig;
    dupPayload.section_id = targetSectionId;
    dupPayload.status = orig.status || "active";

    let { data: newQ, error: insErr } = await supabase
      .from("questions")
      .insert(dupPayload)
      .select("id")
      .single();
    if (
      insErr &&
      (insErr.code === "42703" ||
        insErr.code === "PGRST204" ||
        insErr.message?.includes("explanation")) &&
      "explanation" in dupPayload
    ) {
      delete dupPayload.explanation;
      const retry = await supabase
        .from("questions")
        .insert(dupPayload)
        .select("id")
        .single();
      newQ = retry.data;
      insErr = retry.error;
    }

    if (!insErr && newQ) {
      added++;
      if (origOpts && origOpts.length > 0) {
        const newOpts = origOpts.map((o: any) => ({
          question_id: newQ.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
          order_index: o.order_index,
        }));
        await supabase.from("question_options").insert(newOpts);
      }
    }
  }

  return { success: true, addedCount: added };
}
