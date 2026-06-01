import { vi } from "vitest";

export const NextResponse = {
  json: vi.fn((data: unknown, init?: ResponseInit) => ({
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    json: async () => data,
  })),
  next:     vi.fn(),
  redirect: vi.fn(),
};
