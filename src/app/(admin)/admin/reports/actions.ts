"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id)
    return { error: "Forbidden: Admin only" };

  return { supabase, user, orgId: profile.organisation_id };
}

export async function getAdminReportUrl(
  reportId: string,
): Promise<{ url?: string; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };
  const { supabase, orgId } = auth;

  const { data: report } = await supabase
    .from("reports")
    .select(
      "id, file_storage_path, candidate_profiles!inner(profiles!inner(organisation_id))",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return { error: "Report not found" };

  const repOrgId = (report as any).candidate_profiles?.profiles
    ?.organisation_id;
  if (repOrgId !== orgId)
    return { error: "Access denied: Report outside organization" };

  if (!report.file_storage_path) {
    return {
      error: "Report file is not yet ready or storage path is missing.",
    };
  }

  try {
    const admin = createAdminClient();
    const { data: signed, error: signErr } = await admin.storage
      .from("candidate-reports")
      .createSignedUrl(report.file_storage_path, 3600);

    if (signErr || !signed?.signedUrl) {
      return {
        error: signErr?.message || "Failed to generate report download URL",
      };
    }

    return { url: signed.signedUrl };
  } catch (err: any) {
    return { error: err?.message || "Failed to create signed report link" };
  }
}

export async function generateAdminReportAction(
  assessmentId: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (auth.error || !auth.supabase || !auth.orgId) return { error: auth.error };

  try {
    const { generateAndStoreReport } = await import(
      "@/lib/pdf/generate-and-store-report"
    );
    await generateAndStoreReport(assessmentId);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to generate report" };
  }
}
