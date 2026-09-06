import { createAdminClient } from "./src/lib/supabase/admin";
import { generateAndStoreReport } from "./src/lib/pdf/generate-and-store-report";

async function run() {
  console.log("=== TRIGGERING REAL REPORT GENERATION FOR SUBMITTED/COMPLETED ASSESSMENTS ===");
  const admin = createAdminClient();

  // Find assessments in submitted, completed, finalised
  const { data: assessments, error } = await admin
    .from("assessments")
    .select(`
      id, status, overall_score, candidate_profile_id,
      candidate_profiles (
        id,
        profiles ( full_name )
      )
    `)
    .in("status", ["submitted", "completed"]);

  if (error || !assessments) {
    console.error("Error fetching assessments:", error);
    process.exit(1);
  }

  console.log(`Found ${assessments.length} candidate assessments with status submitted/completed/finalised.`);

  for (const a of assessments) {
    console.log(`\nChecking assessment: ${a.id} (Candidate: [REDACTED], status=${a.status})`);

    // Check if report already exists
    const { data: existing } = await admin
      .from("reports")
      .select("id, file_storage_path, generated_at")
      .eq("assessment_id", a.id)
      .maybeSingle();

    if (existing) {
      console.log(`  ✓ Report already exists: ${existing.id} (${existing.file_storage_path})`);
      continue;
    }

    console.log("  → Calling generateAndStoreReport...");
    await generateAndStoreReport(a.id);
    console.log("  ✓ Done generating report.");
  }

  // Summary
  const { data: allReports } = await admin
    .from("reports")
    .select(`
      id, report_type, generated_at, file_storage_path,
      candidate_profiles (
        profiles ( full_name )
      )
    `);

  console.log("\n=== ALL GENERATED REPORTS IN DATABASE ===");
  console.log(`Total reports: ${allReports?.length}`);
  for (const r of allReports || []) {
    console.log(`- Report ${r.id} for Candidate: [REDACTED] (${r.report_type}) -> ${r.file_storage_path}`);
  }
}

run().catch((err) => {
  console.error("Report generation failed:", err);
  process.exit(1);
});
