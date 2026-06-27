/**
 * JSON response helpers for the v1 REST API.
 *
 * All responses follow the envelope:
 *   Success:  { data: T, meta?: PaginationMeta }
 *   Error:    { error: string }
 */

import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/providers/rate-limit";
import { logger } from "@/lib/logger";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ResponseOpts = {
  correlationId?: string;
};

/** Successful response. */
export function ok<T>(
  data: T,
  status = 200,
  meta?: PaginationMeta,
  opts?: ResponseOpts
): NextResponse {
  const res = NextResponse.json(
    meta ? { data, meta } : { data },
    { status }
  );
  if (opts?.correlationId) {
    res.headers.set("X-Correlation-ID", opts.correlationId);
  }
  return res;
}

/** Error response. */
export function err(message: string, status: number, opts?: ResponseOpts): NextResponse {
  if (status >= 500) {
    logger.error("api_error", { message, status });
  }
  const res = NextResponse.json({ error: message }, { status });
  if (opts?.correlationId) {
    res.headers.set("X-Correlation-ID", opts.correlationId);
  }
  return res;
}

/** Return elapsed milliseconds since a start timestamp from Date.now(). */
export function withTiming(startMs: number): number {
  return Date.now() - startMs;
}

/** Add rate-limit headers to a response. */
export function withRateLimitHeaders(
  response: NextResponse,
  rl: RateLimitResult
): NextResponse {
  const resetSeconds = Math.ceil(rl.resetAt / 1000);
  response.headers.set("X-RateLimit-Limit", String(rl.limit));
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  response.headers.set("X-RateLimit-Reset", String(resetSeconds));
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
}

/** Build pagination meta from raw counts. */
export function buildMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** Standard validation error — joins multiple field errors into one 400 response. */
export function validationErr(errors: string[]): NextResponse {
  return err(`Validation failed: ${errors.join("; ")}`, 400);
}
