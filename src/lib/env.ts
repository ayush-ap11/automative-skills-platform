import "server-only";

export interface AppEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GEMINI_API_KEY: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  NEXT_PUBLIC_APP_URL: string;
}

/**
 * Validates critical environment variables and fails loudly on startup if any are missing.
 */
export function validateEnv(): AppEnv {
  const errors: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required to connect to the database.");
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for client authentication.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceRoleKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is required for administrative operations.");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    errors.push("GEMINI_API_KEY is required for AI document extraction and verbal analysis.");
  }

  if (errors.length > 0) {
    const errorBanner = [
      "\n=======================================================",
      "CRITICAL CONFIGURATION ERROR: Missing Environment Variables",
      "=======================================================",
      ...errors.map((e) => `  - ${e}`),
      "Please populate the required variables in your .env.local file.",
      "Refer to .env.example for required keys and format.",
      "=======================================================\n",
    ].join("\n");

    console.error(errorBanner);
    throw new Error(`Production startup aborted: ${errors.length} critical environment variables are missing.`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey!,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey!,
    GEMINI_API_KEY: geminiKey!,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "AutoSkills Platform",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
}
