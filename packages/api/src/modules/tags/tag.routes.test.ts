/**
 * Testes de routes para Tags usando fastify.inject()
 * Testa: endpoints REST, validações, status codes
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

// Hoisted mocks - definidos antes de vi.mock
const { mockTagService, mockFindContactById, mockAuthMiddleware } = vi.hoisted(() => ({
  mockTagService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getContactTags: vi.fn(),
    addToContact: vi.fn(),
    removeFromContact: vi.fn(),
    updateContactTags: vi.fn(),
    getStatistics: vi.fn(),
  },
  mockFindContactById: vi.fn(),
  mockAuthMiddleware: vi.fn(),
}))

// Mocks
vi.mock('../auth/auth.middleware.js', () => ({
  authMiddleware: mockAuthMiddleware,
}))

vi.mock('./tag.service.js', () => ({
  tagService: mockTagService,
}))

vi.mock('../contacts/contact.repository.js', () => ({
  findContactById: mockFindContactById,
}))

// Import after mocks
import { tagRoutes } from './tag.routes.js'

// Helper para criar tag mock
const mockTag = (overrides: Partial<{ id: string; nome: string; cor: string }> = {}) => ({
  id: overrides.id ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  nome: overrides.nome ?? 'Tag Teste',
  cor: overrides.cor ?? 'gray',
  createdAt: new Date(),
})

// Helper para criar contato mock
const mockContact = () => ({
  id: 'c1d2e3f4-a5b6-7890-cdef-123456789012',
  telefone: '+5575999123456',
  nome: 'Contato Teste',
})

describe('Tag Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify()
    await app.register(tagRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks to default resolved values
    mockAuthMiddleware.mockResolvedValue(undefined)
    mockTagService.getAll.mockResolvedValue([])
    mockTagService.getById.mockResolvedValue(null)
    mockTagService.create.mockResolvedValue({ tag: null })
    mockTagService.update.mockResolvedValue({ tag: null })
    mockTagService.delete.mockResolvedValue({ success: true })
    mockTagService.getContactTags.mockResolvedValue([])
    mockTagService.addToContact.mockResolvedValue({ success: true })
    mockTagService.removeFromContact.mockResolvedValue({ success: true })
    mockTagService.updateContactTags.mockResolvedValue({ success: true })
    mockTagService.getStatistics.mockResolvedValue([])
    mockFindContactById.mockResolvedValue(null)
  })

  describe('GET /tags', () => {
    it('deve retornar lista de tags', async () => {
      const tags = [mockTag({ nome: 'VIP' }), mockTag({ nome: 'Ativo' })]
      mockTagService.getAll.mockResolvedValue(tags)

      const response = await app.inject({
        method: 'GET',
        url: '/tags',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveLength(2)
    })

    it('deve retornar lista vazia', async () => {
      mockTagService.getAll.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/tags',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual([])
    })
  })

  describe('GET /tags/:id', () => {
    it('deve retornar tag existente', async () => {
      const tag = mockTag()
      mockTagService.getById.mockResolvedValue(tag)

      const response = await app.inject({
        method: 'GET',
        url: `/tags/${tag.id}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().nome).toBe('Tag Teste')
    })

    it('deve retornar 404 para tag inexistente', async () => {
      mockTagService.getById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().message).toBe('Tag nao encontrada')
    })

    it('deve retornar 400 para ID inválido', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tags/id-invalido',
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toBe('ID inválido')
    })
  })

  describe('POST /tags', () => {
    it('deve criar tag com sucesso', async () => {
      const tag = mockTag({ nome: 'Nova Tag' })
      mockTagService.create.mockResolvedValue({ tag })

      const response = await app.inject({
        method: 'POST',
        url: '/tags',
        payload: { nome: 'Nova Tag', cor: 'blue' },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().nome).toBe('Nova Tag')
    })

    it('deve retornar 400 para nome vazio', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tags',
        payload: { nome: '' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 400 para nome muito longo', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tags',
        payload: { nome: 'a'.repeat(51) },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 400 quando nome já existe', async () => {
      mockTagService.create.mockResolvedValue({ error: 'Ja existe uma tag com este nome' })

      const response = await app.inject({
        method: 'POST',
        url: '/tags',
        payload: { nome: 'Existente' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toBe('Ja existe uma tag com este nome')
    })
  })

  describe('PATCH /tags/:id', () => {
    it('deve atualizar tag com sucesso', async () => {
      const tag = mockTag({ nome: 'Atualizada' })
      mockTagService.update.mockResolvedValue({ tag })

      const response = await app.inject({
        method: 'PATCH',
        url: `/tags/${tag.id}`,
        payload: { nome: 'Atualizada' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().nome).toBe('Atualizada')
    })

    it('deve retornar 404 para tag inexistente', async () => {
      mockTagService.update.mockResolvedValue({ error: 'Tag nao encontrada' })

      const response = await app.inject({
        method: 'PATCH',
        url: '/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        payload: { nome: 'Novo Nome' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('deve retornar 400 para ID inválido', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/tags/id-invalido',
        payload: { nome: 'Teste' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /tags/:id', () => {
    it('deve deletar tag com sucesso', async () => {
      mockTagService.delete.mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'DELETE',
        url: '/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })

      expect(response.statusCode).toBe(204)
    })

    it('deve retornar 404 para tag inexistente', async () => {
      mockTagService.delete.mockResolvedValue({ success: false, error: 'Tag nao encontrada' })

      const response = await app.inject({
        method: 'DELETE',
        url: '/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /tags/stats', () => {
    it('deve retornar estatísticas', async () => {
      const stats = [
        { tag: mockTag({ nome: 'VIP' }), contactCount: 10 },
        { tag: mockTag({ nome: 'Ativo' }), contactCount: 5 },
      ]
      mockTagService.getStatistics.mockResolvedValue(stats)

      const response = await app.inject({
        method: 'GET',
        url: '/tags/stats',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveLength(2)
    })
  })

  describe('GET /contacts/:id/tags', () => {
    it('deve retornar tags do contato', async () => {
      const contact = mockContact()
      const tags = [mockTag({ nome: 'VIP' })]
      mockFindContactById.mockResolvedValue(contact)
      mockTagService.getContactTags.mockResolvedValue(tags)

      const response = await app.inject({
        method: 'GET',
        url: `/contacts/${contact.id}/tags`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveLength(1)
    })

    it('deve retornar 404 para contato inexistente', async () => {
      mockFindContactById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/contacts/c1d2e3f4-a5b6-7890-cdef-123456789012/tags',
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().message).toBe('Contato nao encontrado')
    })
  })

  describe('PUT /contacts/:id/tags', () => {
    it('deve atualizar tags do contato', async () => {
      const contact = mockContact()
      const tags = [mockTag({ nome: 'VIP' })]
      mockFindContactById.mockResolvedValue(contact)
      mockTagService.updateContactTags.mockResolvedValue({ success: true })
      mockTagService.getContactTags.mockResolvedValue(tags)

      const response = await app.inject({
        method: 'PUT',
        url: `/contacts/${contact.id}/tags`,
        payload: { tagIds: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] },
      })

      expect(response.statusCode).toBe(200)
    })

    it('deve retornar 400 para tagIds inválidos', async () => {
      const contact = mockContact()
      mockFindContactById.mockResolvedValue(contact)

      const response = await app.inject({
        method: 'PUT',
        url: `/contacts/${contact.id}/tags`,
        payload: { tagIds: ['id-invalido'] },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /contacts/:id/tags/:tagId', () => {
    it('deve adicionar tag ao contato', async () => {
      const contact = mockContact()
      mockFindContactById.mockResolvedValue(contact)
      mockTagService.addToContact.mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'POST',
        url: `/contacts/${contact.id}/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890`,
      })

      expect(response.statusCode).toBe(201)
    })

    it('deve retornar 400 quando tag não existe', async () => {
      const contact = mockContact()
      mockFindContactById.mockResolvedValue(contact)
      mockTagService.addToContact.mockResolvedValue({ success: false, error: 'Tag nao encontrada' })

      const response = await app.inject({
        method: 'POST',
        url: `/contacts/${contact.id}/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890`,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /contacts/:id/tags/:tagId', () => {
    it('deve remover tag do contato', async () => {
      const contact = mockContact()
      mockFindContactById.mockResolvedValue(contact)
      mockTagService.removeFromContact.mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'DELETE',
        url: `/contacts/${contact.id}/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890`,
      })

      expect(response.statusCode).toBe(204)
    })

    it('deve retornar 404 para contato inexistente', async () => {
      mockFindContactById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: '/contacts/c1d2e3f4-a5b6-7890-cdef-123456789012/tags/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
