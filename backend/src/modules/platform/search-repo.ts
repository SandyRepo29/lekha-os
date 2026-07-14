import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type SearchResult = {
  entity_type: string;
  entity_id: string;
  display_name: string;
  secondary_text: string | null;
  rank: number;
};

export type SavedSearch = {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  query: string;
  entity_types: string[];
  filters: Record<string, unknown>;
  is_shared: boolean;
  result_count: number | null;
  created_at: Date;
};

export async function globalSearch(
  orgId: string,
  query: string,
  opts?: { entityTypes?: string[]; limit?: number }
): Promise<SearchResult[]> {
  const limit = opts?.limit ?? 20;
  const entityTypes = opts?.entityTypes ?? [];

  if (entityTypes.length > 0) {
    const rows = await db.execute<SearchResult>(sql`
      SELECT
        entity_type,
        entity_id,
        display_name,
        secondary_text,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
      FROM search_suggestions
      WHERE organization_id = ${orgId}
        AND search_vector @@ plainto_tsquery('english', ${query})
        AND entity_type = ANY(${entityTypes}::text[])
      ORDER BY rank DESC
      LIMIT ${limit}
    `);
    return rows as unknown as SearchResult[];
  }

  const rows = await db.execute<SearchResult>(sql`
    SELECT
      entity_type,
      entity_id,
      display_name,
      secondary_text,
      ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM search_suggestions
    WHERE organization_id = ${orgId}
      AND search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `);
  return rows as unknown as SearchResult[];
}

export async function upsertSearchSuggestion(params: {
  orgId: string;
  entityType: string;
  entityId: string;
  displayName: string;
  secondaryText?: string;
}): Promise<void> {
  const { orgId, entityType, entityId, displayName, secondaryText } = params;
  await db.execute(sql`
    INSERT INTO search_suggestions (organization_id, entity_type, entity_id, display_name, secondary_text, search_vector)
    VALUES (
      ${orgId},
      ${entityType},
      ${entityId},
      ${displayName},
      ${secondaryText ?? null},
      to_tsvector('english', ${displayName} || ' ' || COALESCE(${secondaryText ?? null}, ''))
    )
    ON CONFLICT (organization_id, entity_type, entity_id)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      secondary_text = EXCLUDED.secondary_text,
      search_vector = to_tsvector('english', EXCLUDED.display_name || ' ' || COALESCE(EXCLUDED.secondary_text, '')),
      updated_at = now()
  `);
}

export async function findSavedSearches(
  orgId: string,
  userId: string
): Promise<SavedSearch[]> {
  const rows = await db.execute<{
    id: string;
    organization_id: string;
    user_id: string;
    name: string;
    query: string;
    entity_types: string[];
    filters: unknown;
    is_shared: boolean;
    result_count: number | null;
    created_at: Date;
  }>(sql`
    SELECT
      id,
      organization_id,
      user_id,
      name,
      query,
      entity_types,
      filters,
      is_shared,
      result_count,
      created_at
    FROM saved_searches
    WHERE organization_id = ${orgId}
      AND (user_id = ${userId} OR is_shared = true)
    ORDER BY created_at DESC
  `);

  return (rows as unknown as typeof rows).map((r) => ({
    ...r,
    filters: (r.filters as Record<string, unknown>) ?? {},
  }));
}

export async function insertSavedSearch(params: {
  orgId: string;
  userId: string;
  name: string;
  query: string;
  entityTypes?: string[];
  filters?: Record<string, unknown>;
  isShared?: boolean;
}): Promise<{ id: string }> {
  const {
    orgId,
    userId,
    name,
    query,
    entityTypes = [],
    filters = {},
    isShared = false,
  } = params;

  const rows = await db.execute<{ id: string }>(sql`
    INSERT INTO saved_searches (organization_id, user_id, name, query, entity_types, filters, is_shared)
    VALUES (
      ${orgId},
      ${userId},
      ${name},
      ${query},
      ${entityTypes}::text[],
      ${JSON.stringify(filters)}::jsonb,
      ${isShared}
    )
    RETURNING id
  `);

  return (rows as unknown as { id: string }[])[0];
}

export async function deleteSavedSearch(
  orgId: string,
  searchId: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM saved_searches
    WHERE id = ${searchId}
      AND organization_id = ${orgId}
  `);
}

export async function insertRecentSearch(params: {
  orgId: string;
  userId: string;
  query: string;
  entityTypes?: string[];
  resultCount?: number;
}): Promise<void> {
  const { orgId, userId, query, entityTypes = [], resultCount } = params;

  await db.execute(sql`
    INSERT INTO recent_searches (organization_id, user_id, query, entity_types, result_count)
    VALUES (
      ${orgId},
      ${userId},
      ${query},
      ${entityTypes}::text[],
      ${resultCount ?? null}
    )
  `);

  // Keep only last 10 per user — delete oldest beyond limit
  await db.execute(sql`
    DELETE FROM recent_searches
    WHERE id IN (
      SELECT id FROM recent_searches
      WHERE organization_id = ${orgId}
        AND user_id = ${userId}
      ORDER BY searched_at DESC
      OFFSET 10
    )
  `);
}

export async function findRecentSearches(
  orgId: string,
  userId: string,
  limit: number = 10
): Promise<{ query: string; entity_types: string[]; searched_at: Date }[]> {
  const rows = await db.execute<{
    query: string;
    entity_types: string[];
    searched_at: Date;
  }>(sql`
    SELECT query, entity_types, searched_at
    FROM recent_searches
    WHERE organization_id = ${orgId}
      AND user_id = ${userId}
    ORDER BY searched_at DESC
    LIMIT ${limit}
  `);

  return rows as unknown as { query: string; entity_types: string[]; searched_at: Date }[];
}
