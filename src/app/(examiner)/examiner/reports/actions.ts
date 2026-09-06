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

    // Verify caller role and organisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || (profile.role !== "examiner" && profile.role !== "admin")) {
      return { error: "Unauthorized: Examiner or Admin access required." };
    }

    const admin = createAdminClient();

    const { data: report, error: repErr } = await admin
      .from("reports")
      .select(`
        id, candidate_profile_id, file_storage_path, assessment_id,
        candidate_profiles!inner (
          profiles!inner (organisation_id)
        ),
        assessments (assigned_examiner_id)
      `)
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      return { error: "Report not found." };
    }

    // Verify organisation boundary
    const repOrgId = (report as any).candidate_profiles?.profiles?.organisation_id;
    if (repOrgId !== profile.organisation_id) {
      return { error: "Access denied: Report belongs to another organisation." };
    }

    // Verify examiner assignment
    if (profile.role === "examiner") {
      const assignedId = (report as any).assessments?.assigned_examiner_id;
      if (assignedId && assignedId !== user.id) {
        return { error: "Access denied: You are not assigned to this candidate assessment." };
      }
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
