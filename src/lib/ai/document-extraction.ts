import "server-only";
import { generateStructuredJson } from "./gemini";

const NON_EXTRACTABLE_CATEGORIES = new Set([
  "health_fitness",
  "eye_test",
  "safety_training",
  "manufacturer_training",
  "other",
]);

const PROMPTS: Record<string, string> = {
  resume: `Analyze this resume and extract automotive candidate career data. Return a JSON object with:
{
  "years_experience": number or null,
  "roles": string[],
  "automotive_brands": string[],
  "vehicle_types": string[],
  "technical_skills": string[],
  "ev_experience": boolean,
  "diagnostic_experience": boolean,
  "certifications": string[],
  "employment_timeline": [
    { "employer": string, "role": string, "start": string, "end": string }
  ]
}`,

  job_card: `Analyze this automotive repair job card / work order and extract repair information. Return a JSON object with:
{
  "vehicle": string,
  "vehicle_type": string,
  "job_performed": string,
  "diagnostic_issue": string,
  "repair_performed": string,
  "parts_replaced": string[],
  "complexity": string,
  "ev_hv_related": boolean,
  "safety_procedures_noted": boolean,
  "date": string
}`,

  certificate: `Analyze this automotive qualification or training certificate. Return a JSON object with:
{
  "qualification": string,
  "unit_code": string,
  "training_provider": string,
  "issue_date": string,
  "expiry_date": string or null,
  "skill_area": string
}`,
};

export async function extractDocumentData(
  category: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<Record<string, unknown> | null> {
  if (NON_EXTRACTABLE_CATEGORIES.has(category)) {
    return null;
  }

  let prompt: string | null = null;
  if (category === "resume") {
    prompt = PROMPTS.resume;
  } else if (category === "job_card") {
    prompt = PROMPTS.job_card;
  } else if (
    category === "qualification_certificate" ||
    category === "training_certificate" ||
    category === "ev_training_certificate"
  ) {
    prompt = PROMPTS.certificate;
  }

  if (!prompt) {
    return null;
  }

  try {
    const data = await generateStructuredJson(prompt, fileBuffer, mimeType);
    if (typeof data === "object" && data !== null) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch (err) {
    console.error(`[Document AI Extraction Error] Category: ${category}`, err);
    return null;
  }
}
