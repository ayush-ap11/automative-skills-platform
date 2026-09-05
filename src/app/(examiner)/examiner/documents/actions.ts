"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const SENSITIVE_CATEGORIES = [
  "health_fitness", "eye_test", "passport", "medicare_card", "national_id", "police_check",
];

export const CATEGORY_LABELS: Record<string, string> = {
  resume: "Resume / CV", job_card: "Job Card Evidence", qualification_certificate: "Qualification Certificate",
  training_certificate: "Training Certificate", ev_training_certificate: "EV Training Certificate",
  safety_training: "Safety Training", manufacturer_training: "Manufacturer Training",
  drivers_licence: "Driver's Licence", health_fitness: "Health & Fitness", eye_test: "Eye Test", other: "Other Supporting Document",
};

export interface DocumentDetailsResult {
  fileUrl?: string; category?: string; categoryLabel?: string; fileName?: string;
  aiExtractedData?: Record<string, unknown> | null;
  pastReviews?: Array<{ id: string; decision: string; comment: string | null; reviewedAt: string; reviewerName: string }>;
  error?: string;
}

async function verifyAccess(docId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: doc } = await supabase.from("documents")
    .select("id, candidate_profile_id, category, storage_path, file_name, status, ai_extracted_data, is_sensitive")
    .eq("id", docId).maybeSingle();
  if (!doc) return { error: "Document not found" };
  if (doc.is_sensitive || SENSITIVE_CATEGORIES.includes(doc.category)) return { error: "Access denied: sensitive document" };

  const { data: assigned } = await supabase.from("assessments").select("id")
    .eq("candidate_profile_id", doc.candidate_profile_id).eq("assigned_examiner_id", user.id).limit(1);
  if (!assigned?.length) return { error: "Not authorized for this candidate" };

  return { supabase, user, doc };
}

export async function getDocumentDetails(documentId: string): Promise<DocumentDetailsResult> {
  const auth = await verifyAccess(documentId);
  if (auth.error || !auth.doc || !auth.supabase) return { error: auth.error };
  const { supabase, doc } = auth;

  const admin = createAdminClient();
  const { data: signed, error: signErr } = await admin.storage.from("candidate-documents").createSignedUrl(doc.storage_path, 3600);
  if (signErr || !signed?.signedUrl) return { error: signErr?.message || "Failed to generate preview URL" };

  const { data: reviews } = await supabase.from("document_reviews")
    .select("id, decision, comment, reviewed_at, reviewer:profiles(full_name, preferred_name)")
    .eq("document_id", documentId).order("reviewed_at", { ascending: false });

  const pastReviews = (reviews || []).map((r: any) => ({
    id: r.id, decision: r.decision, comment: r.comment, reviewedAt: r.reviewed_at,
    reviewerName: r.reviewer?.preferred_name || r.reviewer?.full_name || "Examiner",
  }));

  return {
    fileUrl: signed.signedUrl, category: doc.category,
    categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
    fileName: doc.file_name, aiExtractedData: doc.ai_extracted_data as Record<string, unknown> | null, pastReviews,
  };
}

export async function reviewDocument(
  documentId: string, decision: "verified" | "rejected" | "needs_more_info", comment?: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAccess(documentId);
  if (auth.error || !auth.doc || !auth.user || !auth.supabase) return { error: auth.error };
  const { supabase, user, doc } = auth;

  const statusMap = { verified: "verified", rejected: "rejected", needs_more_info: "pending_review" } as const;
  const newStatus = statusMap[decision];

  const { error: revErr } = await supabase.from("document_reviews").insert({
    document_id: documentId, reviewer_id: user.id, decision, comment: comment?.trim() || null,
  });
  if (revErr) return { error: revErr.message };

  const { error: updErr } = await supabase.from("documents")
    .update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", documentId);
  if (updErr) return { error: updErr.message };

  const { data: cp } = await supabase.from("candidate_profiles").select("profile_id").eq("id", doc.candidate_profile_id).maybeSingle();
  if (cp?.profile_id) {
    const catLabel = CATEGORY_LABELS[doc.category] || doc.category;
    await supabase.from("notifications").insert({
      recipient_id: cp.profile_id, type: "document_reviewed", title: "Document Reviewed",
      message: `Your ${catLabel} document has been reviewed.`,
    });
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id, action: "document_reviewed", entity_type: "documents", entity_id: documentId,
    previous_value: { status: doc.status }, new_value: { status: newStatus, decision, comment: comment?.trim() || null },
  });

  return { success: true };
}
