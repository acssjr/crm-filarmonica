import { eq, sql, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tags, contatoTags, type Tag, type NewTag } from '../../db/schema.js'

// ==================== TAGS CRUD ====================

export async function findAllTags(): Promise<Tag[]> {
  return db.select().from(tags).orderBy(tags.nome)
}

export async function findTagById(id: string): Promise<Tag | null> {
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1)
  return result[0] || null
}

export async function findTagByName(nome: string): Promise<Tag | null> {
  const result = await db.select().from(tags).where(eq(tags.nome, nome)).limit(1)
  return result[0] || null
}

export async function createTag(data: NewTag): Promise<Tag> {
  const result = await db.insert(tags).values(data).returning()
  return result[0]
}

export async function updateTag(id: string, data: Partial<NewTag>): Promise<Tag | null> {
  const result = await db.update(tags).set(data).where(eq(tags.id, id)).returning()
  return result[0] || null
}

export async function deleteTag(id: string): Promise<boolean> {
  const result = await db.delete(tags).where(eq(tags.id, id)).returning()
  return result.length > 0
}

// ==================== CONTACT TAGS ====================

export async function findTagsByContactId(contatoId: string): Promise<Tag[]> {
  const result = await db
    .select({
      id: tags.id,
      nome: tags.nome,
      cor: tags.cor,
      createdAt: tags.createdAt,
    })
    .from(contatoTags)
    .innerJoin(tags, eq(contatoTags.tagId, tags.id))
    .where(eq(contatoTags.contatoId, contatoId))
    .orderBy(tags.nome)

  return result
}

export async function addTagToContact(contatoId: string, tagId: string): Promise<boolean> {
  try {
    await db.insert(contatoTags).values({ contatoId, tagId }).onConflictDoNothing()
    return true
  } catch {
    return false
  }
}

export async function removeTagFromContact(contatoId: string, tagId: string): Promise<boolean> {
  const result = await db
    .delete(contatoTags)
    .where(sql`${contatoTags.contatoId} = ${contatoId} AND ${contatoTags.tagId} = ${tagId}`)
    .returning()
  return result.length > 0
}

export async function setContactTags(contatoId: string, tagIds: string[]): Promise<void> {
  // Remove all existing tags
  await db.delete(contatoTags).where(eq(contatoTags.contatoId, contatoId))

  // Add new tags
  if (tagIds.length > 0) {
    await db.insert(contatoTags).values(
      tagIds.map(tagId => ({ contatoId, tagId }))
    )
  }
}

// ==================== QUERIES ====================

export async function countContactsByTag(): Promise<Array<{ tagId: string; tagName: string; count: number }>> {
  const result = await db
    .select({
      tagId: tags.id,
      tagName: tags.nome,
      count: sql<number>`count(${contatoTags.contatoId})`,
    })
    .from(tags)
    .leftJoin(contatoTags, eq(tags.id, contatoTags.tagId))
    .groupBy(tags.id, tags.nome)
    .orderBy(tags.nome)

  return result.map(r => ({ ...r, count: Number(r.count) }))
}

export async function findContactIdsByTags(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return []

  const result = await db
    .selectDistinct({ contatoId: contatoTags.contatoId })
    .from(contatoTags)
    .where(inArray(contatoTags.tagId, tagIds))

  return result.map(r => r.contatoId)
}
