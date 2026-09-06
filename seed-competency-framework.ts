import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

export const COMPETENCY_UNITS = [
  {
    unit_code: "AURETH101",
    unit_title: "Depower and reinitialise battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Battery Electric Vehicles",
    safety_critical: true,
  },
  {
    unit_code: "AURETH103",
    unit_title:
      "Diagnose and repair high voltage rechargeable energy storage systems in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Energy Storage Systems",
    safety_critical: true,
  },
  {
    unit_code: "AURETH104",
    unit_title:
      "Diagnose and repair traction motor speed control systems in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Traction Motors & Control",
    safety_critical: true,
  },
  {
    unit_code: "AURETH105",
    unit_title:
      "Diagnose and repair high voltage traction motors in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Traction Motors & Control",
    safety_critical: true,
  },
  {
    unit_code: "AURETH106",
    unit_title:
      "Diagnose and repair auxiliary motors and associated components in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Auxiliary Systems",
    safety_critical: true,
  },
  {
    unit_code: "AURETH107",
    unit_title:
      "Diagnose and repair system instrumentation and safety interlocks in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Safety Interlocks & Instrumentation",
    safety_critical: true,
  },
  {
    unit_code: "AURETH108",
    unit_title:
      "Diagnose and repair HVAC and rechargeable energy storage cooling systems in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Thermal Management",
    safety_critical: true,
  },
  {
    unit_code: "AURETH109",
    unit_title:
      "Diagnose and repair DC to DC converters in battery electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Power Electronics",
    safety_critical: true,
  },
  {
    unit_code: "AURETH110",
    unit_title:
      "Diagnose and repair high voltage rechargeable energy storage systems in hybrid electric vehicles",
    skill_set: "EV/HV",
    competency_area: "Hybrid Electric Vehicles",
    safety_critical: true,
  },
  {
    unit_code: "AURETR052",
    unit_title: "Apply knowledge of Advanced Driver Assistance Systems (ADAS)",
    skill_set: "Mechanical/Electrical",
    competency_area: "ADAS",
    safety_critical: false,
  },
  {
    unit_code: "AURETR054",
    unit_title:
      "Diagnose and repair Advanced Driver Assistance Systems (ADAS) and components in vehicles",
    skill_set: "Mechanical/Electrical",
    competency_area: "ADAS",
    safety_critical: false,
  },
  {
    unit_code: "AURETR125",
    unit_title: "Test, charge and replace batteries and jump-start vehicles",
    skill_set: "Mechanical/Electrical",
    competency_area: "Electrical & Batteries",
    safety_critical: false,
  },
  {
    unit_code: "AURETU106",
    unit_title: "Diagnose complex faults in air conditioning and HVAC systems",
    skill_set: "Mechanical/Electrical",
    competency_area: "Air Conditioning & HVAC",
    safety_critical: false,
  },
  {
    unit_code: "AURTTA021",
    unit_title: "Diagnose complex system faults",
    skill_set: "Mechanical/Electrical",
    competency_area: "Diagnostics",
    safety_critical: false,
  },
];

const NATIONAL_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

async function seedCompetencyFramework() {
  console.log("=== SEEDING AUR RELEASE 9.0 COMPETENCY FRAMEWORK ===");

  const { data: orgs, error: orgErr } = await supabase
    .from("organisations")
    .select("id, name");

  if (orgErr || !orgs || orgs.length === 0) {
    console.error("Could not fetch organisations:", orgErr);
    process.exit(1);
  }

  console.log(`Found ${orgs.length} organisation(s) to seed.`);

  let totalInserted = 0;

  for (const org of orgs) {
    console.log(`\nProcessing organisation: ${org.name} (${org.id})`);

    // Clean up existing units for this org to prevent duplicates
    const unitCodes = COMPETENCY_UNITS.map((u) => u.unit_code);
    await supabase
      .from("competency_framework")
      .delete()
      .eq("organisation_id", org.id)
      .in("unit_code", unitCodes);

    const rowsToInsert = COMPETENCY_UNITS.map((u) => ({
      organisation_id: org.id,
      unit_code: u.unit_code,
      unit_title: u.unit_title,
      skill_set: u.skill_set,
      competency_area: u.competency_area,
      version: "AUR Release 9.0",
      effective_date: "2026-01-01",
      state_applicability: NATIONAL_STATES,
      safety_critical: u.safety_critical,
      assessment_criteria: u.safety_critical
        ? "Safety Critical: Strict HV isolation, PPE compliance, and zero-potential verification required."
        : "Standard workshop diagnostic and compliance demonstration.",
      evidence_requirements:
        "Direct practical observation, verbal safety demonstration, and underpinning knowledge assessment.",
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("competency_framework")
      .insert(rowsToInsert)
      .select("id, unit_code, unit_title, safety_critical");

    if (insErr) {
      console.error(`Error inserting units for org ${org.name}:`, insErr);
    } else {
      console.log(`  Successfully inserted ${inserted?.length} units.`);
      totalInserted += inserted?.length || 0;
    }
  }

  console.log(`\n✓ Seeding complete. Total units inserted: ${totalInserted}`);
  console.log("\nInserted Unit Codes Summary:");
  COMPETENCY_UNITS.forEach((u, i) => {
    console.log(
      `  ${i + 1}. [${u.unit_code}] ${u.unit_title} | Skill Set: ${u.skill_set} | Safety Critical: ${u.safety_critical}`,
    );
  });
}

seedCompetencyFramework().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
