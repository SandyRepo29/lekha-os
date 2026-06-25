/**
 * JSON response helpers for the v1 REST API.
 *
 * All responses follow the envelope:
 *   Success:  { data: T, meta?: PaginationMeta }
 *   Error:    { error: string }
 */

import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/providers/rate-limit";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Successful response. */
export function ok<T>(
  data: T,
  status = 200,
  meta?: PaginationMeta
): NextResponse {
  return NextResponse.json(
    meta ? { data, meta } : { data },
    { status }
  );
}

/** Error response. */
export function err(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
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
