/**
 * Testes unitários para AutomationUseCases
 * Testa: execute, update, delete, activate, deactivate, getAll, getById, getExecutions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AutomationUseCases } from './create-automation.usecase.js'
import { Automation } from '../domain/entities/automation.entity.js'
import type { AutomationRepositoryPort } from '../domain/ports/automation.repository.port.js'
import type { EventPublisherPort } from '../domain/ports/event-publisher.port.js'
import {
  createAutomationInputFactory,
  automationPersistenceFactory,
} from '../../../__tests__/factories/index.js'

// Factory para criar mock do repository
const createMockRepository = (
  overrides: Partial<AutomationRepositoryPort> = {}
): AutomationRepositoryPort => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findActive: vi.fn().mockResolvedValue([]),
  findByTrigger: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
  findExecutionById: vi.fn().mockResolvedValue(null),
  findExecutionsByAutomation: vi.fn().mockResolvedValue([]),
  findPendingExecutions: vi.fn().mockResolvedValue([]),
  createExecution: vi.fn().mockResolvedValue({ id: 'exec-1', automacaoId: '', contatoId: '', status: 'executando', acoesExecutadas: [], createdAt: new Date() }),
  updateExecution: vi.fn().mockResolvedValue(null),
  hasRecentExecution: vi.fn().mockResolvedValue(false),
  ...overrides,
})

// Factory para criar mock do event publisher
const createMockEventPublisher = (
  overrides: Partial<EventPublisherPort> = {}
): EventPublisherPort => ({
  publish: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn(),
  ...overrides,
})

describe('AutomationUseCases', () => {
  let repository: AutomationRepositoryPort
  let eventPublisher: EventPublisherPort
  let useCases: AutomationUseCases

  beforeEach(() => {
    vi.clearAllMocks()
    repository = createMockRepository()
    eventPublisher = createMockEventPublisher()
    useCases = new AutomationUseCases(repository, eventPublisher)
  })

  describe('execute (create)', () => {
    it('deve criar automação com sucesso', async () => {
      const input = createAutomationInputFactory.build({
        nome: 'Boas-vindas',
        triggerTipo: 'novo_contato',
      })

      const result = await useCases.execute(input)

      expect(result.automation).toBeDefined()
      expect(result.automation?.nome).toBe('Boas-vindas')
      expect(result.error).toBeUndefined()
    })

    it('deve salvar automação no repositório', async () => {
      const input = createAutomationInputFactory.build()

      await useCases.execute(input)

      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(repository.save).toHaveBeenCalledWith(expect.any(Automation))
    })

    it('deve publicar evento de criação', async () => {
      const input = createAutomationInputFactory.build({
        nome: 'Teste Evento',
        triggerTipo: 'tag_adicionada',
      })

      await useCases.execute(input)

      expect(eventPublisher.publish).toHaveBeenCalledTimes(1)
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.created',
        })
      )
    })

    it('deve retornar erro quando validação falha', async () => {
      const input = createAutomationInputFactory.build({ nome: '' })

      const result = await useCases.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Nome deve ter entre 1 e 100 caracteres')
    })

    it('deve retornar erro quando repository falha', async () => {
      repository = createMockRepository({
        save: vi.fn().mockRejectedValue(new Error('DB Error')),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)
      const input = createAutomationInputFactory.build()

      const result = await useCases.execute(input)

      expect(result.error).toBe('DB Error')
    })
  })

  describe('update', () => {
    it('deve atualizar automação existente', async () => {
      const existingData = automationPersistenceFactory.build({
        id: 'auto-123',
        ativo: false,
      })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.update('auto-123', { nome: 'Novo Nome' })

      expect(result.automation).toBeDefined()
      expect(result.automation?.nome).toBe('Novo Nome')
    })

    it('deve salvar automação atualizada', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.update(existingData.id, { nome: 'Atualizado' })

      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando automação não existe', async () => {
      const result = await useCases.update('inexistente', { nome: 'Novo' })

      expect(result.error).toBe('Automação não encontrada')
      expect(result.automation).toBeUndefined()
    })

    it('deve retornar erro quando automação está ativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.update(existingData.id, { nome: 'Novo' })

      expect(result.error).toBe('Não é possível editar uma automação ativa')
    })

    it('deve retornar erro quando validação do update falha', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.update(existingData.id, { nome: '' })

      expect(result.error).toBe('Nome deve ter entre 1 e 100 caracteres')
    })
  })

  describe('delete', () => {
    it('deve deletar automação inativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
        delete: vi.fn().mockResolvedValue(true),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.delete(existingData.id)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('deve chamar repository.delete', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.delete(existingData.id)

      expect(repository.delete).toHaveBeenCalledWith(existingData.id)
    })

    it('deve retornar erro quando automação não existe', async () => {
      const result = await useCases.delete('inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
    })

    it('deve retornar erro quando automação está ativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.delete(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Não é possível excluir uma automação ativa')
    })

    it('deve retornar erro quando repository falha', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
        delete: vi.fn().mockRejectedValue(new Error('Delete failed')),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.delete(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('activate', () => {
    it('deve ativar automação inativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.activate(existingData.id)

      expect(result.success).toBe(true)
    })

    it('deve salvar automação após ativar', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.activate(existingData.id)

      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('deve publicar evento de ativação', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.activate(existingData.id)

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.activated',
        })
      )
    })

    it('deve retornar sucesso quando já está ativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.activate(existingData.id)

      expect(result.success).toBe(true)
      // Não deve salvar nem publicar evento se já estava ativa
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando automação não existe', async () => {
      const result = await useCases.activate('inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
    })

    it('deve retornar erro quando repository falha', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
        save: vi.fn().mockRejectedValue(new Error('Save failed')),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.activate(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Save failed')
    })
  })

  describe('deactivate', () => {
    it('deve desativar automação ativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.deactivate(existingData.id)

      expect(result.success).toBe(true)
    })

    it('deve salvar automação após desativar', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.deactivate(existingData.id)

      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('deve publicar evento de desativação', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      await useCases.deactivate(existingData.id)

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.deactivated',
        })
      )
    })

    it('deve retornar sucesso quando já está inativa', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: false })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.deactivate(existingData.id)

      expect(result.success).toBe(true)
      // Não deve salvar nem publicar evento se já estava inativa
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando automação não existe', async () => {
      const result = await useCases.deactivate('inexistente')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
    })

    it('deve retornar erro quando repository falha', async () => {
      const existingData = automationPersistenceFactory.build({ ativo: true })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
        save: vi.fn().mockRejectedValue(new Error('Save failed')),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.deactivate(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Save failed')
    })
  })

  describe('getAll', () => {
    it('deve retornar lista vazia quando não há automações', async () => {
      const result = await useCases.getAll()

      expect(result).toEqual([])
    })

    it('deve retornar todas as automações', async () => {
      const automations = [
        Automation.fromPersistence(automationPersistenceFactory.build()),
        Automation.fromPersistence(automationPersistenceFactory.build()),
      ]
      repository = createMockRepository({
        findAll: vi.fn().mockResolvedValue(automations),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.getAll()

      expect(result).toHaveLength(2)
    })
  })

  describe('getById', () => {
    it('deve retornar automação quando existe', async () => {
      const existingData = automationPersistenceFactory.build({ id: 'auto-123' })
      const existingAutomation = Automation.fromPersistence(existingData)
      repository = createMockRepository({
        findById: vi.fn().mockResolvedValue(existingAutomation),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.getById('auto-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('auto-123')
    })

    it('deve retornar null quando não existe', async () => {
      const result = await useCases.getById('inexistente')

      expect(result).toBeNull()
    })
  })

  describe('getExecutions', () => {
    it('deve retornar execuções da automação', async () => {
      const executions = [
        { id: 'exec-1', automacaoId: 'auto-123', status: 'sucesso' },
        { id: 'exec-2', automacaoId: 'auto-123', status: 'falha' },
      ]
      repository = createMockRepository({
        findExecutionsByAutomation: vi.fn().mockResolvedValue(executions),
      })
      useCases = new AutomationUseCases(repository, eventPublisher)

      const result = await useCases.getExecutions('auto-123')

      expect(result).toHaveLength(2)
      expect(repository.findExecutionsByAutomation).toHaveBeenCalledWith('auto-123')
    })

    it('deve retornar lista vazia quando não há execuções', async () => {
      const result = await useCases.getExecutions('auto-sem-execucoes')

      expect(result).toEqual([])
    })
  })
})
