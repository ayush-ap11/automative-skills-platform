import { createAdminClient } from "./src/lib/supabase/admin";
import { calculateEVReadiness } from "./src/lib/ai/ev-readiness-calculation";

const TEMPLATE_ID = "a9ac7e32-0c44-4ff5-a465-c99fe5ac9040"; // Test Assessment

const CANDIDATE_ASSESSMENTS = [
  {
    name: "Testing User",
    candidate_profile_id: "99846d4a-111d-4c0c-bd90-e3cf12dfd201",
    assessment_id: "ab9c1008-bca6-46e9-9392-8d2e1feda8df",
    scores: {
      q1: 90, // Diagnostics
      q2: 95, // HV Safety
      q3: 85, // Verbal
    },
    comments: {
      q1: "Demonstrated accurate diagnostic methodology on EV traction circuit fault.",
      q2: "Strict adherence to CAT III 1000V multimeter proving and PPE isolation.",
      q3: "Fluent explanation of isolation sequence and emergency shutoff procedures.",
    },
  },
  {
    name: "Ayush Pawar",
    candidate_profile_id: "9f811d36-72db-47fe-851f-6925dd9d6df9",
    assessment_id: "d7d2ad00-a39d-4c1c-8aaf-97d3efb4ca5f",
    scores: {
      q1: 70, // Diagnostics
      q2: 75, // HV Safety
      q3: 60, // Verbal
    },
    comments: {
      q1: "Basic diagnostic procedure identified, minor gaps in CAN-bus waveform analysis.",
      q2: "Followed lockout/tagout protocol satisfactorily.",
      q3: "Answer covered primary safety hazards; could provide more detail on cell thermal runaway mitigation.",
    },
  },
  {
    name: "New Candidate",
    candidate_profile_id: "e8377784-eb76-4e92-84ef-90b0be0420cd",
    assessment_id: "0f59ed8b-68e3-4f31-9250-5df8e6edfe12",
    scores: {
      q1: 80, // Diagnostics
      q2: 85, // HV Safety
      q3: 75, // Verbal
    },
    comments: {
      q1: "Good diagnostic reasoning and isolation trace on high-voltage inverter unit.",
      q2: "Verified zero-potential successfully with calibrated equipment.",
      q3: "Clear verbal articulation of high-voltage interlock loop verification.",
    },
  },
];

