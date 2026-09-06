import "server-only";
import { randomUUID } from "node:crypto";

export interface SanitizedErrorResponse {
  error: string;
  correlationId: string;
}

/**
 * Logs detailed error telemetry on the server and returns a safe, user-friendly
 * error message with a unique tracking correlation ID to the client.
 */
export function handleServerError(
  context: string,
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again later."
): SanitizedErrorResponse {
  const correlationId = randomUUID();

  // Extract internal error details
  let errorMessage = "Unknown error";
  let errorStack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (typeof error === "object" && error !== null) {
    errorMessage = JSON.stringify(error);
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  // Server-side only logging with correlation ID for support tracing
  console.error(`[Server Action Error] [CID: ${correlationId}] Context: ${context}`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  return {
    error: `${fallbackMessage} (Reference: ${correlationId.slice(0, 8)})`,
    correlationId,
  };
}
