import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderAssessmentReportPdf, ReportData } from "./assessment-report";

export async function generateAndStoreReport(assessmentId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: a } = await admin
      .from("assessments")
      .select(`
        id, status, outcome, overall_score, completed_at, candidate_profile_id,
        assessment_templates (title, organisation_id, organisations (name)),
        profiles (full_name, preferred_name),
        candidate_profiles (
          id, current_role, years_experience,
          profiles (full_name, preferred_name, state, organisation_id, organisations (name))
        )
      `)
      .eq("id", assessmentId)
      .single();

    if (!a) return;
    const cp = a.candidate_profiles as any;
    const cpProfile = cp?.profiles;
    const orgId = (a.assessment_templates as any)?.organisation_id || cpProfile?.organisation_id;
    const orgName = (a.assessment_templates as any)?.organisations?.name || cpProfile?.organisations?.name || "Automotive Skills Australia";

    const { data: settings } = await admin.from("system_settings").select("framework_version").eq("organisation_id", orgId).maybeSingle();
    const { data: rawQuals } = await admin.from("qualifications").select("qualification_name, issuing_body, issue_date").eq("candidate_profile_id", cp?.id);

    const { data: answers } = await admin
      .from("candidate_answers")
      .select("id, questions (skill_category), examiner_reviews (final_score, comment, reviewed_at)")
      .eq("assessment_id", assessmentId);

    const catMap = new Map<string, { total: number; count: number }>();
    const comments: string[] = [];
    let reviewDate = a.completed_at ? new Date(a.completed_at).toLocaleDateString("en-AU") : new Date().toLocaleDateString("en-AU");

    for (const ans of answers || []) {
      const q = Array.isArray(ans.questions) ? ans.questions[0] : ans.questions;
      const rev = Array.isArray(ans.examiner_reviews) ? ans.examiner_reviews[0] : ans.examiner_reviews;
      const cat = q?.skill_category || "Core Diagnostic Competency";
      if (rev?.final_score != null) {
        const cur = catMap.get(cat) || { total: 0, count: 0 };
        cur.total += Number(rev.final_score);
        cur.count += 1;
        catMap.set(cat, cur);
      }
      if (rev?.comment) comments.push(rev.comment);
      if (rev?.reviewed_at) reviewDate = new Date(rev.reviewed_at).toLocaleDateString("en-AU");
    }

    const categoryScores = Array.from(catMap.entries()).map(([category, { total, count }]) => ({
      category, score: Math.round(total / count), questionCount: count,
    }));

    const { data: aiRows } = await admin
      .from("ai_analyses")
      .select("provisional_score, technical_score, safety_score, critical_safety_flag, candidate_answers!inner(assessment_id)")
      .eq("candidate_answers.assessment_id", assessmentId);

    const aiAnalysis = aiRows && aiRows.length > 0 ? {
      provisionalScore: Math.round(aiRows.reduce((acc, r) => acc + Number(r.provisional_score || 0), 0) / aiRows.length),
      technicalScore: Math.round(aiRows.reduce((acc, r) => acc + Number(r.technical_score || 0), 0) / aiRows.length),
      safetyScore: Math.round(aiRows.reduce((acc, r) => acc + Number(r.safety_score || 0), 0) / aiRows.length),
      safetyFlagged: aiRows.some((r) => Boolean(r.critical_safety_flag)),
    } : null;

    const { data: evScore } = await admin.from("ev_readiness_scores").select("*").eq("assessment_id", assessmentId).maybeSingle();
    const evReadiness = evScore ? {
      evKnowledge: evScore.ev_knowledge != null ? Number(evScore.ev_knowledge) : null,
      hvSafetyAwareness: evScore.hv_safety_awareness != null ? Number(evScore.hv_safety_awareness) : null,
      diagnostics: evScore.diagnostics != null ? Number(evScore.diagnostics) : null,
      practicalEvidence: evScore.practical_evidence != null ? Number(evScore.practical_evidence) : null,
      trainingEvidence: evScore.training_evidence != null ? Number(evScore.training_evidence) : null,
      verbalReasoning: evScore.verbal_reasoning != null ? Number(evScore.verbal_reasoning) : null,
      overallScore: evScore.overall_score != null ? Number(evScore.overall_score) : null,
      status: evScore.status || "developing",
    } : null;

    const examiner = a.profiles as any;
    const examinerName = examiner?.preferred_name || examiner?.full_name || "Certified Examiner";

    const reportData: ReportData = {
      organisationName: orgName,
      frameworkVersion: settings?.framework_version || "AUR Release 9.0",
      candidate: {
        fullName: cpProfile?.preferred_name || cpProfile?.full_name || "Candidate",
        role: cp?.current_role || "Automotive Technician",
        yearsExperience: cp?.years_experience || null,
        state: cpProfile?.state || null,
      },
      qualifications: (rawQuals || []).map((q) => ({
        name: q.qualification_name, issuingBody: q.issuing_body,
        issueDate: q.issue_date ? new Date(q.issue_date).toLocaleDateString("en-AU") : null,
      })),
      assessment: {
        templateTitle: (a.assessment_templates as any)?.title || "Vocational Competency Assessment",
        completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString("en-AU") : new Date().toLocaleDateString("en-AU"),
        overallScore: a.overall_score != null ? Number(a.overall_score) : null,
        outcome: a.outcome || "competent",
      },
      categoryScores,
      aiAnalysis,
      examinerReview: { examinerName, reviewDate, comments, finalOutcome: a.outcome || "competent" },
      evReadiness,
    };

    const pdfBuffer = await renderAssessmentReportPdf(reportData);
    const reportId = crypto.randomUUID();
    const storagePath = `${cp.id}/${reportId}.pdf`;

    await admin.storage
      .from("candidate-reports")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    await admin.from("reports").insert({
      id: reportId,
      candidate_profile_id: cp.id,
      assessment_id: assessmentId,
      report_type: "assessment_report",
      file_storage_path: storagePath,
      generated_by: "system",
    });
  } catch (err) {
    console.error("[generateAndStoreReport Error]", err);
  }
}
