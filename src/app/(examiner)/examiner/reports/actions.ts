"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ExaminerReportSignedUrlResult {
  url?: string;
  error?: string;
}

export async function getExaminerReportSignedUrl(
  reportId: string
): Promise<ExaminerReportSignedUrlResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Session expired. Please log in again." };
    }

    const admin = createAdminClient();

    const { data: report, error: repErr } = await admin
      .from("reports")
      .select("id, candidate_profile_id, file_storage_path, assessment_id")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      return { error: "Report not found." };
    }

    if (!report.file_storage_path) {
      return { error: "Report document is still generating or unavailable." };
    }

    const cleanPath = report.file_storage_path
      .replace(/^candidate-reports\//, "")
      .replace(/^\//, "");

    const { data: signedData, error: signError } = await admin.storage
      .from("candidate-reports")
      .createSignedUrl(cleanPath, 3600);

    if (signError || !signedData?.signedUrl) {
      return { error: signError?.message || "Failed to generate secure report download link." };
    }

    return { url: signedData.signedUrl };
  } catch (err: any) {
    return { error: err.message || "Failed to retrieve report download link." };
  }
}
