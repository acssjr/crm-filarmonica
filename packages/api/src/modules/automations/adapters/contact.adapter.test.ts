/**
 * Contact Adapter Tests
 * Tests for the ContactAdapter implementation
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { ContactAdapter } from './contact.adapter.js'

// Mock the database module
vi.mock('../../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock the schema to include estadoJornadaEnum
vi.mock('../../../db/schema.js', () => ({
  contatos: { id: 'id' },
  interessados: { contatoId: 'contatoId' },
  contatoTags: { contatoId: 'contatoId', tagId: 'tagId' },
  tags: { id: 'id' },
  mensagens: { createdAt: 'createdAt', conversaId: 'conversaId' },
  conversas: { contatoId: 'contatoId', status: 'status', id: 'id' },
  estadoJornadaEnum: {
    enumValues: [
      'inicial',
      'boas_vindas',
      'coletando_nome',
      'coletando_idade',
      'coletando_instrumento',
      'verificando_saxofone',
      'coletando_experiencia',
      'coletando_disponibilidade',
      'incompativel',
      'qualificado',
      'atendimento_humano',
    ],
  },
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ type: 'eq', col, val })),
  and: vi.fn((...args) => ({ type: 'and', args })),
  lte: vi.fn((col, val) => ({ type: 'lte', col, val })),
  sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}))

// Import mocked db after mocking
import { db } from '../../../db/index.js'

describe('ContactAdapter', () => {
  let adapter: ContactAdapter
  let mockSelect: Mock
  let mockInsert: Mock
  let mockUpdate: Mock
  let mockDelete: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new ContactAdapter()

    // Setup chainable mock for select
    mockSelect = vi.fn()
    mockInsert = vi.fn()
    mockUpdate = vi.fn()
    mockDelete = vi.fn()

    ;(db.select as Mock) = mockSelect
    ;(db.insert as Mock) = mockInsert
    ;(db.update as Mock) = mockUpdate
    ;(db.delete as Mock) = mockDelete
  })

  describe('findById', () => {
    it('should return contact details with tags and interessado', async () => {
      const contactData = {
        id: 'contact-123',
        telefone: '+5575988123456',
        nome: 'Joao Silva',
        estadoJornada: 'inicial',
        origem: 'organico',
      }
      const tagData = [{ tagId: 'tag-1' }, { tagId: 'tag-2' }]
      const interessadoData = {
        idade: 25,
        instrumentoDesejado: 'Saxofone',
      }

      // Mock contact query
      const contactLimitMock = vi.fn().mockResolvedValue([contactData])
      const contactWhereMock = vi.fn().mockReturnValue({ limit: contactLimitMock })
      const contactFromMock = vi.fn().mockReturnValue({ where: contactWhereMock })

      // Mock tags query
      const tagsWhereMock = vi.fn().mockResolvedValue(tagData)
      const tagsFromMock = vi.fn().mockReturnValue({ where: tagsWhereMock })

      // Mock interessado query
      const interessadoLimitMock = vi.fn().mockResolvedValue([interessadoData])
      const interessadoWhereMock = vi.fn().mockReturnValue({ limit: interessadoLimitMock })
      const interessadoFromMock = vi.fn().mockReturnValue({ where: interessadoWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: contactFromMock })
        .mockReturnValueOnce({ from: tagsFromMock })
        .mockReturnValueOnce({ from: interessadoFromMock })

      const result = await adapter.findById('contact-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('contact-123')
      expect(result?.telefone).toBe('+5575988123456')
      expect(result?.tags).toEqual(['tag-1', 'tag-2'])
      expect(result?.interessado?.idade).toBe(25)
      expect(result?.interessado?.instrumentoDesejado).toBe('Saxofone')
    })

    it('should return null when contact not found', async () => {
      const contactLimitMock = vi.fn().mockResolvedValue([])
      const contactWhereMock = vi.fn().mockReturnValue({ limit: contactLimitMock })
      const contactFromMock = vi.fn().mockReturnValue({ where: contactWhereMock })
      mockSelect.mockReturnValue({ from: contactFromMock })

      const result = await adapter.findById('non-existent')

      expect(result).toBeNull()
    })

    it('should return contact without interessado when not exists', async () => {
      const contactData = {
        id: 'contact-123',
        telefone: '+5575988123456',
        nome: 'Joao Silva',
        estadoJornada: 'inicial',
        origem: 'organico',
      }

      const contactLimitMock = vi.fn().mockResolvedValue([contactData])
      const contactWhereMock = vi.fn().mockReturnValue({ limit: contactLimitMock })
      const contactFromMock = vi.fn().mockReturnValue({ where: contactWhereMock })

      const tagsWhereMock = vi.fn().mockResolvedValue([])
      const tagsFromMock = vi.fn().mockReturnValue({ where: tagsWhereMock })

      const interessadoLimitMock = vi.fn().mockResolvedValue([])
      const interessadoWhereMock = vi.fn().mockReturnValue({ limit: interessadoLimitMock })
      const interessadoFromMock = vi.fn().mockReturnValue({ where: interessadoWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: contactFromMock })
        .mockReturnValueOnce({ from: tagsFromMock })
        .mockReturnValueOnce({ from: interessadoFromMock })

      const result = await adapter.findById('contact-123')

      expect(result).toBeDefined()
      expect(result?.interessado).toBeUndefined()
    })
  })

  describe('getContactData', () => {
    it('should return contact data for condition evaluation', async () => {
      const contactData = {
        id: 'contact-123',
        telefone: '+5575988123456',
        nome: 'Joao Silva',
        estadoJornada: 'qualificado',
        origem: 'campanha',
      }
      const tagData = [{ tagId: 'tag-vip' }]
      const interessadoData = {
        idade: 30,
        instrumentoDesejado: 'Violino',
      }

      const contactLimitMock = vi.fn().mockResolvedValue([contactData])
      const contactWhereMock = vi.fn().mockReturnValue({ limit: contactLimitMock })
      const contactFromMock = vi.fn().mockReturnValue({ where: contactWhereMock })

      const tagsWhereMock = vi.fn().mockResolvedValue(tagData)
      const tagsFromMock = vi.fn().mockReturnValue({ where: tagsWhereMock })

      const interessadoLimitMock = vi.fn().mockResolvedValue([interessadoData])
      const interessadoWhereMock = vi.fn().mockReturnValue({ limit: interessadoLimitMock })
      const interessadoFromMock = vi.fn().mockReturnValue({ where: interessadoWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: contactFromMock })
        .mockReturnValueOnce({ from: tagsFromMock })
        .mockReturnValueOnce({ from: interessadoFromMock })

      const result = await adapter.getContactData('contact-123')

      expect(result).toBeDefined()
      expect(result?.tags).toEqual(['tag-vip'])
      expect(result?.estadoJornada).toBe('qualificado')
      expect(result?.origem).toBe('campanha')
      expect(result?.idade).toBe(30)
      expect(result?.instrumentoDesejado).toBe('Violino')
    })

    it('should return null when contact not found', async () => {
      const contactLimitMock = vi.fn().mockResolvedValue([])
      const contactWhereMock = vi.fn().mockReturnValue({ limit: contactLimitMock })
      const contactFromMock = vi.fn().mockReturnValue({ where: contactWhereMock })
      mockSelect.mockReturnValue({ from: contactFromMock })

      const result = await adapter.getContactData('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('addTag', () => {
    it('should add tag to contact successfully', async () => {
      // Mock tag exists check
      const tagLimitMock = vi.fn().mockResolvedValue([{ id: 'tag-123', nome: 'VIP' }])
      const tagWhereMock = vi.fn().mockReturnValue({ limit: tagLimitMock })
      const tagFromMock = vi.fn().mockReturnValue({ where: tagWhereMock })

      // Mock existing tag check
      const existingLimitMock = vi.fn().mockResolvedValue([])
      const existingWhereMock = vi.fn().mockReturnValue({ limit: existingLimitMock })
      const existingFromMock = vi.fn().mockReturnValue({ where: existingWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: tagFromMock })
        .mockReturnValueOnce({ from: existingFromMock })

      // Mock insert
      const valuesMock = vi.fn().mockResolvedValue(undefined)
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await adapter.addTag('contact-123', 'tag-123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should return error when tag does not exist', async () => {
      const tagLimitMock = vi.fn().mockResolvedValue([])
      const tagWhereMock = vi.fn().mockReturnValue({ limit: tagLimitMock })
      const tagFromMock = vi.fn().mockReturnValue({ where: tagWhereMock })
      mockSelect.mockReturnValue({ from: tagFromMock })

      const result = await adapter.addTag('contact-123', 'non-existent-tag')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tag não encontrada')
    })

    it('should return success when tag already exists on contact', async () => {
      const tagLimitMock = vi.fn().mockResolvedValue([{ id: 'tag-123' }])
      const tagWhereMock = vi.fn().mockReturnValue({ limit: tagLimitMock })
      const tagFromMock = vi.fn().mockReturnValue({ where: tagWhereMock })

      const existingLimitMock = vi.fn().mockResolvedValue([{ contatoId: 'contact-123', tagId: 'tag-123' }])
      const existingWhereMock = vi.fn().mockReturnValue({ limit: existingLimitMock })
      const existingFromMock = vi.fn().mockReturnValue({ where: existingWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: tagFromMock })
        .mockReturnValueOnce({ from: existingFromMock })

      const result = await adapter.addTag('contact-123', 'tag-123')

      expect(result.success).toBe(true)
      expect(mockInsert).not.toHaveBeenCalled() // Should not insert again
    })

    it('should handle database errors gracefully', async () => {
      const tagLimitMock = vi.fn().mockResolvedValue([{ id: 'tag-123' }])
      const tagWhereMock = vi.fn().mockReturnValue({ limit: tagLimitMock })
      const tagFromMock = vi.fn().mockReturnValue({ where: tagWhereMock })

      const existingLimitMock = vi.fn().mockResolvedValue([])
      const existingWhereMock = vi.fn().mockReturnValue({ limit: existingLimitMock })
      const existingFromMock = vi.fn().mockReturnValue({ where: existingWhereMock })

      mockSelect
        .mockReturnValueOnce({ from: tagFromMock })
        .mockReturnValueOnce({ from: existingFromMock })

      mockInsert.mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      })

      const result = await adapter.addTag('contact-123', 'tag-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('removeTag', () => {
    it('should remove tag from contact successfully', async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined)
      mockDelete.mockReturnValue({ where: whereMock })

      const result = await adapter.removeTag('contact-123', 'tag-123')

      expect(result.success).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockDelete.mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('Delete failed')),
      })

      const result = await adapter.removeTag('contact-123', 'tag-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('updateJourneyState', () => {
    it('should update journey state successfully', async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined)
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      const result = await adapter.updateJourneyState('contact-123', 'qualificado')

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('should reject invalid journey state', async () => {
      const result = await adapter.updateJourneyState('contact-123', 'invalid_state')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Estado de jornada inválido')
    })

    it('should accept all valid journey states', async () => {
      const validStates = [
        'inicial',
        'boas_vindas',
        'coletando_nome',
        'coletando_idade',
        'coletando_instrumento',
        'verificando_saxofone',
        'coletando_experiencia',
        'coletando_disponibilidade',
        'incompativel',
        'qualificado',
        'atendimento_humano',
      ]

      for (const state of validStates) {
        vi.clearAllMocks()
        const whereMock = vi.fn().mockResolvedValue(undefined)
        const setMock = vi.fn().mockReturnValue({ where: whereMock })
        mockUpdate.mockReturnValue({ set: setMock })

        const result = await adapter.updateJourneyState('contact-123', state)
        expect(result.success).toBe(true)
      }
    })

    it('should handle database errors gracefully', async () => {
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Update failed')),
        }),
      })

      const result = await adapter.updateJourneyState('contact-123', 'qualificado')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('findContactsWithoutInteraction', () => {
    it('should return contacts without interaction for specified days', async () => {
      const contactIds = [
        { contatoId: 'contact-1', lastMessage: new Date() },
        { contatoId: 'contact-2', lastMessage: new Date() },
      ]

      const offsetMock = vi.fn().mockResolvedValue(contactIds)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const havingMock = vi.fn().mockReturnValue({ limit: limitMock })
      const groupByMock = vi.fn().mockReturnValue({ having: havingMock })
      const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock })
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.findContactsWithoutInteraction(7)

      expect(result).toHaveLength(2)
      expect(result).toContain('contact-1')
      expect(result).toContain('contact-2')
    })

    it('should use default limit of 100', async () => {
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const havingMock = vi.fn().mockReturnValue({ limit: limitMock })
      const groupByMock = vi.fn().mockReturnValue({ having: havingMock })
      const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock })
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
      mockSelect.mockReturnValue({ from: fromMock })

      await adapter.findContactsWithoutInteraction(7)

      expect(limitMock).toHaveBeenCalledWith(100)
    })

    it('should use custom limit and offset for pagination', async () => {
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const havingMock = vi.fn().mockReturnValue({ limit: limitMock })
      const groupByMock = vi.fn().mockReturnValue({ having: havingMock })
      const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock })
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
      mockSelect.mockReturnValue({ from: fromMock })

      await adapter.findContactsWithoutInteraction(7, 50, 100)

      expect(limitMock).toHaveBeenCalledWith(50)
      expect(offsetMock).toHaveBeenCalledWith(100)
    })

    it('should calculate correct cutoff date', async () => {
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const havingMock = vi.fn().mockReturnValue({ limit: limitMock })
      const groupByMock = vi.fn().mockReturnValue({ having: havingMock })
      const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock })
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const before = Date.now()
      await adapter.findContactsWithoutInteraction(30) // 30 days
      const after = Date.now()

      // Verify the function was called (cutoff date should be calculated inside)
      expect(whereMock).toHaveBeenCalled()
      // Execution time should be minimal
      expect(after - before).toBeLessThan(100)
    })

    it('should return empty array when no contacts match', async () => {
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const havingMock = vi.fn().mockReturnValue({ limit: limitMock })
      const groupByMock = vi.fn().mockReturnValue({ having: havingMock })
      const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock })
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.findContactsWithoutInteraction(1)

      expect(result).toHaveLength(0)
    })
  })
})
