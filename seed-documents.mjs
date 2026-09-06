import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const CANDIDATE_DOCS = [
  // 1. Testing User
  {
    candidate_profile_id: "99846d4a-111d-4c0c-bd90-e3cf12dfd201",
    category: "resume",
    storage_path: "99846d4a-111d-4c0c-bd90-e3cf12dfd201/Testing_User_Senior_EV_Diagnostic_CV.pdf",
    file_name: "Testing_User_Senior_EV_Diagnostic_CV.pdf",
    status: "verified",
    is_sensitive: false,
    expiry_date: null,
    ai_extracted_data: {
      candidate_name: "Testing User",
      years_experience: 7,
      primary_skills: ["EV Powertrain Diagnostics", "CAN-bus", "High Voltage Isolation"],
    },
  },
  {
    candidate_profile_id: "99846d4a-111d-4c0c-bd90-e3cf12dfd201",
    category: "ev_training_certificate",
    storage_path: "99846d4a-111d-4c0c-bd90-e3cf12dfd201/Tesla_High_Voltage_Safety_Accreditation_Cert.pdf",
    file_name: "Tesla_High_Voltage_Safety_Accreditation_Cert.pdf",
    status: "verified",
    is_sensitive: false,
    expiry_date: "2027-12-31",
    ai_extracted_data: {
      issuing_body: "Tesla Service Academy",
      qualification: "High Voltage Electrical Safety Certification (Level 3)",
      issue_date: "2024-11-15",
    },
  },
  {
    candidate_profile_id: "99846d4a-111d-4c0c-bd90-e3cf12dfd201",
    category: "job_card",
    storage_path: "99846d4a-111d-4c0c-bd90-e3cf12dfd201/JobCard_JC9042_Inverter_Assembly_Replacement.pdf",
    file_name: "JobCard_JC9042_Inverter_Assembly_Replacement.pdf",
    status: "ai_extracted",
    is_sensitive: false,
    expiry_date: null,
    ai_extracted_data: {
      repair_order: "RO-88219",
      task_description: "Diagnosis and replacement of dual inverter motor drive unit and coolant flush.",
      verified_by_supervisor: true,
    },
  },

  // 2. Ayush Pawar
  {
    candidate_profile_id: "9f811d36-72db-47fe-851f-6925dd9d6df9",
    category: "resume",
    storage_path: "9f811d36-72db-47fe-851f-6925dd9d6df9/Ayush_Pawar_Auto_Electrician_Resume.pdf",
    file_name: "Ayush_Pawar_Auto_Electrician_Resume.pdf",
    status: "verified",
    is_sensitive: false,
    expiry_date: null,
    ai_extracted_data: {
      candidate_name: "Ayush Pawar",
      years_experience: 4,
      specialization: "Automotive Electrical & CAN-bus wiring harness",
    },
  },
  {
    candidate_profile_id: "9f811d36-72db-47fe-851f-6925dd9d6df9",
    category: "safety_training",
    storage_path: "9f811d36-72db-47fe-851f-6925dd9d6df9/SafeWork_NSW_General_WHS_Induction.pdf",
    file_name: "SafeWork_NSW_General_WHS_Induction.pdf",
    status: "pending_review",
    is_sensitive: false,
    expiry_date: "2028-03-20",
    ai_extracted_data: {
      course: "White Card General Construction & Workshop Induction",
      jurisdiction: "SafeWork NSW",
    },
  },
  {
    candidate_profile_id: "9f811d36-72db-47fe-851f-6925dd9d6df9",
    category: "health_fitness",
    storage_path: "9f811d36-72db-47fe-851f-6925dd9d6df9/Medical_Fitness_Hearing_And_Vision_Assessment.pdf",
    file_name: "Medical_Fitness_Hearing_And_Vision_Assessment.pdf",
    status: "verified",
    is_sensitive: true,
    expiry_date: "2027-06-15",
    ai_extracted_data: {
      provider: "Sonic HealthPlus",
      color_vision: "Normal (Ishihara 14/14)",
      hearing_threshold: "Within Safe Trade Limits",
    },
  },

  // 3. New Candidate
  {
    candidate_profile_id: "e8377784-eb76-4e92-84ef-90b0be0420cd",
    category: "resume",
    storage_path: "e8377784-eb76-4e92-84ef-90b0be0420cd/Candidate_Trade_Apprentice_CV.pdf",
    file_name: "Candidate_Trade_Apprentice_CV.pdf",
    status: "pending_review",
    is_sensitive: false,
    expiry_date: null,
    ai_extracted_data: {
      candidate_name: "New Candidate",
      current_role: "Light Vehicle Mechanical Technician",
      years_experience: 5,
    },
  },
  {
    candidate_profile_id: "e8377784-eb76-4e92-84ef-90b0be0420cd",
    category: "ev_training_certificate",
    storage_path: "e8377784-eb76-4e92-84ef-90b0be0420cd/AURTTA021_Diagnostic_Complex_Faults_Evidence.pdf",
    file_name: "AURTTA021_Diagnostic_Complex_Faults_Evidence.pdf",
    status: "ai_extracted",
    is_sensitive: false,
    expiry_date: "2028-01-01",
    ai_extracted_data: {
      unit_code: "AURTTA021",
      unit_title: "Diagnose complex system faults",
      rto_provider: "TAFE NSW",
    },
  },
  {
    candidate_profile_id: "e8377784-eb76-4e92-84ef-90b0be0420cd",
    category: "job_card",
    storage_path: "e8377784-eb76-4e92-84ef-90b0be0420cd/Workshop_JobCard_HV_Battery_Drop_Inspection.pdf",
    file_name: "Workshop_JobCard_HV_Battery_Drop_Inspection.pdf",
    status: "verified",
    is_sensitive: false,
    expiry_date: null,
    ai_extracted_data: {
      procedure: "High voltage battery de-energisation and contactor weld test",
      result: "Passed zero potential verification",
    },
  },
];

async function run() {
  console.log("=== SEEDING REALISTIC EVIDENCE DOCUMENTS FOR DEMO CANDIDATES ===");

  const candidateIds = [
    "99846d4a-111d-4c0c-bd90-e3cf12dfd201",
    "9f811d36-72db-47fe-851f-6925dd9d6df9",
    "e8377784-eb76-4e92-84ef-90b0be0420cd",
  ];

  // Clean existing demo docs to prevent duplicates
  await supabase.from("documents").delete().in("candidate_profile_id", candidateIds);

  const { data, error } = await supabase
    .from("documents")
    .insert(CANDIDATE_DOCS)
    .select("id, candidate_profile_id, category, file_name, status, is_sensitive");

  if (error) {
    console.error("Error inserting documents:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data?.length} documents across the 3 demo candidates.`);
  for (const d of data || []) {
    console.log(`- [${d.status.toUpperCase()}] ${d.category}: ${d.file_name} (Sensitive: ${d.is_sensitive})`);
  }
}

run().catch((err) => {
  console.error("Failed to seed documents:", err);
  process.exit(1);
});
