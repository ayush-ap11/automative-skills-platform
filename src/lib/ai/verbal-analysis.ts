import "server-only";
import { generateStructuredJson } from "./gemini";

export interface VerbalAnalysisResult {
  transcript: string;
  transcriptConfidence: number;
  technicalScore: number;
  safetyScore: number;
  diagnosticReasoningScore: number;
  communicationScore: number;
  completenessScore: number;
  provisionalScore: number;
  criticalSafetyFlag: boolean;
  flagReason: string | null;
  confidenceLevel: number;
  modelVersion: string;
}

export async function analyzeVerbalAnswer(
  audioBuffer: Buffer,
  mimeType: string,
  questionText: string,
  safetyCritical: boolean,
  marks: number
): Promise<VerbalAnalysisResult | null> {
  const safetyDirective = safetyCritical
    ? 'Because safetyCritical is TRUE, explicitly check if candidate addressed electrical isolation, zero-energy verification, PPE, and safe workshop procedures. If a safety-critical step was omitted or mishandled, set "critical_safety_flag": true and provide a concise one-sentence "flag_reason". Otherwise set "critical_safety_flag": false and "flag_reason": null.'
    : 'Set "critical_safety_flag": false and "flag_reason": null.';

  const prompt = `You are an expert Australian automotive vocational examiner evaluating a candidate's spoken assessment answer.

Question: "${questionText}"
Marks Available: ${marks}
Safety Critical: ${safetyCritical ? "YES" : "NO"}

Listen to the audio and return a JSON object with:
1. "transcript": verbatim transcription of candidate speech.
2. "transcript_confidence": float 0.0 to 1.0 reflecting transcription certainty.
3. Scores (0-100 integers):
   - "technical_score": technical correctness and trade terminology.
   - "safety_score": workshop and WHS safety compliance.
   - "diagnostic_reasoning_score": structured diagnostic and problem-solving flow.
   - "communication_score": clarity and articulation.
   - "completeness_score": thoroughness in answering the prompt.
4. "provisional_score": average of the 5 scores (0-100).
5. Safety check: ${safetyDirective}
6. "confidence_level": integer 0-100 reflecting overall assessment confidence.

JSON Schema:
{
  "transcript": string,
  "transcript_confidence": number,
  "technical_score": number,
  "safety_score": number,
  "diagnostic_reasoning_score": number,
  "communication_score": number,
  "completeness_score": number,
  "provisional_score": number,
  "critical_safety_flag": boolean,
  "flag_reason": string or null,
  "confidence_level": number
}`;

  try {
    const raw = (await generateStructuredJson(
      prompt,
      audioBuffer,
      mimeType || "audio/webm"
    )) as Record<string, unknown> | null;

    if (!raw || typeof raw !== "object") return null;

    return {
      transcript: String(raw.transcript || ""),
      transcriptConfidence: Number(raw.transcript_confidence ?? 0.9),
      technicalScore: Math.round(Number(raw.technical_score || 0)),
      safetyScore: Math.round(Number(raw.safety_score || 0)),
      diagnosticReasoningScore: Math.round(Number(raw.diagnostic_reasoning_score || 0)),
      communicationScore: Math.round(Number(raw.communication_score || 0)),
      completenessScore: Math.round(Number(raw.completeness_score || 0)),
      provisionalScore: Math.round(Number(raw.provisional_score || 0)),
      criticalSafetyFlag: Boolean(raw.critical_safety_flag),
      flagReason: raw.flag_reason ? String(raw.flag_reason) : null,
      confidenceLevel: Math.round(Number(raw.confidence_level || 85)),
      modelVersion: "gemini-1.5-flash",
    };
  } catch (err) {
    console.error("[Verbal AI Analysis Error]", err);
    return null;
  }
}
