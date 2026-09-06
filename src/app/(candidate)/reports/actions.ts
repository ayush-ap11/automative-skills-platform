"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GetReportSignedUrlResult {
  url?: string;
  error?: string;
}

export async function getReportSignedUrl(reportId: string): Promise<GetReportSignedUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expired. Please log in again." };
  }

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cp) {
    return { error: "Candidate profile not found." };
  }

  // 1. Verify the report exists and belongs to this candidate
  const { data: report } = await supabase
    .from("reports")
    .select("id, candidate_profile_id, file_storage_path")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.candidate_profile_id !== cp.id) {
    return { error: "Report not found or access denied." };
  }

  if (!report.file_storage_path) {
    return { error: "Report document is still processing." };
  }

  // Clean path format if bucket prefix is present
  const cleanPath = report.file_storage_path
    .replace(/^candidate-reports\//, "")
    .replace(/^\//, "");

  // 2. Generate signed download URL using admin client to prevent storage RLS key lookup failures
  try {
    const admin = createAdminClient();
    const { data: signedData, error: signError } = await admin.storage
      .from("candidate-reports")
      .createSignedUrl(cleanPath, 300);

    if (signError || !signedData?.signedUrl) {
      return { error: signError?.message || "Failed to generate secure report link." };
    }

    return { url: signedData.signedUrl };
  } catch (err: any) {
    return { error: err?.message || "Failed to generate secure report link." };
  }
}
