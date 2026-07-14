import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { DomainError } from "@/lib/services/errors";

const DEFAULTS: Record<string, unknown> = {
  "notification.email.enabled": true,
  "notification.digest.frequency": "weekly",
  "notification.digest.day": "monday",
  "export.max_rows": 10000,
  "export.include_branding": true,
  "search.min_query_length": 2,
  "search.max_results": 50,
  "tasks.default_sla.critical": 4,
  "tasks.default_sla.high": 24,
  "tasks.default_sla.medium": 72,
  "tasks.default_sla.low": 168,
  "comments.max_length": 5000,
  "tags.max_per_entity": 20,
  "attachments.max_size_mb": 50,
  "attachments.allowed_types": ["pdf", "docx", "xlsx", "png", "jpg", "csv", "zip"],
  "workflow.max_triggers": 50,
  "ai.summaries.cache_hours": 24,
  "audit_trail.retention_days": 365,
};

export async function getSetting<T = unknown>(orgId: string, key: string): Promise<T> {
  if (!orgId || !key) {
    throw new DomainError("orgId and key are required");
  }

  const rows = await db.execute(
    sql`SELECT value FROM platform_settings WHERE organization_id = ${orgId} AND key = ${key} LIMIT 1`
  );

  if (rows.length > 0) {
    const row = rows[0] as { value: unknown };
    return row.value as T;
  }

  return DEFAULTS[key] as T;
}

export async function getSettings(
  orgId: string,
  keys?: string[]
): Promise<Record<string, unknown>> {
  if (!orgId) {
    throw new DomainError("orgId is required");
  }

  let rows: Array<{ key: string; value: unknown }>;

  if (keys && keys.length > 0) {
    rows = (await db.execute(
      sql`SELECT key, value FROM platform_settings WHERE organization_id = ${orgId} AND key = ANY(${keys})`
    )) as Array<{ key: string; value: unknown }>;
  } else {
    rows = (await db.execute(
      sql`SELECT key, value FROM platform_settings WHERE organization_id = ${orgId}`
    )) as Array<{ key: string; value: unknown }>;
  }

  const orgOverrides: Record<string, unknown> = {};
  for (const row of rows) {
    orgOverrides[row.key] = row.value;
  }

  const filteredDefaults: Record<string, unknown> = {};
  if (keys && keys.length > 0) {
    for (const k of keys) {
      if (k in DEFAULTS) {
        filteredDefaults[k] = DEFAULTS[k];
      }
    }
  } else {
    Object.assign(filteredDefaults, DEFAULTS);
  }

  return { ...filteredDefaults, ...orgOverrides };
}

export async function setSetting(
  orgId: string,
  key: string,
  value: unknown,
  updatedBy?: string
): Promise<void> {
  if (!orgId) throw new DomainError("orgId is required");
  if (!key || key.trim() === "") throw new DomainError("key must not be empty");
  if (value === undefined) throw new DomainError("value must not be undefined");

  const valueJson = JSON.stringify(value);
  const updatedByVal = updatedBy ?? null;

  await db.execute(
    sql`INSERT INTO platform_settings (organization_id, key, value, updated_by, updated_at)
        VALUES (${orgId}, ${key}, ${valueJson}::jsonb, ${updatedByVal}, now())
        ON CONFLICT (organization_id, key)
        DO UPDATE SET value = ${valueJson}::jsonb,
                      updated_by = ${updatedByVal},
                      updated_at = now()`
  );
}

export async function resetSetting(orgId: string, key: string): Promise<void> {
  if (!orgId) throw new DomainError("orgId is required");
  if (!key || key.trim() === "") throw new DomainError("key must not be empty");

  await db.execute(
    sql`DELETE FROM platform_settings WHERE organization_id = ${orgId} AND key = ${key}`
  );
}

export async function getAllOrgSettings(
  orgId: string
): Promise<{ key: string; value: unknown; is_default: boolean; description?: string }[]> {
  if (!orgId) throw new DomainError("orgId is required");

  const rows = (await db.execute(
    sql`SELECT key, value FROM platform_settings WHERE organization_id = ${orgId}`
  )) as Array<{ key: string; value: unknown }>;

  const orgOverrides: Record<string, unknown> = {};
  for (const row of rows) {
    orgOverrides[row.key] = row.value;
  }

  return Object.keys(DEFAULTS).map((key) => {
    const hasOverride = key in orgOverrides;
    return {
      key,
      value: hasOverride ? orgOverrides[key] : DEFAULTS[key],
      is_default: !hasOverride,
    };
  });
}
