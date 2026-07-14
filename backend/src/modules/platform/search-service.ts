import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  globalSearch,
  upsertSearchSuggestion,
  findSavedSearches,
  insertSavedSearch,
  deleteSavedSearch as repoDeleteSavedSearch,
  insertRecentSearch,
  findRecentSearches,
} from "@/backend/src/modules/platform/search-repo";

export type { SearchResult } from "@/backend/src/modules/platform/search-repo";
import type { SearchResult, SavedSearch } from "@/backend/src/modules/platform/search-repo";

export async function search(
  orgId: string,
  query: string,
  opts?: { entityTypes?: string[]; limit?: number }
): Promise<{
  results: SearchResult[];
  query: string;
  total: number;
  entityTypes: string[];
}> {
  const entityTypes = opts?.entityTypes ?? [];
  const results = await globalSearch(orgId, query, opts);

  // Fire-and-forget recent search record
  insertRecentSearch({
    orgId,
    userId: "",
    query,
    entityTypes,
    resultCount: results.length,
  }).catch(() => {});

  return {
    results,
    query,
    total: results.length,
    entityTypes,
  };
}

export async function getSuggestions(
  orgId: string,
  partialQuery: string
): Promise<SearchResult[]> {
  return globalSearch(orgId, partialQuery, { limit: 5 });
}

export async function rebuildSearchIndex(
  orgId: string
): Promise<{ indexed: number }> {
  const [
    vendors,
    risks,
    controls,
    evidence,
    policies,
    audits,
    contracts,
    issues,
    findings,
  ] = await Promise.all([
    db.execute<{ id: string; name: string; industry: string | null }>(sql`
      SELECT id, name, industry FROM vendors WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; category: string | null }>(sql`
      SELECT id, title, category FROM risks WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; control_type: string | null }>(sql`
      SELECT id, title, control_type FROM controls WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; source: string | null }>(sql`
      SELECT id, title, source FROM evidence WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; status: string | null }>(sql`
      SELECT id, title, status FROM policies WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; name: string; type: string | null }>(sql`
      SELECT id, name, type FROM audits WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; contract_type: string | null }>(sql`
      SELECT id, title, contract_type FROM contracts WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; severity: string | null }>(sql`
      SELECT id, title, severity FROM issues WHERE organization_id = ${orgId}
    `),
    db.execute<{ id: string; title: string; finding_severity: string | null }>(sql`
      SELECT id, title, finding_severity FROM audit_findings
      WHERE organization_id = ${orgId}
    `),
  ]);

  const upserts: Promise<void>[] = [];

  for (const row of vendors as unknown as { id: string; name: string; industry: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "vendor",
        entityId: row.id,
        displayName: row.name,
        secondaryText: row.industry ?? undefined,
      })
    );
  }

  for (const row of risks as unknown as { id: string; title: string; category: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "risk",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.category ?? undefined,
      })
    );
  }

  for (const row of controls as unknown as { id: string; title: string; control_type: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "control",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.control_type ?? undefined,
      })
    );
  }

  for (const row of evidence as unknown as { id: string; title: string; source: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "evidence",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.source ?? undefined,
      })
    );
  }

  for (const row of policies as unknown as { id: string; title: string; status: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "policy",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.status ?? undefined,
      })
    );
  }

  for (const row of audits as unknown as { id: string; name: string; type: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "audit",
        entityId: row.id,
        displayName: row.name,
        secondaryText: row.type ?? undefined,
      })
    );
  }

  for (const row of contracts as unknown as { id: string; title: string; contract_type: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "contract",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.contract_type ?? undefined,
      })
    );
  }

  for (const row of issues as unknown as { id: string; title: string; severity: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "issue",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.severity ?? undefined,
      })
    );
  }

  for (const row of findings as unknown as { id: string; title: string; finding_severity: string | null }[]) {
    upserts.push(
      upsertSearchSuggestion({
        orgId,
        entityType: "audit_finding",
        entityId: row.id,
        displayName: row.title,
        secondaryText: row.finding_severity ?? undefined,
      })
    );
  }

  await Promise.all(upserts);

  return { indexed: upserts.length };
}

export async function getSavedSearches(
  orgId: string,
  userId: string
): Promise<SavedSearch[]> {
  return findSavedSearches(orgId, userId);
}

export async function saveSearch(params: {
  orgId: string;
  userId: string;
  name: string;
  query: string;
  entityTypes?: string[];
  isShared?: boolean;
}): Promise<{ id: string }> {
  return insertSavedSearch(params);
}

export async function deleteSavedSearch(
  orgId: string,
  userId: string,
  searchId: string
): Promise<void> {
  // Repo deletes by orgId + searchId; userId ownership enforced by findSavedSearches scope
  await repoDeleteSavedSearch(orgId, searchId);
}

export async function getRecentSearches(
  orgId: string,
  userId: string
): Promise<{ query: string; entity_types: string[]; searched_at: Date }[]> {
  return findRecentSearches(orgId, userId);
}
