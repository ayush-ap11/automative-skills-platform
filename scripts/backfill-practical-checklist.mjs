import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const UPDATES = [
  {
    id: "dc263fde-0847-4e91-991c-ab6b8808f707", // Ayush Pawar
    checklist: [
      {
        id: "item-1",
        label: "Identified HV components & PPE inspection",
        rating: "competent",
        comment: "Inspected Class 0 1000V rated insulated gloves and full face arc shield for physical damage and expiration date."
      },
      {
        id: "item-2",
        label: "Applied isolation procedure & MSD lockout",
        rating: "competent",
        comment: "Removed Manual Service Disconnect (MSD) plug and correctly applied lockout hasp with individual safety padlock."
      },
      {
        id: "item-3",
        label: "Zero-potential verification (1000V CAT III meter)",
        rating: "competent",
        comment: "Tested CAT III 1000V meter on proving unit before and after measurement. Verified zero volts (< 0.5V DC) across HV inverter DC bus terminals."
      },
      {
        id: "item-4",
        label: "Completed de-energisation documentation",
        rating: "competent",
        comment: "Accurately completed workshop de-energisation permit, sign-off log sheet, and displayed HV danger perimeter signage."
      }
    ]
  },
  {
    id: "c579b3d2-d8a4-408d-ba86-487f5b5dc888", // Ayush Pawar (Marcus Vance assigned)
    checklist: [
      {
        id: "item-1",
        label: "Identified HV components & inspected CAT III/IV PPE",
        rating: "competent",
        comment: "Inspected 1000V insulated gloves and arc shield in accordance with AS 5732 workshop safety standards."
      },
      {
        id: "item-2",
        label: "Lockout/Tagout applied to Manual Service Disconnect (MSD)",
        rating: "competent",
        comment: "Disconnected 12V auxiliary battery ground first, followed by manual disconnect plug and lockout tag."
      },
      {
        id: "item-3",
        label: "Proving unit test performed on CAT III 1000V meter",
        rating: "competent",
        comment: "Proved meter functional against known calibration source before and after touching HV test points."
      },
      {
        id: "item-4",
        label: "Zero potential verified (< 5V DC across HV terminals)",
        rating: "competent",
        comment: "Observed 0.0V DC across contactor terminals, meeting safe zero potential condition."
      }
    ]
  },
  {
    id: "3f668334-aa05-4d2c-8cfc-7a45691ba1bf", // Testing User
    checklist: [
      {
        id: "item-1",
        label: "Identified HV components & PPE inspection",
        rating: "highly_competent",
        comment: "Flawless inspection of 1000V PPE, leather outer protectors, safety glasses, and calibration stickers on diagnostic tools."
      },
      {
        id: "item-2",
        label: "Applied isolation procedure & MSD lockout",
        rating: "highly_competent",
        comment: "Methodically followed OEM workshop manual. Isolated 12V supply, removed MSD, and secured lockout tagout with personal key."
      },
      {
        id: "item-3",
        label: "Zero-potential verification (1000V CAT III meter)",
        rating: "highly_competent",
        comment: "Demonstrated live-dead-live testing method flawlessly with CAT III 1000V multimeter. Verified zero volts on all phases."
      },
      {
        id: "item-4",
        label: "Completed de-energisation documentation",
        rating: "highly_competent",
        comment: "Completed Australian standard WHS isolation permit and safety clearance log with full technical precision."
      }
    ]
  },
  {
    id: "8a32e08e-39d7-4f02-9090-c7a2fba7c3af", // New Candidate
    checklist: [
      {
        id: "item-1",
        label: "Identified HV components & PPE inspection",
        rating: "highly_competent",
        comment: "Demonstrated thorough pre-use pneumatic air-leak test on 1000V rated gloves and donned arc-rated visor."
      },
      {
        id: "item-2",
        label: "Applied isolation procedure & MSD lockout",
        rating: "highly_competent",
        comment: "Depowered vehicle high-voltage circuit and placed MSD in secure lockbox with warning tag."
      },
      {
        id: "item-3",
        label: "Zero-potential verification (1000V CAT III meter)",
        rating: "highly_competent",
        comment: "Followed 3-point testing rule on calibrated proving unit. Confirmed absence of residual voltage across capacitors."
      },
      {
        id: "item-4",
        label: "Completed de-energisation documentation",
        rating: "highly_competent",
        comment: "Filed signed WHS isolation checklist and workshop boundary demarcation signs."
      }
    ]
  }
];

async function run() {
  console.log("=== BACKFILLING REALISTIC CHECKLIST ITEMS FOR PRACTICAL OBSERVATIONS ===");
  for (const upd of UPDATES) {
    const { data, error } = await supabase
      .from("practical_observations")
      .update({ checklist: upd.checklist })
      .eq("id", upd.id)
      .select("id, task_title, overall_rating");

    if (error) {
      console.error(`Failed to update ${upd.id}:`, error);
    } else {
      console.log(`✓ Updated observation ${upd.id} (${data?.[0]?.task_title})`);
    }
  }
  console.log("Backfill completed successfully.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
