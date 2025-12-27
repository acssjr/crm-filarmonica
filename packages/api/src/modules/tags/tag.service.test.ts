/**
 * Testes unitários para Tag Service
 * Testa: CRUD de tags, associação com contatos, validações
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAllTags,
  getTagById,
  createNewTag,
  updateExistingTag,
  deleteExistingTag,
  getContactTags,
  addTagToContactById,
  removeTagFromContactById,
  updateContactTags,
  getTagStatistics,
} from './tag.service.js'
import * as repository from './tag.repository.js'

// Mock do repository
vi.mock('./tag.repository.js', () => ({
  findAllTags: vi.fn(),
  findTagById: vi.fn(),
  findTagByName: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  findTagsByContactId: vi.fn(),
  addTagToContact: vi.fn(),
  removeTagFromContact: vi.fn(),
  setContactTags: vi.fn(),
  countContactsByTag: vi.fn(),
}))

// Tipo de cor válida
type TagCor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'

// Factory para criar tags de teste
const createMockTag = (overrides: Partial<{ id: string; nome: string; cor: TagCor; createdAt: Date }> = {}) => ({
  id: overrides.id ?? 'tag-123',
  nome: overrides.nome ?? 'Tag Teste',
  cor: overrides.cor ?? 'gray' as TagCor,
  createdAt: overrides.createdAt ?? new Date(),
})

describe('Tag Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllTags', () => {
    it('deve retornar lista de tags', async () => {
      const tags = [createMockTag({ nome: 'VIP' }), createMockTag({ nome: 'Ativo' })]
      vi.mocked(repository.findAllTags).mockResolvedValue(tags)

      const result = await getAllTags()

      expect(result).toHaveLength(2)
      expect(result[0].nome).toBe('VIP')
    })

    it('deve retornar lista vazia quando não há tags', async () => {
      vi.mocked(repository.findAllTags).mockResolvedValue([])

      const result = await getAllTags()

      expect(result).toEqual([])
    })
  })

  describe('getTagById', () => {
    it('deve retornar tag quando existe', async () => {
      const tag = createMockTag()
      vi.mocked(repository.findTagById).mockResolvedValue(tag)

      const result = await getTagById('tag-123')

      expect(result).toEqual(tag)
    })

    it('deve retornar null quando não existe', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(null)

      const result = await getTagById('inexistente')

      expect(result).toBeNull()
    })
  })

  describe('createNewTag', () => {
    it('deve criar tag com nome válido', async () => {
      const tag = createMockTag({ nome: 'Nova Tag' })
      vi.mocked(repository.findTagByName).mockResolvedValue(null)
      vi.mocked(repository.createTag).mockResolvedValue(tag)

      const result = await createNewTag({ nome: 'Nova Tag' })

      expect(result.tag).toEqual(tag)
      expect(result.error).toBeUndefined()
    })

    it('deve usar cor gray como padrão', async () => {
      const tag = createMockTag({ cor: 'gray' })
      vi.mocked(repository.findTagByName).mockResolvedValue(null)
      vi.mocked(repository.createTag).mockResolvedValue(tag)

      await createNewTag({ nome: 'Nova Tag' })

      expect(repository.createTag).toHaveBeenCalledWith({ nome: 'Nova Tag', cor: 'gray' })
    })

    it('deve criar tag com cor válida', async () => {
      const tag = createMockTag({ cor: 'blue' })
      vi.mocked(repository.findTagByName).mockResolvedValue(null)
      vi.mocked(repository.createTag).mockResolvedValue(tag)

      const result = await createNewTag({ nome: 'Nova Tag', cor: 'blue' })

      expect(result.tag?.cor).toBe('blue')
    })

    it('deve fazer trim no nome', async () => {
      const tag = createMockTag({ nome: 'Nova Tag' })
      vi.mocked(repository.findTagByName).mockResolvedValue(null)
      vi.mocked(repository.createTag).mockResolvedValue(tag)

      await createNewTag({ nome: '  Nova Tag  ' })

      expect(repository.createTag).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Nova Tag' })
      )
    })

    it('deve retornar erro quando nome está vazio', async () => {
      const result = await createNewTag({ nome: '' })

      expect(result.error).toBe('Nome deve ter entre 1 e 50 caracteres')
      expect(result.tag).toBeUndefined()
    })

    it('deve retornar erro quando nome é muito longo', async () => {
      const result = await createNewTag({ nome: 'a'.repeat(51) })

      expect(result.error).toBe('Nome deve ter entre 1 e 50 caracteres')
    })

    it('deve retornar erro quando nome já existe', async () => {
      vi.mocked(repository.findTagByName).mockResolvedValue(createMockTag({ nome: 'Existente' }))

      const result = await createNewTag({ nome: 'Existente' })

      expect(result.error).toBe('Ja existe uma tag com este nome')
    })

    it('deve retornar erro quando cor é inválida', async () => {
      vi.mocked(repository.findTagByName).mockResolvedValue(null)

      const result = await createNewTag({ nome: 'Tag', cor: 'invalida' as 'gray' })

      expect(result.error).toBe('Cor invalida')
    })
  })

  describe('updateExistingTag', () => {
    it('deve atualizar nome da tag', async () => {
      const existingTag = createMockTag({ nome: 'Original' })
      const updatedTag = createMockTag({ nome: 'Atualizada' })
      vi.mocked(repository.findTagById).mockResolvedValue(existingTag)
      vi.mocked(repository.findTagByName).mockResolvedValue(null)
      vi.mocked(repository.updateTag).mockResolvedValue(updatedTag)

      const result = await updateExistingTag('tag-123', { nome: 'Atualizada' })

      expect(result.tag?.nome).toBe('Atualizada')
    })

    it('deve atualizar cor da tag', async () => {
      const existingTag = createMockTag({ cor: 'gray' })
      const updatedTag = createMockTag({ cor: 'red' })
      vi.mocked(repository.findTagById).mockResolvedValue(existingTag)
      vi.mocked(repository.updateTag).mockResolvedValue(updatedTag)

      const result = await updateExistingTag('tag-123', { cor: 'red' })

      expect(result.tag?.cor).toBe('red')
    })

    it('deve retornar erro quando tag não existe', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(null)

      const result = await updateExistingTag('inexistente', { nome: 'Novo' })

      expect(result.error).toBe('Tag nao encontrada')
    })

    it('deve retornar erro quando nome está vazio', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(createMockTag())

      const result = await updateExistingTag('tag-123', { nome: '' })

      expect(result.error).toBe('Nome deve ter entre 1 e 50 caracteres')
    })

    it('deve retornar erro quando nome já existe em outra tag', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(createMockTag({ id: 'tag-123' }))
      vi.mocked(repository.findTagByName).mockResolvedValue(createMockTag({ id: 'tag-456', nome: 'Duplicada' }))

      const result = await updateExistingTag('tag-123', { nome: 'Duplicada' })

      expect(result.error).toBe('Ja existe uma tag com este nome')
    })

    it('deve permitir manter o mesmo nome', async () => {
      const existingTag = createMockTag({ id: 'tag-123', nome: 'Mesma' })
      vi.mocked(repository.findTagById).mockResolvedValue(existingTag)
      vi.mocked(repository.findTagByName).mockResolvedValue(existingTag)
      vi.mocked(repository.updateTag).mockResolvedValue(existingTag)

      const result = await updateExistingTag('tag-123', { nome: 'Mesma' })

      expect(result.error).toBeUndefined()
    })

    it('deve retornar erro quando cor é inválida', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(createMockTag())

      const result = await updateExistingTag('tag-123', { cor: 'invalida' as 'gray' })

      expect(result.error).toBe('Cor invalida')
    })

    it('deve retornar tag existente quando não há atualizações', async () => {
      const existingTag = createMockTag()
      vi.mocked(repository.findTagById).mockResolvedValue(existingTag)

      const result = await updateExistingTag('tag-123', {})

      expect(result.tag).toEqual(existingTag)
      expect(repository.updateTag).not.toHaveBeenCalled()
    })
  })

  describe('deleteExistingTag', () => {
    it('deve deletar tag existente', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(createMockTag())
      vi.mocked(repository.deleteTag).mockResolvedValue(true)

      const result = await deleteExistingTag('tag-123')

      expect(result.success).toBe(true)
    })

    it('deve retornar erro quando tag não existe', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(null)

      const result = await deleteExistingTag('inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tag nao encontrada')
    })
  })

  describe('getContactTags', () => {
    it('deve retornar tags do contato', async () => {
      const tags = [createMockTag({ nome: 'VIP' }), createMockTag({ nome: 'Ativo' })]
      vi.mocked(repository.findTagsByContactId).mockResolvedValue(tags)

      const result = await getContactTags('contato-123')

      expect(result).toHaveLength(2)
    })
  })

  describe('addTagToContactById', () => {
    it('deve adicionar tag ao contato', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(createMockTag())
      vi.mocked(repository.addTagToContact).mockResolvedValue(true)

      const result = await addTagToContactById('contato-123', 'tag-123')

      expect(result.success).toBe(true)
    })

    it('deve retornar erro quando tag não existe', async () => {
      vi.mocked(repository.findTagById).mockResolvedValue(null)

      const result = await addTagToContactById('contato-123', 'tag-inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tag nao encontrada')
    })
  })

  describe('removeTagFromContactById', () => {
    it('deve remover tag do contato', async () => {
      vi.mocked(repository.removeTagFromContact).mockResolvedValue(true)

      const result = await removeTagFromContactById('contato-123', 'tag-123')

      expect(result.success).toBe(true)
    })
  })

  describe('updateContactTags', () => {
    it('deve atualizar todas as tags do contato', async () => {
      vi.mocked(repository.findAllTags).mockResolvedValue([
        createMockTag({ id: 'tag-1' }),
        createMockTag({ id: 'tag-2' }),
      ])
      vi.mocked(repository.setContactTags).mockResolvedValue(undefined)

      const result = await updateContactTags('contato-123', ['tag-1', 'tag-2'])

      expect(result.success).toBe(true)
      expect(repository.setContactTags).toHaveBeenCalledWith('contato-123', ['tag-1', 'tag-2'])
    })

    it('deve retornar erro quando tag inválida', async () => {
      vi.mocked(repository.findAllTags).mockResolvedValue([
        createMockTag({ id: 'tag-1' }),
      ])

      const result = await updateContactTags('contato-123', ['tag-1', 'tag-invalida'])

      expect(result.success).toBe(false)
      expect(result.error).toContain('Tags invalidas')
      expect(result.error).toContain('tag-invalida')
    })
  })

  describe('getTagStatistics', () => {
    it('deve retornar estatísticas de tags', async () => {
      const tags = [
        createMockTag({ id: 'tag-1', nome: 'VIP' }),
        createMockTag({ id: 'tag-2', nome: 'Ativo' }),
      ]
      vi.mocked(repository.countContactsByTag).mockResolvedValue([
        { tagId: 'tag-1', tagName: 'VIP', count: 10 },
        { tagId: 'tag-2', tagName: 'Ativo', count: 5 },
      ])
      vi.mocked(repository.findAllTags).mockResolvedValue(tags)

      const result = await getTagStatistics()

      expect(result).toHaveLength(2)
      expect(result[0].contactCount).toBe(10)
      expect(result[1].contactCount).toBe(5)
    })
  })
})
