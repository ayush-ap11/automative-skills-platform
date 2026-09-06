import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const REQUIREMENTS = [
  // NSW
  {
    state: "NSW",
    applies_to: "SafeWork NSW / WHS Regulation 2017",
    requirement_text: "Mandatory high-voltage isolation, lock-out/tag-out (LOTO) protocols, and zero-potential verification using proving units prior to touching EV traction circuits.",
  },
  {
    state: "NSW",
    applies_to: "NSW Fair Trading - Motor Dealers & Repairers Act 2013",
    requirement_text: "Technicians performing mechanical and high-voltage repairs must hold an endorsed tradesperson certificate or accredited micro-credential.",
  },
  {
    state: "NSW",
    applies_to: "SafeWork NSW Automotive Industry Guidelines",
    requirement_text: "Workshop bays designated for EV servicing must maintain a 3-metre exclusion perimeter, insulated rescue hook, and Class 0 (1000V) PPE kit.",
  },

  // VIC
  {
    state: "VIC",
    applies_to: "WorkSafe Victoria - EV Servicing Guidance",
    requirement_text: "Employers must ensure technicians working on battery electric vehicles receive documented competence training on high-voltage battery disconnects and emergency rescue.",
  },
  {
    state: "VIC",
    applies_to: "Consumer Affairs Victoria / Business Licensing Authority",
    requirement_text: "Motor vehicle repair operations must register licensed personnel qualified under the relevant AUR training package units.",
  },
  {
    state: "VIC",
    applies_to: "Occupational Health & Safety Regulations 2017",
    requirement_text: "Establishment of safe work systems for handling damaged or thermally compromised high-voltage lithium-ion traction batteries.",
  },

  // QLD
  {
    state: "QLD",
    applies_to: "Electrical Safety Office (ESO) Queensland",
    requirement_text: "High-voltage vehicle systems exceeding 60V DC / 30V AC RMS require strict adherence to Queensland Electrical Safety Regulation and certified isolation verification.",
  },
  {
    state: "QLD",
    applies_to: "Queensland Office of Fair Trading",
    requirement_text: "Motor vehicle repairers must verify trade qualifications and ensure all safety-critical diagnostics conform to national training package AUR Release 9.0.",
  },
  {
    state: "QLD",
    applies_to: "WorkSafe QLD - Automotive Workshop Safety Code",
    requirement_text: "Provision of calibrated CAT III / CAT IV 1000V multimeters and visual safety barriers during all live or de-energisation procedures.",
  },

  // WA
  {
    state: "WA",
    applies_to: "WorkSafe WA - WHS General Regulations 2022",
    requirement_text: "Safe work method statements (SWMS) required for all high-voltage propulsion diagnostics and battery enclosure removals in automotive service premises.",
  },
  {
    state: "WA",
    applies_to: "Department of Mines, Industry Regulation and Safety (DMIRS)",
    requirement_text: "Licensed motor vehicle repairers must hold current competency records for high-voltage and hybrid energy storage repair.",
  },

  // SA
  {
    state: "SA",
    applies_to: "SafeWork SA - Electric Vehicle Servicing Protocol",
    requirement_text: "Mandatory compliance with WHS Regulations 2012 regarding electrical safety, battery quenching procedures, and certified eye/face flash protection.",
  },
  {
    state: "SA",
    applies_to: "Consumer and Business Services (CBS) SA",
    requirement_text: "Automotive service premises must maintain verified technician credentials before signing off on roadworthy compliance certificates.",
  },

  // TAS
  {
    state: "TAS",
    applies_to: "WorkSafe Tasmania - Electrical Safety Regulations",
    requirement_text: "Adherence to national codes of practice for managing electrical risk in vehicle repair, including documented isolation logs for hybrid and EV units.",
  },
  {
    state: "TAS",
    applies_to: "Consumer, Building and Occupational Services (CBOS)",
    requirement_text: "Automotive trade licensing standard requires evidence of continuous professional development in electric propulsion diagnostics.",
  },

  // ACT
  {
    state: "ACT",
    applies_to: "WorkSafe ACT - High-Voltage Automotive Protocols",
    requirement_text: "Mandatory implementation of Safe Work Method Statements (SWMS) for high-voltage battery service, and installation of workshop automated external defibrillators (AED).",
  },
  {
    state: "ACT",
    applies_to: "Access Canberra - Fair Trading Compliance",
    requirement_text: "Automotive workshops must record technician qualifications mapped to AUR Release 9.0 standard before offering commercial EV maintenance.",
  },

  // NT
  {
    state: "NT",
    applies_to: "NT WorkSafe - Motor Vehicle Repair Codes",
    requirement_text: "Implementation of thermal risk controls, tropical battery ventilation requirements, and verified zero-energy state before servicing EV powertrains.",
  },
  {
    state: "NT",
    applies_to: "Northern Territory Consumer Affairs",
    requirement_text: "Motor vehicle repairers must ensure technicians hold formal certification for specialized vehicle electrical and ADAS calibration systems.",
  },
];

async function seed() {
  console.log("=== SEEDING STATE COMPLIANCE REQUIREMENTS ===");

  // Delete existing to avoid duplicates
  const { error: delErr } = await supabase.from("state_requirements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    console.warn("Notice during cleanup:", delErr.message);
  }

  const { data, error } = await supabase
    .from("state_requirements")
    .insert(REQUIREMENTS)
    .select("id, state, applies_to");

  if (error) {
    console.error("Insert error:", error);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data?.length} state requirement rows across all 8 states.`);
  const counts = {};
  for (const r of data || []) {
    counts[r.state] = (counts[r.state] || 0) + 1;
  }
  console.log("Counts per state:", counts);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
