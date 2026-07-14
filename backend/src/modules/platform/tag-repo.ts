import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type TagRow = {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string | null;
  created_at: Date;
};

export type EntityTagRow = {
  id: string;
  tag_id: string;
  entity_type: string;
  entity_id: string;
  tagged_by: string | null;
  created_at: Date;
  tag?: TagRow;
};

export async function findOrgTags(orgId: string): Promise<TagRow[]> {
  const rows = await db.execute<TagRow>(sql`
    SELECT id, organization_id, name, color, description, created_by, created_at
    FROM platform_tags
    WHERE organization_id = ${orgId}
    ORDER BY name ASC
  `);
  return Array.from(rows);
}

export async function findTagById(orgId: string, tagId: string): Promise<TagRow | null> {
  const rows = await db.execute<TagRow>(sql`
    SELECT id, organization_id, name, color, description, created_by, created_at
    FROM platform_tags
    WHERE organization_id = ${orgId}
      AND id = ${tagId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function insertTag(params: {
  orgId: string;
  name: string;
  color?: string;
  description?: string;
  createdBy?: string;
}): Promise<{ id: string }> {
  const rows = await db.execute<{ id: string }>(sql`
    INSERT INTO platform_tags (organization_id, name, color, description, created_by)
    VALUES (
      ${params.orgId},
      ${params.name},
      ${params.color ?? "#6366f1"},
      ${params.description ?? null},
      ${params.createdBy ?? null}
    )
    RETURNING id
  `);
  return rows[0];
}

export async function updateTag(
  orgId: string,
  tagId: string,
  values: { name?: string; color?: string; description?: string }
): Promise<void> {
  const parts: string[] = [];
  if (values.name !== undefined) parts.push(`name = '${values.name.replace(/'/g, "''")}'`);
  if (values.color !== undefined) parts.push(`color = '${values.color.replace(/'/g, "''")}'`);
  if (values.description !== undefined)
    parts.push(
      values.description === null
        ? `description = NULL`
        : `description = '${values.description.replace(/'/g, "''")}'`
    );
  if (parts.length === 0) return;
  await db.execute(sql`
    UPDATE platform_tags
    SET updated_at = now()
    WHERE organization_id = ${orgId}
      AND id = ${tagId}
  `);
  // Apply dynamic fields via a second pass using raw identifier-safe approach
  for (const part of parts) {
    await db.execute(sql.raw(`
      UPDATE platform_tags SET ${part}
      WHERE organization_id = '${orgId}' AND id = '${tagId}'
    `));
  }
}

export async function deleteTag(orgId: string, tagId: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM entity_tags
    WHERE tag_id = ${tagId}
      AND tag_id IN (
        SELECT id FROM platform_tags WHERE organization_id = ${orgId}
      )
  `);
  await db.execute(sql`
    DELETE FROM platform_tags
    WHERE organization_id = ${orgId}
      AND id = ${tagId}
  `);
}

export async function addTagToEntity(params: {
  orgId: string;
  tagId: string;
  entityType: string;
  entityId: string;
  taggedBy?: string;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO entity_tags (tag_id, entity_type, entity_id, tagged_by)
    SELECT ${params.tagId}, ${params.entityType}, ${params.entityId}, ${params.taggedBy ?? null}
    FROM platform_tags
    WHERE id = ${params.tagId}
      AND organization_id = ${params.orgId}
    ON CONFLICT (tag_id, entity_type, entity_id) DO NOTHING
  `);
}

export async function removeTagFromEntity(params: {
  orgId: string;
  tagId: string;
  entityType: string;
  entityId: string;
}): Promise<void> {
  await db.execute(sql`
    DELETE FROM entity_tags
    WHERE tag_id = ${params.tagId}
      AND entity_type = ${params.entityType}
      AND entity_id = ${params.entityId}
      AND tag_id IN (
        SELECT id FROM platform_tags WHERE organization_id = ${params.orgId}
      )
  `);
}

export async function findEntityTags(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<TagRow[]> {
  const rows = await db.execute<TagRow>(sql`
    SELECT t.id, t.organization_id, t.name, t.color, t.description, t.created_by, t.created_at
    FROM platform_tags t
    INNER JOIN entity_tags et ON et.tag_id = t.id
    WHERE t.organization_id = ${orgId}
      AND et.entity_type = ${entityType}
      AND et.entity_id = ${entityId}
    ORDER BY t.name ASC
  `);
  return Array.from(rows);
}

export async function findEntitiesByTag(
  orgId: string,
  tagId: string,
  entityType?: string
): Promise<EntityTagRow[]> {
  const rows = await db.execute<EntityTagRow & {
    t_id: string;
    t_organization_id: string;
    t_name: string;
    t_color: string;
    t_description: string | null;
    t_created_by: string | null;
    t_created_at: Date;
  }>(sql`
    SELECT
      et.id,
      et.tag_id,
      et.entity_type,
      et.entity_id,
      et.tagged_by,
      et.created_at,
      t.id            AS t_id,
      t.organization_id AS t_organization_id,
      t.name          AS t_name,
      t.color         AS t_color,
      t.description   AS t_description,
      t.created_by    AS t_created_by,
      t.created_at    AS t_created_at
    FROM entity_tags et
    INNER JOIN platform_tags t ON t.id = et.tag_id
    WHERE t.organization_id = ${orgId}
      AND et.tag_id = ${tagId}
      ${entityType ? sql`AND et.entity_type = ${entityType}` : sql``}
    ORDER BY et.created_at DESC
  `);
  return Array.from(rows).map((r) => ({
    id: r.id,
    tag_id: r.tag_id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    tagged_by: r.tagged_by,
    created_at: r.created_at,
    tag: {
      id: r.t_id,
      organization_id: r.t_organization_id,
      name: r.t_name,
      color: r.t_color,
      description: r.t_description,
      created_by: r.t_created_by,
      created_at: r.t_created_at,
    },
  }));
}

export async function searchTags(orgId: string, query: string): Promise<TagRow[]> {
  const pattern = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  const rows = await db.execute<TagRow>(sql`
    SELECT id, organization_id, name, color, description, created_by, created_at
    FROM platform_tags
    WHERE organization_id = ${orgId}
      AND name ILIKE ${pattern}
    ORDER BY name ASC
    LIMIT 50
  `);
  return Array.from(rows);
}
