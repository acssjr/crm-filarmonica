import {
  findAllTags,
  findTagById,
  findTagByName,
  createTag,
  updateTag,
  deleteTag,
  findTagsByContactId,
  addTagToContact,
  removeTagFromContact,
  setContactTags,
  countContactsByTag,
} from './tag.repository.js'
import type { Tag, NewTag } from '../../db/schema.js'

// Valid tag colors
const VALID_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const
type TagColor = typeof VALID_COLORS[number]

export interface CreateTagInput {
  nome: string
  cor?: TagColor
}

export interface UpdateTagInput {
  nome?: string
  cor?: TagColor
}

// ==================== TAG CRUD ====================

export async function getAllTags(): Promise<Tag[]> {
  return findAllTags()
}

export async function getTagById(id: string): Promise<Tag | null> {
  return findTagById(id)
}

export async function createNewTag(input: CreateTagInput): Promise<{ tag?: Tag; error?: string }> {
  // Validate name
  const nome = input.nome.trim()
  if (!nome || nome.length > 50) {
    return { error: 'Nome deve ter entre 1 e 50 caracteres' }
  }

  // Check if name already exists
  const existing = await findTagByName(nome)
  if (existing) {
    return { error: 'Ja existe uma tag com este nome' }
  }

  // Validate color
  const cor = input.cor || 'gray'
  if (!VALID_COLORS.includes(cor)) {
    return { error: 'Cor invalida' }
  }

  const tag = await createTag({ nome, cor })
  return { tag }
}

export async function updateExistingTag(id: string, input: UpdateTagInput): Promise<{ tag?: Tag; error?: string }> {
  const existing = await findTagById(id)
  if (!existing) {
    return { error: 'Tag nao encontrada' }
  }

  const updates: Partial<NewTag> = {}

  if (input.nome !== undefined) {
    const nome = input.nome.trim()
    if (!nome || nome.length > 50) {
      return { error: 'Nome deve ter entre 1 e 50 caracteres' }
    }

    // Check if name already exists (for another tag)
    const duplicate = await findTagByName(nome)
    if (duplicate && duplicate.id !== id) {
      return { error: 'Ja existe uma tag com este nome' }
    }

    updates.nome = nome
  }

  if (input.cor !== undefined) {
    if (!VALID_COLORS.includes(input.cor)) {
      return { error: 'Cor invalida' }
    }
    updates.cor = input.cor
  }

  if (Object.keys(updates).length === 0) {
    return { tag: existing }
  }

  const tag = await updateTag(id, updates)
  return { tag: tag || undefined }
}

export async function deleteExistingTag(id: string): Promise<{ success: boolean; error?: string }> {
  const existing = await findTagById(id)
  if (!existing) {
    return { success: false, error: 'Tag nao encontrada' }
  }

  const success = await deleteTag(id)
  return { success }
}

// ==================== CONTACT TAGS ====================

export async function getContactTags(contatoId: string): Promise<Tag[]> {
  return findTagsByContactId(contatoId)
}

export async function addTagToContactById(contatoId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
  const tag = await findTagById(tagId)
  if (!tag) {
    return { success: false, error: 'Tag nao encontrada' }
  }

  const success = await addTagToContact(contatoId, tagId)
  return { success }
}

export async function removeTagFromContactById(contatoId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
  const success = await removeTagFromContact(contatoId, tagId)
  return { success }
}

export async function updateContactTags(contatoId: string, tagIds: string[]): Promise<{ success: boolean; error?: string }> {
  // Validate all tag IDs exist
  const allTags = await findAllTags()
  const validTagIds = new Set(allTags.map(t => t.id))

  const invalidIds = tagIds.filter(id => !validTagIds.has(id))
  if (invalidIds.length > 0) {
    return { success: false, error: 'Tags invalidas: ' + invalidIds.join(', ') }
  }

  await setContactTags(contatoId, tagIds)
  return { success: true }
}

// ==================== STATISTICS ====================

export async function getTagStatistics(): Promise<Array<{ tag: Tag; contactCount: number }>> {
  const stats = await countContactsByTag()
  const allTags = await findAllTags()

  const tagMap = new Map(allTags.map(t => [t.id, t]))

  return stats.map(s => ({
    tag: tagMap.get(s.tagId)!,
    contactCount: s.count,
  }))
}

// Export service object
export const tagService = {
  getAll: getAllTags,
  getById: getTagById,
  create: createNewTag,
  update: updateExistingTag,
  delete: deleteExistingTag,
  getContactTags,
  addToContact: addTagToContactById,
  removeFromContact: removeTagFromContactById,
  updateContactTags,
  getStatistics: getTagStatistics,
}
