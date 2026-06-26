"use server";

import { requireUser } from "@/lib/auth/session";
import * as searchService from "@/lib/services/platform/search-service";
import { isAdminOrOwner } from "@/lib/ui/role-guard";

export async function searchAction(
  query: string,
  entityTypes?: string[]
): Promise<{ results?: any[]; total?: number; error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    const data = await searchService.search(
      session.org.id,
      query,
      entityTypes ? { entityTypes } : undefined
    );
    return { results: data.results, total: data.total };
  } catch (err: any) {
    return { error: err.message ?? "Search failed" };
  }
}

export async function getSuggestionsAction(
  partialQuery: string
): Promise<{ suggestions?: any[]; error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    const suggestions = await searchService.getSuggestions(session.org.id, partialQuery);
    return { suggestions };
  } catch (err: any) {
    return { error: err.message ?? "Failed to get suggestions" };
  }
}

export async function rebuildSearchIndexAction(): Promise<{
  indexed?: number;
  error?: string;
}> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    if (!isAdminOrOwner(session.org.role)) {
      return { error: "Admin or owner role required" };
    }
    const { indexed } = await searchService.rebuildSearchIndex(session.org.id);
    return { indexed };
  } catch (err: any) {
    return { error: err.message ?? "Failed to rebuild search index" };
  }
}

export async function saveSearchAction(
  name: string,
  query: string,
  entityTypes?: string[]
): Promise<{ id?: string; error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    const result = await searchService.saveSearch({
      orgId: session.org.id,
      userId: session.id,
      name,
      query,
      entityTypes,
    });
    return { id: result.id };
  } catch (err: any) {
    return { error: err.message ?? "Failed to save search" };
  }
}

export async function deleteSavedSearchAction(
  searchId: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    await searchService.deleteSavedSearch(session.org.id, session.id, searchId);
    return {};
  } catch (err: any) {
    return { error: err.message ?? "Failed to delete saved search" };
  }
}

export async function getRecentSearchesAction(): Promise<{
  searches?: any[];
  error?: string;
}> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization found" };
    const searches = await searchService.getRecentSearches(session.org.id, session.id);
    return { searches };
  } catch (err: any) {
    return { error: err.message ?? "Failed to get recent searches" };
  }
}
