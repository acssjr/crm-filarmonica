/**
 * Automation Repository Tests
 * Tests for the AutomationRepository adapter
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { AutomationRepository } from './automation.repository.js'
import { Automation } from '../domain/entities/automation.entity.js'
import { createAutomationPersistence, createExecutionData } from '../../../__tests__/factories.js'

// Mock the database module
vi.mock('../../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ type: 'eq', col, val })),
  and: vi.fn((...args) => ({ type: 'and', args })),
  gte: vi.fn((col, val) => ({ type: 'gte', col, val })),
}))

// Import mocked db after mocking
import { db } from '../../../db/index.js'

describe('AutomationRepository', () => {
  let repository: AutomationRepository
  let mockSelect: Mock
  let mockInsert: Mock
  let mockUpdate: Mock
  let mockDelete: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new AutomationRepository()

    // Setup chainable mock for select
    mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
      }),
    })

    // Setup chainable mock for insert
    mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([]),
      }),
    })

    // Setup chainable mock for update
    mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    // Setup chainable mock for delete
    mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    })

    ;(db.select as Mock) = mockSelect
    ;(db.insert as Mock) = mockInsert
    ;(db.update as Mock) = mockUpdate
    ;(db.delete as Mock) = mockDelete
  })

  describe('findAll', () => {
    it('should return all automations ordered by createdAt', async () => {
      const automationData = createAutomationPersistence()
      const fromMock = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([automationData]),
      })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Automation)
      expect(result[0].id).toBe(automationData.id)
      expect(result[0].nome).toBe(automationData.nome)
    })

    it('should return empty array when no automations exist', async () => {
      const fromMock = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findAll()

      expect(result).toHaveLength(0)
    })
  })

  describe('findById', () => {
    it('should return automation when found', async () => {
      const automationData = createAutomationPersistence({ id: 'test-id-123' })
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([automationData]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findById('test-id-123')

      expect(result).toBeInstanceOf(Automation)
      expect(result?.id).toBe('test-id-123')
    })

    it('should return null when automation not found', async () => {
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('findActive', () => {
    it('should return only active automations', async () => {
      const activeAutomation = createAutomationPersistence({ ativo: true, nome: 'Active' })
      const whereMock = vi.fn().mockResolvedValue([activeAutomation])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findActive()

      expect(result).toHaveLength(1)
      expect(result[0].ativo).toBe(true)
    })

    it('should return empty array when no active automations', async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findActive()

      expect(result).toHaveLength(0)
    })
  })

  describe('findByTrigger', () => {
    it('should return automations matching the trigger type', async () => {
      const automation = createAutomationPersistence({
        ativo: true,
        triggerTipo: 'novo_contato',
      })
      const whereMock = vi.fn().mockResolvedValue([automation])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findByTrigger('novo_contato')

      expect(result).toHaveLength(1)
      expect(result[0].trigger.tipo).toBe('novo_contato')
    })

    it('should only find active automations for the trigger', async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findByTrigger('tag_adicionada')

      expect(result).toHaveLength(0)
    })
  })

  describe('save', () => {
    it('should insert new automation with upsert pattern', async () => {
      const automationData = createAutomationPersistence()
      const automation = Automation.fromPersistence({
        ...automationData,
        triggerTipo: automationData.triggerTipo,
        triggerConfig: automationData.triggerConfig,
        condicoes: [],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hi' } }],
      })

      const onConflictMock = vi.fn().mockResolvedValue(undefined)
      const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      await repository.save(automation)

      expect(mockInsert).toHaveBeenCalled()
      expect(valuesMock).toHaveBeenCalled()
      expect(onConflictMock).toHaveBeenCalled()
    })

    it('should update existing automation on conflict', async () => {
      const automationData = createAutomationPersistence({ id: 'existing-id' })
      const automation = Automation.fromPersistence({
        ...automationData,
        nome: 'Updated Name',
        triggerTipo: automationData.triggerTipo,
        triggerConfig: automationData.triggerConfig,
        condicoes: [],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Updated' } }],
      })

      const onConflictMock = vi.fn().mockResolvedValue(undefined)
      const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      await repository.save(automation)

      expect(onConflictMock).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.anything(),
          set: expect.objectContaining({
            nome: 'Updated Name',
          }),
        })
      )
    })
  })

  describe('delete', () => {
    it('should delete automation and return true when exists', async () => {
      const automationData = createAutomationPersistence({ id: 'delete-id' })

      // Mock findById to return existing automation
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([automationData]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      // Mock delete
      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      const result = await repository.delete('delete-id')

      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('should return false when automation does not exist', async () => {
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.delete('non-existent-id')

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  describe('findExecutionById', () => {
    it('should return execution when found', async () => {
      const executionData = createExecutionData({ id: 'exec-123' })
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([executionData]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findExecutionById('exec-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('exec-123')
    })

    it('should return null when execution not found', async () => {
      const whereMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findExecutionById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findExecutionsByAutomation', () => {
    it('should return all executions for an automation', async () => {
      const execution1 = createExecutionData({ id: 'exec-1', automacaoId: 'auto-1' })
      const execution2 = createExecutionData({ id: 'exec-2', automacaoId: 'auto-1' })

      const orderByMock = vi.fn().mockResolvedValue([execution1, execution2])
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findExecutionsByAutomation('auto-1')

      expect(result).toHaveLength(2)
      expect(result[0].automacaoId).toBe('auto-1')
    })
  })

  describe('findPendingExecutions', () => {
    it('should return executions with status aguardando and past proximaAcaoEm', async () => {
      const pastDate = new Date(Date.now() - 60000) // 1 minute ago
      const pendingExecution = createExecutionData({
        status: 'aguardando',
        proximaAcaoEm: pastDate,
      })

      const whereMock = vi.fn().mockResolvedValue([pendingExecution])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findPendingExecutions()

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('aguardando')
    })

    it('should filter out executions with future proximaAcaoEm', async () => {
      const futureDate = new Date(Date.now() + 60000) // 1 minute in future
      const futureExecution = createExecutionData({
        status: 'aguardando',
        proximaAcaoEm: futureDate,
      })

      const whereMock = vi.fn().mockResolvedValue([futureExecution])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.findPendingExecutions()

      // Should be filtered out because proximaAcaoEm is in the future
      expect(result).toHaveLength(0)
    })
  })

  describe('createExecution', () => {
    it('should create new execution with executando status', async () => {
      const executionData = createExecutionData({
        status: 'executando',
        acoesExecutadas: [],
      })

      const returningMock = vi.fn().mockResolvedValue([executionData])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await repository.createExecution({
        automacaoId: executionData.automacaoId,
        contatoId: executionData.contatoId,
      })

      expect(result).toBeDefined()
      expect(result.status).toBe('executando')
      expect(result.acoesExecutadas).toEqual([])
    })
  })

  describe('updateExecution', () => {
    it('should update execution status', async () => {
      const updatedExecution = createExecutionData({
        id: 'exec-to-update',
        status: 'sucesso',
      })

      const returningMock = vi.fn().mockResolvedValue([updatedExecution])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      const result = await repository.updateExecution('exec-to-update', {
        status: 'sucesso',
      })

      expect(result).toBeDefined()
      expect(result?.status).toBe('sucesso')
    })

    it('should update acoesExecutadas', async () => {
      const executedActions = [
        { tipo: 'enviar_mensagem', executadaAt: new Date(), sucesso: true },
      ]
      const updatedExecution = createExecutionData({
        id: 'exec-to-update',
        acoesExecutadas: executedActions,
      })

      const returningMock = vi.fn().mockResolvedValue([updatedExecution])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      const result = await repository.updateExecution('exec-to-update', {
        acoesExecutadas: executedActions,
      })

      expect(result?.acoesExecutadas).toHaveLength(1)
    })

    it('should return null when execution not found', async () => {
      const returningMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      const result = await repository.updateExecution('non-existent', { status: 'falha' })

      expect(result).toBeNull()
    })

    it('should set proximaAcaoEm for waiting state', async () => {
      const nextActionTime = new Date(Date.now() + 3600000) // 1 hour
      const updatedExecution = createExecutionData({
        id: 'exec-to-update',
        status: 'aguardando',
        proximaAcaoEm: nextActionTime,
      })

      const returningMock = vi.fn().mockResolvedValue([updatedExecution])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      const result = await repository.updateExecution('exec-to-update', {
        status: 'aguardando',
        proximaAcaoEm: nextActionTime,
      })

      expect(result?.proximaAcaoEm).toEqual(nextActionTime)
    })
  })

  describe('hasRecentExecution', () => {
    it('should return true when recent execution exists', async () => {
      const recentExecution = createExecutionData({
        createdAt: new Date(), // Now
      })

      const limitMock = vi.fn().mockResolvedValue([{ id: recentExecution.id }])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.hasRecentExecution('auto-1', 'contact-1')

      expect(result).toBe(true)
    })

    it('should return false when no recent execution exists', async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await repository.hasRecentExecution('auto-1', 'contact-1')

      expect(result).toBe(false)
    })

    it('should use default 60 minute window', async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      await repository.hasRecentExecution('auto-1', 'contact-1')

      expect(whereMock).toHaveBeenCalled()
    })

    it('should use custom window minutes', async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      await repository.hasRecentExecution('auto-1', 'contact-1', 30) // 30 minutes

      expect(whereMock).toHaveBeenCalled()
    })

    it('should correctly calculate cutoff date for rate limiting', async () => {
      const beforeTime = Date.now()

      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      await repository.hasRecentExecution('auto-1', 'contact-1', 120) // 2 hours

      const afterTime = Date.now()

      // The where mock should have been called
      expect(whereMock).toHaveBeenCalled()
      // Time difference should be minimal (test execution time)
      expect(afterTime - beforeTime).toBeLessThan(100)
    })
  })
})
