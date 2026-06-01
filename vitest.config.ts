import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    // Per-file environment overrides use the // @vitest-environment jsdom
    // docblock at the top of each *.test.tsx file (Vitest 4 approach).
    // Exclude Playwright E2E specs — they use @playwright/test, not vitest
    exclude: [
      "tests/e2e/**",
      "tests/e2e/helpers/**",
      "**/node_modules/**",
      "**/.next/**",
    ],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      // Only measure coverage for files that currently have tests.
      // Add more entries as new tests are written.
      include: [
        // Pure functions — 100% covered
        "lib/services/scoring.ts",
        "lib/services/risk-engine.ts",
        "lib/ui/colors.ts",
        "lib/email/templates.ts",
        "lib/constants/assessment-questions.ts",
        // Service layer — key services tested with mocked repos
        "lib/services/vendor-service.ts",
        "lib/services/document-service.ts",
        "lib/services/notification-service.ts",
        // Components with RTL tests
        "components/ui/tabs.tsx",
        "components/ui/status-badge.tsx",
        "components/activity/activity-feed.tsx",
        "components/vendors/compliance-breakdown.tsx",
        "components/vendors/vendor-status.tsx",
      ],
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "lib/db/**",
        "lib/repositories/**",
        "lib/supabase/**",
        "lib/storage/**",
      ],
      // Current thresholds reflect the 13 test files written in Phase 1-3.
      // Targets when suite is complete: lines 80, functions 80, branches 70.
      // Raise these incrementally as more service tests are added.
      thresholds: {
        lines:      65,
        functions:  58,
        branches:   55,
        statements: 65,
      },
    },
    alias: {
      "next/navigation": new URL("./tests/setup/__mocks__/next-navigation.ts", import.meta.url).pathname,
      "next/cache":      new URL("./tests/setup/__mocks__/next-cache.ts",      import.meta.url).pathname,
      "next/server":     new URL("./tests/setup/__mocks__/next-server.ts",     import.meta.url).pathname,
    },
  },
});
