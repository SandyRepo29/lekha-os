/**
 * Schema Index - Re-export all tables and enums
 *
 * Phase 1: Schema relocation (2026-07-12)
 * This file re-exports everything from schema.ts
 *
 * Future phases will extract per-module schemas:
 * - vendor.schema.ts
 * - audit.schema.ts
 * - risk.schema.ts
 * ... etc
 *
 * For now, backward compatibility: all definitions come from schema.ts
 */

export * from './schema';
