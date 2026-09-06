import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let dbStatus = "unconfigured";
  let dbLatencyMs: number | null = null;

  if (supabaseUrl && anonKey) {
    try {
      const dbStart = Date.now();
      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });
      // Lightweight probe on system settings or public table
      const { error } = await client
        .from("organisations")
        .select("id")
        .limit(1);

      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? `error: ${error.message}` : "healthy";
    } catch (err: any) {
      dbStatus = `unreachable: ${err?.message || "connection error"}`;
    }
  }

  const isHealthy = dbStatus === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "pass" : "degraded",
      timestamp,
      uptimeSec: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      checks: {
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        brevoConfigured: Boolean(process.env.BREVO_API_KEY),
        supabaseConfigured: Boolean(supabaseUrl && anonKey),
      },
      version: "1.0.0",
    },
    { status: statusCode }
  );
}
