"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canViewDocument } from "@/lib/candidate/document-auth";
import { extractDocumentData } from "@/lib/ai/document-extraction";

export async function grantConsent(consentType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) return { error: "Candidate profile not found" };

  const { error } = await supabase.from("consents").insert({
    candidate_profile_id: cp.id,
    consent_type: consentType,
    granted: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { success: true };
}

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const category = formData.get("category") as string;
  const file = formData.get("file") as File | null;
  const expiryDate = formData.get("expiryDate") as string | null;
  const consentGranted = formData.get("consentGranted") === "true";

  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Please select a valid document to upload." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Document exceeds maximum allowed size of 10MB." };
  }

  const { data: cp } = await supabase.from("candidate_profiles").select("id").eq("profile_id", user.id).single();
  if (!cp) return { error: "Candidate profile not found" };

  const isSensitive = category === "health_fitness" || category === "eye_test";
  if (isSensitive) {
    const { data: existingConsent } = await supabase
      .from("consents")
      .select("id")
      .eq("candidate_profile_id", cp.id)
      .eq("consent_type", category)
      .eq("granted", true)
      .maybeSingle();

    if (!existingConsent && !consentGranted) {
      return { error: "Consent is required before uploading sensitive documents." };
    }
    if (!existingConsent && consentGranted) {
      await supabase.from("consents").insert({ candidate_profile_id: cp.id, consent_type: category, granted: true });
    }
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${cp.id}/${category}/${Date.now()}_${cleanName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: storageError } = await supabase.storage
    .from("candidate-documents")
    .upload(storagePath, fileBuffer, { contentType: file.type || "application/octet-stream", upsert: true });
  if (storageError) return { error: storageError.message };

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      candidate_profile_id: cp.id,
      category: category as any,
      storage_path: storagePath,
      file_name: file.name,
      status: "uploaded",
      expiry_date: expiryDate && expiryDate.trim() ? expiryDate.trim() : null,
      is_sensitive: isSensitive,
    })
    .select("id")
    .single();

  if (docError) return { error: docError.message };

  const extractable = new Set([
    "resume",
    "job_card",
    "qualification_certificate",
    "training_certificate",
    "ev_training_certificate",
  ]);

  if (extractable.has(category)) {
    const extractedData = await extractDocumentData(category, fileBuffer, file.type || "application/pdf");
    if (extractedData) {
      await supabase
        .from("documents")
        .update({ ai_extracted_data: extractedData, status: "ai_extracted" })
        .eq("id", doc.id);
    }
  }

  revalidatePath("/documents");
  return { success: true, documentId: doc.id };
}

export async function getSignedUrl(documentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required" };

  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_path, is_sensitive, candidate_profile_id")
    .eq("id", documentId)
    .single();

  if (fetchErr || !doc) return { error: "Document not found" };

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("profile_id, profiles(organisation_id)")
    .eq("id", doc.candidate_profile_id)
    .single();

  if (!cp) return { error: "Candidate profile not found" };

  const allowed = await canViewDocument(supabase, doc, cp as any, user.id);
  if (!allowed) return { error: "Access denied" };

  const { data, error: signedErr } = await supabase.storage
    .from("candidate-documents")
    .createSignedUrl(doc.storage_path, 300);

  if (signedErr || !data?.signedUrl) return { error: signedErr?.message || "Failed to create URL" };
  return { success: true, signedUrl: data.signedUrl };
}
