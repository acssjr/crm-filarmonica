/**
 * Testes unitários para Contact Service
 * Testa: normalizePhoneNumber (via findOrCreate), parseCampaignCode
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findOrCreateContact,
  getContactById,
  updateContactDetails,
  updateContactJourneyState,
  getContacts,
  parseCampaignCode,
} from './contact.service.js'
import * as repository from './contact.repository.js'
import { contatoDBFactory } from '../../__tests__/factories/index.js'

// Mock do repository
vi.mock('./contact.repository.js', () => ({
  findContactByPhone: vi.fn(),
  findContactById: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  listContacts: vi.fn(),
}))

describe('Contact Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseCampaignCode', () => {
    it('deve retornar undefined para texto vazio', () => {
      expect(parseCampaignCode('')).toBeUndefined()
      expect(parseCampaignCode(undefined)).toBeUndefined()
    })

    it('deve extrair código de campanha válido', () => {
      expect(parseCampaignCode('CAMP01')).toBe('CAMP01')
      expect(parseCampaignCode('PROMO2024')).toBe('PROMO2024')
      expect(parseCampaignCode('AB123')).toBe('AB123')
    })

    it('deve converter para maiúsculas', () => {
      expect(parseCampaignCode('camp01')).toBe('CAMP01')
      expect(parseCampaignCode('promo2024')).toBe('PROMO2024')
    })

    it('deve retornar undefined para texto que não é código de campanha', () => {
      expect(parseCampaignCode('Olá, quero informações')).toBeUndefined()
      expect(parseCampaignCode('A')).toBeUndefined() // Muito curto
      expect(parseCampaignCode('123')).toBeUndefined() // Só números
      expect(parseCampaignCode('ABCDEFGHIJK')).toBeUndefined() // Letras demais
    })

    it('deve exigir pelo menos 2 letras e no máximo 10', () => {
      expect(parseCampaignCode('AB1')).toBe('AB1')
      expect(parseCampaignCode('ABCDEFGHIJ1')).toBe('ABCDEFGHIJ1') // 10 letras + 1 dígito
      expect(parseCampaignCode('ABCDEFGHIJK1')).toBeUndefined() // 11 letras
    })

    it('deve exigir pelo menos 1 dígito e no máximo 4', () => {
      expect(parseCampaignCode('AB1')).toBe('AB1')
      expect(parseCampaignCode('AB1234')).toBe('AB1234')
      expect(parseCampaignCode('AB12345')).toBeUndefined() // 5 dígitos
    })
  })

  describe('findOrCreateContact', () => {
    it('deve retornar contato existente quando encontrado', async () => {
      const existingContact = contatoDBFactory.build({
        telefone: '+5575999123456',
      })
      vi.mocked(repository.findContactByPhone).mockResolvedValue(existingContact)
      vi.mocked(repository.updateContact).mockResolvedValue(existingContact)

      const result = await findOrCreateContact('75999123456')

      expect(result.isNew).toBe(false)
      expect(result.contact).toEqual(existingContact)
      expect(repository.updateContact).toHaveBeenCalledWith(
        existingContact.id,
        expect.objectContaining({ updatedAt: expect.any(Date) })
      )
    })

    it('deve criar novo contato quando não existe', async () => {
      const newContact = contatoDBFactory.build()
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(newContact)

      const result = await findOrCreateContact('75999123456')

      expect(result.isNew).toBe(true)
      expect(result.contact).toEqual(newContact)
      expect(repository.createContact).toHaveBeenCalled()
    })

    it('deve normalizar telefone removendo não-dígitos', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('(75) 99912-3456')

      expect(repository.findContactByPhone).toHaveBeenCalledWith('+5575999123456')
    })

    it('deve normalizar telefone adicionando código do país', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('75999123456')

      expect(repository.findContactByPhone).toHaveBeenCalledWith('+5575999123456')
    })

    it('deve normalizar telefone removendo zero inicial', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('075999123456')

      expect(repository.findContactByPhone).toHaveBeenCalledWith('+5575999123456')
    })

    it('deve manter telefone que já tem código do país', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('5575999123456')

      expect(repository.findContactByPhone).toHaveBeenCalledWith('+5575999123456')
    })

    it('deve criar contato com origem organico por padrão', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('75999123456')

      expect(repository.createContact).toHaveBeenCalledWith(
        expect.objectContaining({ origem: 'organico', origemCampanha: null })
      )
    })

    it('deve criar contato com origem campanha e código', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('75999123456', 'campanha', 'PROMO2024')

      expect(repository.createContact).toHaveBeenCalledWith(
        expect.objectContaining({ origem: 'campanha', origemCampanha: 'PROMO2024' })
      )
    })

    it('deve ignorar origemCampanha quando origem não é campanha', async () => {
      vi.mocked(repository.findContactByPhone).mockResolvedValue(null)
      vi.mocked(repository.createContact).mockResolvedValue(contatoDBFactory.build())

      await findOrCreateContact('75999123456', 'indicacao', 'PROMO2024')

      expect(repository.createContact).toHaveBeenCalledWith(
        expect.objectContaining({ origem: 'indicacao', origemCampanha: null })
      )
    })
  })

  describe('getContactById', () => {
    it('deve retornar contato quando existe', async () => {
      const contact = contatoDBFactory.build()
      vi.mocked(repository.findContactById).mockResolvedValue(contact)

      const result = await getContactById(contact.id)

      expect(result).toEqual(contact)
    })

    it('deve retornar null quando não existe', async () => {
      vi.mocked(repository.findContactById).mockResolvedValue(null)

      const result = await getContactById('inexistente')

      expect(result).toBeNull()
    })
  })

  describe('updateContactDetails', () => {
    it('deve atualizar nome do contato', async () => {
      const contact = contatoDBFactory.build({ nome: 'Atualizado' })
      vi.mocked(repository.updateContact).mockResolvedValue(contact)

      const result = await updateContactDetails(contact.id, { nome: 'Atualizado' })

      expect(result?.nome).toBe('Atualizado')
    })

    it('deve atualizar tipo do contato', async () => {
      const contact = contatoDBFactory.build({ tipo: 'responsavel' })
      vi.mocked(repository.updateContact).mockResolvedValue(contact)

      const result = await updateContactDetails(contact.id, { tipo: 'responsavel' })

      expect(result?.tipo).toBe('responsavel')
    })
  })

  describe('updateContactJourneyState', () => {
    it('deve atualizar estado da jornada', async () => {
      const contact = contatoDBFactory.build({ estadoJornada: 'qualificado' })
      vi.mocked(repository.updateContact).mockResolvedValue(contact)

      const result = await updateContactJourneyState(contact.id, 'qualificado')

      expect(result?.estadoJornada).toBe('qualificado')
      expect(repository.updateContact).toHaveBeenCalledWith(
        contact.id,
        { estadoJornada: 'qualificado' }
      )
    })
  })

  describe('getContacts', () => {
    it('deve retornar lista paginada de contatos', async () => {
      const contacts = contatoDBFactory.buildList(3)
      const paginatedResult = {
        data: contacts,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      }
      vi.mocked(repository.listContacts).mockResolvedValue(paginatedResult)

      const result = await getContacts({ page: 1, limit: 20 })

      expect(result.data).toHaveLength(3)
      expect(result.pagination.total).toBe(3)
    })
  })
})
