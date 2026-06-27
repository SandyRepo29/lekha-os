/**
 * API route middleware helpers.
 *
 * withLogging() wraps a route handler with:
 *   - Correlation ID propagation (from x-correlation-id header or a fresh ID)
 *   - Request timing
 *   - Structured access log via logApiRequest()
 *
 * Usage in an API route:
 *
 *   import { withLogging } from "@/lib/api/middleware"
 *
 *   export const GET = withLogging(async (req, { correlationId }) => {
 *     // ... handler logic ...
 *     return ok(data)
 *   })
 */

import { logger, generateCorrelationId, logApiRequest } from "@/lib/logger";

export type ApiContext = {
  /** Correlation ID forwarded from proxy.ts or freshly generated. */
  correlationId: string;
};

/**
 * Wrap a Next.js App Router route handler with structured logging and timing.
 *
 * The inner handler receives an ApiContext with the correlationId so it can
 * pass it to ok() / err() as opts.correlationId.
 */
export function withLogging(
  handler: (req: Request, ctx: ApiContext) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const start = Date.now();
    const correlationId =
      req.headers.get("x-correlation-id") ?? generateCorrelationId();

    try {
      const res = await handler(req, { correlationId });
      logApiRequest(
        req.method,
        new URL(req.url).pathname,
        res.status,
        Date.now() - start,
        { correlationId }
      );
      return res;
    } catch (err) {
      logApiRequest(
        req.method,
        new URL(req.url).pathname,
        500,
        Date.now() - start,
        { correlationId, error: String(err) }
      );
      logger.error("unhandled_route_error", {
        correlationId,
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  };
}
