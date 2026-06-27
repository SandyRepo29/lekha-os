/**
 * API input validation helpers using Zod.
 * Import parseBody into POST/PUT/PATCH route handlers to validate request bodies.
 */

import { z } from "zod";
import { err } from "./response";

export { z };

/**
 * Parse and validate a request body against a Zod schema.
 * Returns [data, null] on success or [null, Response] on failure.
 *
 * Usage:
 *   const [body, validationError] = await parseBody(request, MySchema)
 *   if (validationError) return validationError
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<[T, null] | [null, Response]> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const messages = result.error.errors
        .map((e) => `${e.path.join(".") || "body"}: ${e.message}`)
        .join("; ");
      return [null, err(`Validation failed: ${messages}`, 400)];
    }
    return [result.data, null];
  } catch {
    return [null, err("Invalid JSON body", 400)];
  }
}

/** Common reusable schemas */

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const UuidSchema = z.string().uuid("Invalid ID format");

/** Strip HTML tags and trim whitespace from a string. */
export function sanitizeString(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}