async function seedEVReadiness() {
  console.log("=== SEEDING EV READINESS VIA REAL CALCULATION ENGINE ===");
  const admin = createAdminClient();

  // 1. Fetch sections and questions for Test Assessment
  const { data: sections, error: secErr } = await admin
    .from("assessment_sections")
    .select("id, title")
    .eq("template_id", TEMPLATE_ID);

  if (secErr || !sections || sections.length === 0) {
    console.error("Error finding sections for template:", secErr);
    process.exit(1);
  }

  const sectionIds = sections.map((s) => s.id);
  const { data: questions, error: qErr } = await admin
    .from("questions")
    .select(
      "id, question_text, question_type, skill_category, ev_related, safety_critical, section_id",
    )
    .in("section_id", sectionIds);

  if (qErr || !questions || questions.length < 3) {
    console.error(
      "Error finding questions for template sections:",
      qErr,
      questions,
    );
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions in template.`);

  // Find Q1 (MCQ), Q2 (True/False), Q3 (Verbal)
  const q1 =
    questions.find((q) => q.question_type === "multiple_choice") ||
    questions[0];
  const q2 =
    questions.find((q) => q.question_type === "true_false") || questions[1];
  const q3 =
    questions.find((q) => q.question_type === "verbal") || questions[2];

  console.log("Configuring questions to ensure EV attributes:");
  // Ensure Q1 is EV-related + Diagnostic
  await admin
    .from("questions")
    .update({
      ev_related: true,
      skill_category: "EV Diagnostics",
      safety_critical: false,
    })
    .eq("id", q1.id);
  console.log(
    `  Updated Q1 (${q1.id}): ev_related=true, skill_category='EV Diagnostics'`,
  );

  // Ensure Q2 is EV-related + Safety Critical
  await admin
    .from("questions")
    .update({
      ev_related: true,
      safety_critical: true,
      skill_category: "HV Safety & Isolation",
    })
    .eq("id", q2.id);
  console.log(
    `  Updated Q2 (${q2.id}): ev_related=true, safety_critical=true, skill_category='HV Safety & Isolation'`,
  );

  // Ensure Q3 is EV-related + Verbal + Safety Critical
  await admin
    .from("questions")
    .update({
      ev_related: true,
      safety_critical: true,
      skill_category: "EV Battery Systems",
    })
    .eq("id", q3.id);
  console.log(
    `  Updated Q3 (${q3.id}): ev_related=true, safety_critical=true, skill_category='EV Battery Systems'`,
  );

  // Get Examiner profile
  const { data: examiner } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "examiner")
    .limit(1)
    .single();

  const examinerId = examiner?.id || null;
  console.log(
    `Using Examiner: ${examiner?.full_name || "Default Examiner"} (${examinerId})`,
  );

  // 2. Process candidate assessments
  for (const candidate of CANDIDATE_ASSESSMENTS) {
    console.log(
      `\n--- Processing Candidate: ${candidate.name} (Assessment: ${candidate.assessment_id}) ---`,
    );

    // Ensure assessment is completed and has assigned examiner
    await admin
      .from("assessments")
      .update({
        status: "completed",
        outcome: "competent",
        assigned_examiner_id: examinerId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", candidate.assessment_id);

    const questionScorePairs = [
      {
        q: q1,
        score: candidate.scores.q1,
        comment: candidate.comments.q1,
        text: "B: High-voltage contactor isolation verified with test-before-touch.",
      },
      {
        q: q2,
        score: candidate.scores.q2,
        comment: candidate.comments.q2,
        text: "True: Class 0 insulated gloves (1000V rated) must be inspected before every HV use.",
      },
      {
        q: q3,
        score: candidate.scores.q3,
        comment: candidate.comments.q3,
        text: "Verbal response detailing standard procedure for manual service disconnect removal.",
      },
    ];

    for (const item of questionScorePairs) {
      // Upsert candidate_answers
      const { data: existingAnswer } = await admin
        .from("candidate_answers")
        .select("id")
        .eq("assessment_id", candidate.assessment_id)
        .eq("question_id", item.q.id)
        .maybeSingle();

      let answerId = existingAnswer?.id;

      if (!answerId) {
        const { data: newAns, error: ansErr } = await admin
          .from("candidate_answers")
          .insert({
            assessment_id: candidate.assessment_id,
            question_id: item.q.id,
            answer_text: item.text,
            is_correct: true,
            marks_awarded: item.score / 10,
          })
          .select("id")
          .single();

        if (ansErr) {
          console.error(`  Error creating answer for Q ${item.q.id}:`, ansErr);
          continue;
        }
        answerId = newAns.id;
      } else {
        await admin
          .from("candidate_answers")
          .update({
            answer_text: item.text,
            is_correct: true,
            marks_awarded: item.score / 10,
          })
          .eq("id", answerId);
      }

      // Upsert examiner_reviews
      const { data: existingReview } = await admin
        .from("examiner_reviews")
        .select("id")
        .eq("candidate_answer_id", answerId)
        .maybeSingle();

      if (existingReview) {
        await admin
          .from("examiner_reviews")
          .update({
            examiner_id: examinerId,
            decision: "modify_score",
            final_score: item.score,
            comment: item.comment,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id);
      } else {
        await admin.from("examiner_reviews").insert({
          candidate_answer_id: answerId,
          examiner_id: examinerId,
          decision: "modify_score",
          final_score: item.score,
          comment: item.comment,
          reviewed_at: new Date().toISOString(),
        });
      }

      console.log(
        `  Recorded answer & review for ${item.q.question_type}: Score = ${item.score}%`,
      );
    }

    // 3. Trigger the REAL EV Readiness calculation engine!
    console.log(
      `  Triggering calculateEVReadiness("${candidate.assessment_id}")...`,
    );
    await calculateEVReadiness(candidate.assessment_id);
    console.log("  Calculation completed.");
  }

  // 4. Verify results
  console.log("\n=== VERIFYING GENERATED EV READINESS SCORES ===");
  const { data: results, error: resErr } = await admin
    .from("ev_readiness_scores")
    .select(`
      id, assessment_id, overall_score, status, ev_knowledge, hv_safety_awareness, diagnostics, verbal_reasoning, calculation_notes,
      assessments (
        id, ev_readiness_score,
        candidate_profiles (
          id,
          profiles ( full_name )
        )
      )
    `);

  if (resErr) {
    console.error("Error fetching ev_readiness_scores:", resErr);
  } else {
    console.log(`Total EV Readiness Score records: ${results?.length}`);
    for (const r of results || []) {
      const candidateName =
        (r.assessments as any)?.candidate_profiles?.profiles?.full_name ||
        "Unknown";
      console.log(`\nCandidate: ${candidateName}`);
      console.log(`  Overall Score: ${r.overall_score}% | Status: ${r.status}`);
      console.log(
        `  EV Knowledge: ${r.ev_knowledge}% | HV Safety: ${r.hv_safety_awareness}%`,
      );
      console.log(
        `  Diagnostics: ${r.diagnostics}% | Verbal Reasoning: ${r.verbal_reasoning}%`,
      );
      console.log(
        `  Assessment.ev_readiness_score: ${(r.assessments as any)?.ev_readiness_score}%`,
      );
      console.log(`  Notes: ${r.calculation_notes}`);
    }
  }
}

seedEVReadiness().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
