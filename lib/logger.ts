/**
 * Structured JSON logger for AUDT — Vercel-compatible, zero-dependency.
 *
 * All output is JSON on a single line so Vercel log drain / Cloud Logging
 * can parse each entry as a structured record.
 *
 * IMPORTANT: No Next.js imports here — this module is imported by both
 * Edge (proxy.ts) and Node.js (API routes, services) runtimes.
 */

type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

function log(level: LogLevel, msg: string, ctx?: LogContext): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: LogContext) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
};

// ─── Correlation ID ───────────────────────────────────────────────────────────

/**
 * Generate a short, URL-safe correlation ID.
 * Not cryptographically unique — purely for log tracing within a session.
 * Format: <9-char base-36 random> + <base-36 timestamp>  (~17 chars total)
 */
export function generateCorrelationId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Log a server action invocation.
 * Call at the top of every server action after requireUser().
 */
export function logAction(
  action: string,
  orgId: string,
  userId: string,
  extra?: LogContext
): void {
  logger.info(action, { orgId, userId, ...extra });
}

/**
 * Log an API request/response cycle.
 * Typically called from withLogging() in lib/api/middleware.ts.
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  ctx?: LogContext
): void {
  logger.info("api_request", {
    method,
    path,
    status: statusCode,
    duration_ms: durationMs,
    ...ctx,
  });
}

/**
 * Log an error with message + stack.
 * Accepts any caught value (Error | unknown).
 */
export function logError(err: unknown, ctx?: LogContext): void {
  const msg   = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack   : undefined;
  logger.error("error", { msg, stack, ...ctx });
}
