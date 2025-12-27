/**
 * Unit Tests for RunScheduledAutomationsUseCase
 * Tests time-based automation checks and resuming paused executions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RunScheduledAutomationsUseCase } from './run-scheduled-automations.usecase.js'
import { ExecuteAutomationUseCase } from './execute-automation.usecase.js'
import { Automation } from '../domain/entities/automation.entity.js'
import {
  createAutomationPersistence,
  createExecutionData,
  createMockRepository,
  createMockContact,
} from '../../../__tests__/factories.js'

describe('RunScheduledAutomationsUseCase', () => {
  let useCase: RunScheduledAutomationsUseCase
  let mockRepository: ReturnType<typeof createMockRepository>
  let mockContact: ReturnType<typeof createMockContact>
  let mockExecuteAutomation: {
    handleTrigger: ReturnType<typeof vi.fn>
    resumeExecution: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockContact = createMockContact()
    mockExecuteAutomation = {
      handleTrigger: vi.fn().mockResolvedValue(undefined),
      resumeExecution: vi.fn().mockResolvedValue(undefined),
    }
    useCase = new RunScheduledAutomationsUseCase(
      mockRepository,
      mockContact,
      mockExecuteAutomation as unknown as ExecuteAutomationUseCase
    )
    vi.clearAllMocks()
  })

  function createTestAutomation(overrides: Partial<{
    id: string
    nome: string
    triggerTipo: 'novo_contato' | 'tag_adicionada' | 'tag_removida' | 'jornada_mudou' | 'tempo_sem_interacao' | 'mensagem_recebida'
    triggerConfig: Record<string, unknown>
  }> = {}): Automation {
    const data = createAutomationPersistence({
      id: overrides.id,
      nome: overrides.nome,
      ativo: true,
    })
    return Automation.fromPersistence({
      ...data,
      triggerTipo: overrides.triggerTipo ?? 'tempo_sem_interacao',
      triggerConfig: overrides.triggerConfig ?? { dias: 7 },
      condicoes: [],
      acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
    })
  }

  describe('checkTimeBasedAutomations', () => {
    it('should find automations with tempo_sem_interacao trigger', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue([])

      await useCase.checkTimeBasedAutomations()

      expect(mockRepository.findByTrigger).toHaveBeenCalledWith('tempo_sem_interacao')
    })

    it('should find contacts without interaction for specified days', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 14 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue([])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).toHaveBeenCalledWith(14, 100)
    })

    it('should trigger automation for each contact without interaction', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      const contactIds = ['contact-1', 'contact-2', 'contact-3']

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue(contactIds)

      await useCase.checkTimeBasedAutomations()

      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(3)
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledWith({
        tipo: 'tempo_sem_interacao',
        contatoId: 'contact-1',
        data: { dias: 7 },
      })
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledWith({
        tipo: 'tempo_sem_interacao',
        contatoId: 'contact-2',
        data: { dias: 7 },
      })
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledWith({
        tipo: 'tempo_sem_interacao',
        contatoId: 'contact-3',
        data: { dias: 7 },
      })
    })

    it('should skip automation with invalid dias config (undefined)', async () => {
      // Create an automation with valid dias first, then mock it returning one with undefined
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      // Override the trigger.config.dias to simulate an invalid state
      const automationWithInvalidDias = Object.create(automation)
      Object.defineProperty(automationWithInvalidDias, 'trigger', {
        get: () => ({ tipo: 'tempo_sem_interacao', config: {} }),
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automationWithInvalidDias])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).not.toHaveBeenCalled()
    })

    it('should skip automation with invalid dias config (less than 1)', async () => {
      // Create an automation with valid dias first, then mock it returning one with dias: 0
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      // Override the trigger.config.dias to simulate an invalid state
      const automationWithInvalidDias = Object.create(automation)
      Object.defineProperty(automationWithInvalidDias, 'trigger', {
        get: () => ({ tipo: 'tempo_sem_interacao', config: { dias: 0 } }),
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automationWithInvalidDias])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).not.toHaveBeenCalled()
    })

    it('should process multiple automations with different dias values', async () => {
      const automation7Days = createTestAutomation({
        id: 'auto-7',
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      const automation30Days = createTestAutomation({
        id: 'auto-30',
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 30 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation7Days, automation30Days])
      mockContact.findContactsWithoutInteraction = vi.fn()
        .mockResolvedValueOnce(['contact-1'])
        .mockResolvedValueOnce(['contact-2', 'contact-3'])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).toHaveBeenCalledWith(7, 100)
      expect(mockContact.findContactsWithoutInteraction).toHaveBeenCalledWith(30, 100)
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(3)
    })

    it('should continue processing other contacts when one fails', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      const contactIds = ['contact-1', 'contact-2', 'contact-3']

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue(contactIds)
      mockExecuteAutomation.handleTrigger = vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce(undefined)

      await useCase.checkTimeBasedAutomations()

      // Should still process all 3 contacts
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(3)
    })

    it('should continue processing other automations when one fails', async () => {
      const automation1 = createTestAutomation({
        id: 'auto-1',
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      const automation2 = createTestAutomation({
        id: 'auto-2',
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 14 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation1, automation2])
      mockContact.findContactsWithoutInteraction = vi.fn()
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(['contact-1'])

      await useCase.checkTimeBasedAutomations()

      // Should still process second automation
      expect(mockContact.findContactsWithoutInteraction).toHaveBeenCalledTimes(2)
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(1)
    })

    it('should handle top-level errors gracefully', async () => {
      mockRepository.findByTrigger = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      // Should not throw
      await expect(useCase.checkTimeBasedAutomations()).resolves.toBeUndefined()
    })

    it('should not crash when no automations found', async () => {
      mockRepository.findByTrigger = vi.fn().mockResolvedValue([])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).not.toHaveBeenCalled()
      expect(mockExecuteAutomation.handleTrigger).not.toHaveBeenCalled()
    })

    it('should not crash when no contacts found without interaction', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue([])

      await useCase.checkTimeBasedAutomations()

      expect(mockExecuteAutomation.handleTrigger).not.toHaveBeenCalled()
    })
  })

  describe('resumePausedExecutions', () => {
    it('should find pending executions', async () => {
      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue([])

      await useCase.resumePausedExecutions()

      expect(mockRepository.findPendingExecutions).toHaveBeenCalled()
    })

    it('should resume each pending execution', async () => {
      const executions = [
        createExecutionData({ id: 'exec-1', status: 'aguardando' }),
        createExecutionData({ id: 'exec-2', status: 'aguardando' }),
        createExecutionData({ id: 'exec-3', status: 'aguardando' }),
      ]

      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue(executions)

      await useCase.resumePausedExecutions()

      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledTimes(3)
      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledWith('exec-1')
      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledWith('exec-2')
      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledWith('exec-3')
    })

    it('should not crash when no pending executions found', async () => {
      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue([])

      await useCase.resumePausedExecutions()

      expect(mockExecuteAutomation.resumeExecution).not.toHaveBeenCalled()
    })

    it('should call resume for all pending executions', async () => {
      const executions = [
        createExecutionData({ id: 'exec-1', status: 'aguardando' }),
        createExecutionData({ id: 'exec-2', status: 'aguardando' }),
        createExecutionData({ id: 'exec-3', status: 'aguardando' }),
      ]

      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue(executions)
      mockExecuteAutomation.resumeExecution = vi.fn().mockResolvedValue(undefined)

      await useCase.resumePausedExecutions()

      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledTimes(3)
    })
  })

  describe('run', () => {
    it('should run both checkTimeBasedAutomations and resumePausedExecutions', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      const executions = [
        createExecutionData({ id: 'exec-1', status: 'aguardando' }),
      ]

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue(['contact-1'])
      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue(executions)

      await useCase.run()

      // Check time-based automations
      expect(mockRepository.findByTrigger).toHaveBeenCalledWith('tempo_sem_interacao')
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalled()

      // Resume paused executions
      expect(mockRepository.findPendingExecutions).toHaveBeenCalled()
      expect(mockExecuteAutomation.resumeExecution).toHaveBeenCalledWith('exec-1')
    })

    it('should run checkTimeBasedAutomations first, then resumePausedExecutions', async () => {
      const callOrder: string[] = []

      mockRepository.findByTrigger = vi.fn().mockImplementation(async () => {
        callOrder.push('findByTrigger')
        return []
      })
      mockRepository.findPendingExecutions = vi.fn().mockImplementation(async () => {
        callOrder.push('findPendingExecutions')
        return []
      })

      await useCase.run()

      expect(callOrder).toEqual(['findByTrigger', 'findPendingExecutions'])
    })

    it('should continue to resumePausedExecutions even if checkTimeBasedAutomations fails', async () => {
      mockRepository.findByTrigger = vi.fn().mockRejectedValue(new Error('Database error'))
      mockRepository.findPendingExecutions = vi.fn().mockResolvedValue([])

      await useCase.run()

      expect(mockRepository.findPendingExecutions).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle automation with negative dias value', async () => {
      // Create an automation with valid dias first, then mock it returning one with negative dias
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      // Override the trigger.config.dias to simulate an invalid state
      const automationWithNegativeDias = Object.create(automation)
      Object.defineProperty(automationWithNegativeDias, 'trigger', {
        get: () => ({ tipo: 'tempo_sem_interacao', config: { dias: -5 } }),
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automationWithNegativeDias])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).not.toHaveBeenCalled()
    })

    it('should handle empty contact IDs array', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue([])

      await useCase.checkTimeBasedAutomations()

      expect(mockExecuteAutomation.handleTrigger).not.toHaveBeenCalled()
    })

    it('should handle large number of contacts (pagination limit)', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })
      // Return exactly 100 contacts (the pagination limit)
      const contactIds = Array.from({ length: 100 }, (_, i) => `contact-${i + 1}`)

      mockRepository.findByTrigger = vi.fn().mockResolvedValue([automation])
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue(contactIds)

      await useCase.checkTimeBasedAutomations()

      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(100)
    })

    it('should handle concurrent automation processing', async () => {
      const automations = Array.from({ length: 5 }, (_, i) =>
        createTestAutomation({
          id: `auto-${i + 1}`,
          triggerTipo: 'tempo_sem_interacao',
          triggerConfig: { dias: (i + 1) * 7 },
        })
      )

      mockRepository.findByTrigger = vi.fn().mockResolvedValue(automations)
      mockContact.findContactsWithoutInteraction = vi.fn().mockResolvedValue(['contact-1'])

      await useCase.checkTimeBasedAutomations()

      expect(mockContact.findContactsWithoutInteraction).toHaveBeenCalledTimes(5)
      expect(mockExecuteAutomation.handleTrigger).toHaveBeenCalledTimes(5)
    })
  })
})
