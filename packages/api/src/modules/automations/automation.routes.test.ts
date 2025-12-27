/**
 * Automation Routes Integration Tests
 * Tests for HTTP endpoints in automation.routes.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import Fastify, { FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'

// Mock the database before any imports
vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock whatsapp-client
vi.mock('../../lib/whatsapp-client.js', () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
  sendWhatsAppTemplate: vi.fn().mockResolvedValue(undefined),
}))

// Mock the auth middleware
vi.mock('../auth/auth.middleware.js', () => ({
  authMiddleware: vi.fn(async (request, _reply) => {
    request.admin = {
      sub: 'test-admin',
      email: 'admin@test.com',
      nome: 'Test Admin',
    }
  }),
}))

// Create mock services - these need to be defined inside the mock factory
const mockAutomationService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  execute: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
  getExecutions: vi.fn(),
}

const mockAlertService = {
  getAlerts: vi.fn(),
  getUnreadAlertsCount: vi.fn(),
  markAlertAsRead: vi.fn(),
}

// Mock the services index - use hoisted mocks
vi.mock('./index.js', () => {
  return {
    automationService: {
      getAll: vi.fn(),
      getById: vi.fn(),
      execute: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
      getExecutions: vi.fn(),
    },
    alertService: {
      getAlerts: vi.fn(),
      getUnreadAlertsCount: vi.fn(),
      markAlertAsRead: vi.fn(),
    },
  }
})

import { automationRoutes } from './automation.routes.js'
import { automationService, alertService } from './index.js'
import { Automation } from './domain/entities/automation.entity.js'
import {
  createAutomationInput,
  createAutomationPersistence,
  createExecutionData,
} from '../../__tests__/factories.js'

describe('Automation Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(cookie, { secret: 'test-secret-min-32-chars-long!' })
    await app.register(automationRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== GET /automacoes ====================
  describe('GET /automacoes', () => {
    it('should return list of automations', async () => {
      const mockAutomations = [
        Automation.fromPersistence(createAutomationPersistence({ nome: 'Automation 1' })),
        Automation.fromPersistence(createAutomationPersistence({ nome: 'Automation 2' })),
      ]
      vi.mocked(automationService.getAll).mockResolvedValue(mockAutomations)

      const response = await app.inject({
        method: 'GET',
        url: '/automacoes',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(2)
      expect(body[0].nome).toBe('Automation 1')
      expect(body[1].nome).toBe('Automation 2')
    })

    it('should return empty array when no automations exist', async () => {
      vi.mocked(automationService.getAll).mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/automacoes',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual([])
    })
  })

  // ==================== GET /automacoes/:id ====================
  describe('GET /automacoes/:id', () => {
    it('should return automation by ID', async () => {
      const automationId = uuidv4()
      const mockAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: automationId, nome: 'Test Automation' })
      )
      vi.mocked(automationService.getById).mockResolvedValue(mockAutomation)

      const response = await app.inject({
        method: 'GET',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(automationId)
      expect(body.nome).toBe('Test Automation')
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.getById).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
      expect(body.message).toBe('Automação não encontrada')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/automacoes/invalid-uuid',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
      expect(body.message).toBe('ID inválido')
    })
  })

  // ==================== POST /automacoes ====================
  describe('POST /automacoes', () => {
    it('should create a new automation', async () => {
      const input = createAutomationInput({ nome: 'New Automation' })
      const createdAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: uuidv4(), nome: 'New Automation' })
      )
      vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.nome).toBe('New Automation')
    })

    it('should return 400 when name is missing', async () => {
      const input = { triggerTipo: 'novo_contato', acoes: [{ tipo: 'enviar_mensagem' }] }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
    })

    it('should return 400 when name exceeds 100 characters', async () => {
      const longName = 'a'.repeat(101)
      const input = createAutomationInput({ nome: longName })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
      expect(body.message).toContain('100')
    })

    it('should return 400 when acoes is empty', async () => {
      const input = { nome: 'Test', triggerTipo: 'novo_contato', acoes: [] }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
    })

    it('should return 400 when service returns error', async () => {
      const input = createAutomationInput()
      vi.mocked(automationService.execute).mockResolvedValue({ error: 'Validation error' })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
      expect(body.message).toBe('Validation error')
    })

    it('should validate invalid triggerTipo', async () => {
      const input = { nome: 'Test', triggerTipo: 'invalid_trigger', acoes: [{ tipo: 'enviar_mensagem' }] }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate invalid actionTipo', async () => {
      const input = { nome: 'Test', triggerTipo: 'novo_contato', acoes: [{ tipo: 'invalid_action' }] }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept valid conditions', async () => {
      const input = createAutomationInput({
        condicoes: [{ campo: 'tags', operador: 'contem', valor: 'vip' }],
      })
      const createdAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: uuidv4() })
      )
      vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(201)
    })

    it('should reject invalid condition campo', async () => {
      const input = {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        condicoes: [{ campo: 'invalid_campo', operador: 'igual', valor: 'test' }],
        acoes: [{ tipo: 'enviar_mensagem' }],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept trigger config', async () => {
      const input = createAutomationInput({
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: uuidv4() },
      })
      const createdAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: uuidv4() })
      )
      vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(201)
    })
  })

  // ==================== PATCH /automacoes/:id ====================
  describe('PATCH /automacoes/:id', () => {
    it('should update an automation', async () => {
      const automationId = uuidv4()
      const updateData = { nome: 'Updated Name' }
      const updatedAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: automationId, nome: 'Updated Name' })
      )
      vi.mocked(automationService.update).mockResolvedValue({ automation: updatedAutomation })

      const response = await app.inject({
        method: 'PATCH',
        url: `/automacoes/${automationId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.nome).toBe('Updated Name')
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.update).mockResolvedValue({
        error: 'Automação não encontrada',
      })

      const response = await app.inject({
        method: 'PATCH',
        url: `/automacoes/${automationId}`,
        payload: { nome: 'New Name' },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    it('should return 400 when trying to edit active automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.update).mockResolvedValue({
        error: 'Não é possível editar uma automação ativa',
      })

      const response = await app.inject({
        method: 'PATCH',
        url: `/automacoes/${automationId}`,
        payload: { nome: 'New Name' },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/automacoes/invalid-uuid',
        payload: { nome: 'New Name' },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('ID inválido')
    })

    it('should validate update payload', async () => {
      const automationId = uuidv4()
      const response = await app.inject({
        method: 'PATCH',
        url: `/automacoes/${automationId}`,
        payload: { triggerTipo: 'invalid_trigger' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should allow partial updates', async () => {
      const automationId = uuidv4()
      const updatedAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: automationId })
      )
      vi.mocked(automationService.update).mockResolvedValue({ automation: updatedAutomation })

      const response = await app.inject({
        method: 'PATCH',
        url: `/automacoes/${automationId}`,
        payload: { triggerTipo: 'mensagem_recebida' },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  // ==================== DELETE /automacoes/:id ====================
  describe('DELETE /automacoes/:id', () => {
    it('should delete an automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.delete).mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'DELETE',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.delete).mockResolvedValue({
        success: false,
        error: 'Automação não encontrada',
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    it('should return 400 when trying to delete active automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.delete).mockResolvedValue({
        success: false,
        error: 'Não é possível excluir uma automação ativa',
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/automacoes/invalid-uuid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ==================== POST /automacoes/:id/ativar ====================
  describe('POST /automacoes/:id/ativar', () => {
    it('should activate an automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.activate).mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/ativar`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.activate).mockResolvedValue({
        success: false,
        error: 'Automação não encontrada',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/ativar`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/automacoes/invalid-uuid/ativar',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle already active automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.activate).mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/ativar`,
      })

      expect(response.statusCode).toBe(200)
    })
  })

  // ==================== POST /automacoes/:id/desativar ====================
  describe('POST /automacoes/:id/desativar', () => {
    it('should deactivate an automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.deactivate).mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/desativar`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.deactivate).mockResolvedValue({
        success: false,
        error: 'Automação não encontrada',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/desativar`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/automacoes/invalid-uuid/desativar',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle already inactive automation', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.deactivate).mockResolvedValue({ success: true })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/desativar`,
      })

      expect(response.statusCode).toBe(200)
    })
  })

  // ==================== GET /automacoes/:id/execucoes ====================
  describe('GET /automacoes/:id/execucoes', () => {
    it('should return executions for an automation', async () => {
      const automationId = uuidv4()
      const mockAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: automationId })
      )
      const mockExecutions = [
        createExecutionData({ automacaoId: automationId, status: 'sucesso' }),
        createExecutionData({ automacaoId: automationId, status: 'falha' }),
      ]
      vi.mocked(automationService.getById).mockResolvedValue(mockAutomation)
      vi.mocked(automationService.getExecutions).mockResolvedValue(mockExecutions)

      const response = await app.inject({
        method: 'GET',
        url: `/automacoes/${automationId}/execucoes`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(2)
    })

    it('should return 404 when automation not found', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.getById).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: `/automacoes/${automationId}/execucoes`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/automacoes/invalid-uuid/execucoes',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return empty array when no executions exist', async () => {
      const automationId = uuidv4()
      const mockAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: automationId })
      )
      vi.mocked(automationService.getById).mockResolvedValue(mockAutomation)
      vi.mocked(automationService.getExecutions).mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: `/automacoes/${automationId}/execucoes`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual([])
    })
  })

  // ==================== GET /alertas ====================
  describe('GET /alertas', () => {
    it('should return paginated alerts', async () => {
      const mockAlerts = [
        {
          id: uuidv4(),
          tipo: 'info',
          titulo: 'Test Alert 1',
          mensagem: 'Test message 1',
          lido: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          tipo: 'warning',
          titulo: 'Test Alert 2',
          mensagem: 'Test message 2',
          lido: true,
          createdAt: new Date(),
        },
      ]
      vi.mocked(alertService.getAlerts).mockResolvedValue({ data: mockAlerts, total: 2 })

      const response = await app.inject({
        method: 'GET',
        url: '/alertas',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.total).toBe(2)
    })

    it('should handle pagination parameters', async () => {
      vi.mocked(alertService.getAlerts).mockResolvedValue({ data: [], total: 50 })

      const response = await app.inject({
        method: 'GET',
        url: '/alertas?page=2&limit=10',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.pagination.page).toBe(2)
      expect(body.pagination.limit).toBe(10)
      expect(body.pagination.totalPages).toBe(5)
    })

    it('should use default pagination values', async () => {
      vi.mocked(alertService.getAlerts).mockResolvedValue({ data: [], total: 0 })

      const response = await app.inject({
        method: 'GET',
        url: '/alertas',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(20)
    })
  })

  // ==================== GET /alertas/count ====================
  describe('GET /alertas/count', () => {
    it('should return unread alerts count', async () => {
      vi.mocked(alertService.getUnreadAlertsCount).mockResolvedValue(5)

      const response = await app.inject({
        method: 'GET',
        url: '/alertas/count',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.count).toBe(5)
    })

    it('should return zero when no unread alerts', async () => {
      vi.mocked(alertService.getUnreadAlertsCount).mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/alertas/count',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.count).toBe(0)
    })
  })

  // ==================== PATCH /alertas/:id/lido ====================
  describe('PATCH /alertas/:id/lido', () => {
    it('should mark alert as read', async () => {
      const alertId = uuidv4()
      vi.mocked(alertService.markAlertAsRead).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'PATCH',
        url: `/alertas/${alertId}/lido`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/alertas/invalid-uuid/lido',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('ID inválido')
    })
  })

  // ==================== Validation Edge Cases ====================
  describe('Validation Edge Cases', () => {
    it('should validate condition operador', async () => {
      const input = {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        condicoes: [{ campo: 'tags', operador: 'invalid_operador', valor: 'test' }],
        acoes: [{ tipo: 'enviar_mensagem' }],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept array values for conditions', async () => {
      const input = createAutomationInput({
        condicoes: [{ campo: 'tags', operador: 'contem', valor: ['tag1', 'tag2'] }],
      })
      const createdAutomation = Automation.fromPersistence(
        createAutomationPersistence({ id: uuidv4() })
      )
      vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(201)
    })

    it('should validate action config fields', async () => {
      const input = {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [
          {
            tipo: 'aguardar',
            config: { dias: 0 }, // dias should be >= 1
          },
        ],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate trigger config tagId is UUID', async () => {
      const input = {
        nome: 'Test',
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'not-a-uuid' },
        acoes: [{ tipo: 'enviar_mensagem' }],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/automacoes',
        payload: input,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept all valid trigger types', async () => {
      const triggerTypes = [
        'novo_contato',
        'tag_adicionada',
        'tag_removida',
        'jornada_mudou',
        'tempo_sem_interacao',
        'mensagem_recebida',
      ]

      for (const triggerTipo of triggerTypes) {
        const input = createAutomationInput({ triggerTipo: triggerTipo as any })
        const createdAutomation = Automation.fromPersistence(
          createAutomationPersistence({ id: uuidv4() })
        )
        vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

        const response = await app.inject({
          method: 'POST',
          url: '/automacoes',
          payload: input,
        })

        expect(response.statusCode).toBe(201)
      }
    })

    it('should accept all valid action types', async () => {
      const actionTypes = [
        'enviar_mensagem',
        'enviar_template',
        'adicionar_tag',
        'remover_tag',
        'mudar_jornada',
        'notificar_admin',
        'aguardar',
      ]

      for (const actionTipo of actionTypes) {
        const input = {
          nome: 'Test',
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: actionTipo }],
        }
        const createdAutomation = Automation.fromPersistence(
          createAutomationPersistence({ id: uuidv4() })
        )
        vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

        const response = await app.inject({
          method: 'POST',
          url: '/automacoes',
          payload: input,
        })

        expect(response.statusCode).toBe(201)
      }
    })

    it('should accept all valid condition campos', async () => {
      const campos = ['tags', 'estadoJornada', 'origem', 'idade', 'instrumentoDesejado']

      for (const campo of campos) {
        const input = createAutomationInput({
          condicoes: [{ campo: campo as any, operador: 'igual', valor: 'test' }],
        })
        const createdAutomation = Automation.fromPersistence(
          createAutomationPersistence({ id: uuidv4() })
        )
        vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

        const response = await app.inject({
          method: 'POST',
          url: '/automacoes',
          payload: input,
        })

        expect(response.statusCode).toBe(201)
      }
    })

    it('should accept all valid condition operators', async () => {
      const operadores = ['igual', 'diferente', 'contem', 'nao_contem']

      for (const operador of operadores) {
        const input = createAutomationInput({
          condicoes: [{ campo: 'tags', operador: operador as any, valor: 'test' }],
        })
        const createdAutomation = Automation.fromPersistence(
          createAutomationPersistence({ id: uuidv4() })
        )
        vi.mocked(automationService.execute).mockResolvedValue({ automation: createdAutomation })

        const response = await app.inject({
          method: 'POST',
          url: '/automacoes',
          payload: input,
        })

        expect(response.statusCode).toBe(201)
      }
    })
  })

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should handle service errors gracefully for activate', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.activate).mockResolvedValue({
        success: false,
        error: 'Internal error',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/ativar`,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle service errors gracefully for deactivate', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.deactivate).mockResolvedValue({
        success: false,
        error: 'Internal error',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/desativar`,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle delete with no error message', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.delete).mockResolvedValue({
        success: false,
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/automacoes/${automationId}`,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Erro ao excluir')
    })

    it('should handle activate with no error message', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.activate).mockResolvedValue({
        success: false,
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/ativar`,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Erro ao ativar')
    })

    it('should handle deactivate with no error message', async () => {
      const automationId = uuidv4()
      vi.mocked(automationService.deactivate).mockResolvedValue({
        success: false,
      })

      const response = await app.inject({
        method: 'POST',
        url: `/automacoes/${automationId}/desativar`,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Erro ao desativar')
    })
  })
})
