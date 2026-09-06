import "server-only";
import { headers } from "next/headers";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  error?: string;
}

/**
 * Checks in-memory sliding window rate limits for an action key and client IP.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    memoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTimeMs: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: record.resetTime,
      error: `Too many attempts. Please try again in ${retryAfterSec} seconds.`,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTimeMs: record.resetTime,
  };
}

/**
 * Extracts best-effort client IP from Next.js server headers.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}
