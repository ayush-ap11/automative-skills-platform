import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateStructuredJson(
  prompt: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<unknown> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const filePart = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType,
    },
  };

  const systemInstruction =
    "You are an expert Australian automotive skills qualification and document extraction engine. " +
    "Return ONLY valid raw JSON matching the requested structure with no surrounding markdown fences, backticks, or explanatory text.";

  const result = await model.generateContent([
    systemInstruction,
    prompt,
    filePart,
  ]);

  const response = await result.response;
  let text = response.text().trim();

  // Defensively strip markdown code fences if model output contains them
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return JSON.parse(text);
}
