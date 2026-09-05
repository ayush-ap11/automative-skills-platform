"use server";

import { createClient } from "@/lib/supabase/server";

const VALID_RATINGS = ["not_demonstrated", "developing", "competent", "highly_competent"] as const;

export interface ChecklistItemInput {
  id: string;
  label: string;
  rating: "not_demonstrated" | "developing" | "competent" | "highly_competent";
  comment: string;
}

export async function createObservation(
  assessmentId: string,
  taskTitle: string,
  checklist: ChecklistItemInput[],
  overallRating: "not_demonstrated" | "developing" | "competent" | "highly_competent"
): Promise<{ success?: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!assessmentId) return { error: "Assessment selection is required." };
  if (!taskTitle || !taskTitle.trim()) return { error: "Task title is required." };

  if (!checklist || checklist.length === 0) {
    return { error: "Checklist must contain at least one item." };
  }

  for (let i = 0; i < checklist.length; i++) {
    const item = checklist[i];
    if (!item.label || !item.label.trim()) {
      return { error: `Item ${i + 1} requires a task or criterion label.` };
    }
    if (!item.rating || !VALID_RATINGS.includes(item.rating)) {
      return { error: `Item ${i + 1} ("${item.label}") must have a valid performance rating.` };
    }
  }

  if (!overallRating || !VALID_RATINGS.includes(overallRating)) {
    return { error: "A valid overall competency rating is required." };
  }

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, assigned_examiner_id")
    .eq("id", assessmentId)
    .eq("assigned_examiner_id", user.id)
    .maybeSingle();

  if (!assessment) {
    return { error: "Assessment not found or you are not the assigned examiner." };
  }

  const { data: newRow, error: insertError } = await supabase
    .from("practical_observations")
    .insert({
      assessment_id: assessmentId,
      examiner_id: user.id,
      task_title: taskTitle.trim(),
      checklist,
      overall_rating: overallRating,
      observed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !newRow) {
    return { error: insertError?.message || "Failed to save practical observation." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "practical_observation_created",
    entity_type: "practical_observation",
    entity_id: newRow.id,
    new_value: { task_title: taskTitle, overall_rating: overallRating },
  });

  return { success: true, id: newRow.id };
}
