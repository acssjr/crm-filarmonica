/**
 * Unit Tests for ExecuteAutomationUseCase
 * Tests trigger handling, action execution, retry logic, rate limiting, condition evaluation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ExecuteAutomationUseCase, ExecuteAutomationDeps } from './execute-automation.usecase.js'
import { Automation } from '../domain/entities/automation.entity.js'
import { TriggerEvent } from '../domain/value-objects/trigger.vo.js'
import {
  createAutomationPersistence,
  createContactData,
  createExecutionData,
  createMockRepository,
  createMockEventPublisher,
  createMockMessageSender,
  createMockNotification,
  createMockContact,
  createMockTemplate,
} from '../../../__tests__/factories.js'

describe('ExecuteAutomationUseCase', () => {
  let useCase: ExecuteAutomationUseCase
  let deps: ExecuteAutomationDeps

  beforeEach(() => {
    deps = {
      repository: createMockRepository(),
      messageSender: createMockMessageSender(),
      notification: createMockNotification(),
      contact: createMockContact(),
      template: createMockTemplate(),
      eventPublisher: createMockEventPublisher(),
    }
    useCase = new ExecuteAutomationUseCase(deps)
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createTestAutomation(overrides: Partial<{
    id: string
    nome: string
    ativo: boolean
    triggerTipo: 'novo_contato' | 'tag_adicionada' | 'tag_removida' | 'jornada_mudou' | 'tempo_sem_interacao' | 'mensagem_recebida'
    triggerConfig: Record<string, unknown>
    condicoes: Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>
    acoes: Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>
  }> = {}): Automation {
    const data = createAutomationPersistence({
      id: overrides.id,
      nome: overrides.nome,
      ativo: overrides.ativo ?? true,
    })
    return Automation.fromPersistence({
      ...data,
      triggerTipo: overrides.triggerTipo ?? 'novo_contato',
      triggerConfig: overrides.triggerConfig ?? {},
      condicoes: overrides.condicoes ?? [],
      acoes: overrides.acoes ?? [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
    })
  }

  describe('handleTrigger', () => {
    it('should find and execute matching automations for novo_contato trigger', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Welcome!' } }],
      })
      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: 'contact-123',
      }
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
      deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
      deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Welcome!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.handleTrigger(event)

      expect(deps.repository.findByTrigger).toHaveBeenCalledWith('novo_contato')
      expect(deps.repository.hasRecentExecution).toHaveBeenCalledWith(automation.id, 'contact-123', 60)
      expect(deps.contact.getContactData).toHaveBeenCalledWith('contact-123')
      expect(deps.repository.createExecution).toHaveBeenCalled()
      expect(deps.messageSender.sendMessage).toHaveBeenCalled()
    })

    it('should skip automation when trigger config does not match (tag_adicionada with wrong tagId)', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip-tag' },
      })
      const event: TriggerEvent = {
        tipo: 'tag_adicionada',
        contatoId: 'contact-123',
        data: { tagId: 'other-tag' },
      }

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])

      await useCase.handleTrigger(event)

      expect(deps.repository.hasRecentExecution).not.toHaveBeenCalled()
      expect(deps.repository.createExecution).not.toHaveBeenCalled()
    })

    it('should match automation when trigger config matches (tag_adicionada with correct tagId)', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip-tag' },
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'VIP welcome!' } }],
      })
      const event: TriggerEvent = {
        tipo: 'tag_adicionada',
        contatoId: 'contact-123',
        data: { tagId: 'vip-tag' },
      }
      const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
      deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
      deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('VIP welcome!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.handleTrigger(event)

      expect(deps.repository.createExecution).toHaveBeenCalled()
    })

    it('should match mensagem_recebida trigger with keyword', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'interessado' },
        acoes: [{ tipo: 'adicionar_tag', config: { tagId: 'lead-quente' } }],
      })
      const event: TriggerEvent = {
        tipo: 'mensagem_recebida',
        contatoId: 'contact-123',
        data: { mensagem: 'Estou interessado em matricula' },
      }
      const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
      deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
      deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.contact.addTag = vi.fn().mockResolvedValue({ success: true })

      await useCase.handleTrigger(event)

      expect(deps.contact.addTag).toHaveBeenCalledWith('contact-123', 'lead-quente')
    })

    it('should not match mensagem_recebida trigger when keyword is missing', async () => {
      const automation = createTestAutomation({
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'interessado' },
      })
      const event: TriggerEvent = {
        tipo: 'mensagem_recebida',
        contatoId: 'contact-123',
        data: { mensagem: 'Oi, tudo bem?' },
      }

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])

      await useCase.handleTrigger(event)

      expect(deps.repository.createExecution).not.toHaveBeenCalled()
    })

    describe('rate limiting', () => {
      it('should skip automation when recent execution exists (rate limiting)', async () => {
        const automation = createTestAutomation({
          triggerTipo: 'novo_contato',
        })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(true)

        await useCase.handleTrigger(event)

        expect(deps.repository.hasRecentExecution).toHaveBeenCalledWith(automation.id, 'contact-123', 60)
        expect(deps.repository.createExecution).not.toHaveBeenCalled()
      })

      it('should process automation when no recent execution exists', async () => {
        const automation = createTestAutomation()
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
        const contact = createContactData({ id: 'contact-123' })

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
        deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
        deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
        deps.contact.findById = vi.fn().mockResolvedValue(contact)
        deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
        deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).toHaveBeenCalled()
      })
    })

    describe('condition evaluation', () => {
      it('should skip automation when conditions are not met', async () => {
        const automation = createTestAutomation({
          condicoes: [{ campo: 'origem', operador: 'igual', valor: 'campanha' }],
        })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const contact = createContactData({ origem: 'organico' }) // Different origin

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).not.toHaveBeenCalled()
      })

      it('should execute automation when all conditions are met', async () => {
        const automation = createTestAutomation({
          condicoes: [
            { campo: 'origem', operador: 'igual', valor: 'organico' },
            { campo: 'tags', operador: 'contem', valor: ['interessado'] },
          ],
        })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
        const contact = createContactData({
          id: 'contact-123',
          origem: 'organico',
          tags: ['interessado', 'jovem'],
        })

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
        deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
        deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
        deps.contact.findById = vi.fn().mockResolvedValue(contact)
        deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
        deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).toHaveBeenCalled()
      })

      it('should execute automation when no conditions defined', async () => {
        const automation = createTestAutomation({ condicoes: [] })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
        const contact = createContactData({ id: 'contact-123' })

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
        deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
        deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
        deps.contact.findById = vi.fn().mockResolvedValue(contact)
        deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
        deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).toHaveBeenCalled()
      })

      it('should evaluate tags condition with contem operator', async () => {
        const automation = createTestAutomation({
          condicoes: [{ campo: 'tags', operador: 'contem', valor: ['vip'] }],
        })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
        const contact = createContactData({
          id: 'contact-123',
          tags: ['vip', 'premium'],
        })

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
        deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
        deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
        deps.contact.findById = vi.fn().mockResolvedValue(contact)
        deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
        deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).toHaveBeenCalled()
      })

      it('should evaluate tags condition with nao_contem operator', async () => {
        const automation = createTestAutomation({
          condicoes: [{ campo: 'tags', operador: 'nao_contem', valor: ['spam'] }],
        })
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }
        const execution = createExecutionData({ automacaoId: automation.id, contatoId: 'contact-123' })
        const contact = createContactData({
          id: 'contact-123',
          tags: ['interessado'],
        })

        deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
        deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
        deps.contact.getContactData = vi.fn().mockResolvedValue(contact)
        deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
        deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
        deps.contact.findById = vi.fn().mockResolvedValue(contact)
        deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
        deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

        await useCase.handleTrigger(event)

        expect(deps.repository.createExecution).toHaveBeenCalled()
      })
    })

    it('should skip when contact not found', async () => {
      const automation = createTestAutomation()
      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: 'contact-123',
      }

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation])
      deps.repository.hasRecentExecution = vi.fn().mockResolvedValue(false)
      deps.contact.getContactData = vi.fn().mockResolvedValue(null)

      await useCase.handleTrigger(event)

      expect(deps.repository.createExecution).not.toHaveBeenCalled()
    })

    it('should continue processing other automations when one fails', async () => {
      const automation1 = createTestAutomation({ id: 'auto-1' })
      const automation2 = createTestAutomation({ id: 'auto-2' })
      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: 'contact-123',
      }
      const execution = createExecutionData({ automacaoId: 'auto-2', contatoId: 'contact-123' })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.findByTrigger = vi.fn().mockResolvedValue([automation1, automation2])
      deps.repository.hasRecentExecution = vi.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
      deps.contact.getContactData = vi.fn()
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(contact)
      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.handleTrigger(event)

      // Second automation should still be processed
      expect(deps.repository.createExecution).toHaveBeenCalledTimes(1)
    })
  })

  describe('executeAutomation', () => {
    it('should create execution record and publish event', async () => {
      const automation = createTestAutomation()
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.repository.createExecution).toHaveBeenCalledWith({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      expect(deps.eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.execution.started',
        })
      )
    })
  })

  describe('action execution', () => {
    it('should execute enviar_mensagem action', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello {{nome}}!' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123', telefone: '+5575988123456' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello Joao!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.template.renderForContact).toHaveBeenCalledWith('Hello {{nome}}!', 'contact-123')
      expect(deps.messageSender.sendMessage).toHaveBeenCalledWith('+5575988123456', 'Hello Joao!')
    })

    it('should execute enviar_template action', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_template', config: { templateId: 'template-123' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123', telefone: '+5575988123456' })
      const template = { id: 'template-123', conteudo: 'Template content {{nome}}' }

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.findById = vi.fn().mockResolvedValue(template)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Template content Joao')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.template.findById).toHaveBeenCalledWith('template-123')
      expect(deps.messageSender.sendMessage).toHaveBeenCalledWith('+5575988123456', 'Template content Joao')
    })

    it('should fail when template not found', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_template', config: { templateId: 'non-existent' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.findById = vi.fn().mockResolvedValue(null)

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
          erro: expect.stringContaining('Template não encontrado'),
        })
      )
    })

    it('should execute adicionar_tag action', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'adicionar_tag', config: { tagId: 'vip-tag' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.contact.addTag = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.contact.addTag).toHaveBeenCalledWith('contact-123', 'vip-tag')
    })

    it('should execute remover_tag action', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'remover_tag', config: { tagId: 'spam-tag' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.contact.removeTag = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.contact.removeTag).toHaveBeenCalledWith('contact-123', 'spam-tag')
    })

    it('should execute mudar_jornada action', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'mudar_jornada', config: { estado: 'qualificado' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.contact.updateJourneyState = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.contact.updateJourneyState).toHaveBeenCalledWith('contact-123', 'qualificado')
    })

    it('should execute notificar_admin action', async () => {
      const automation = createTestAutomation({
        acoes: [{
          tipo: 'notificar_admin',
          config: { adminPhone: '+5575999999999', mensagem: 'Novo lead: {{nome}}' },
        }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Novo lead: Joao')
      deps.notification.notifyAdminWhatsApp = vi.fn().mockResolvedValue({ success: true })
      deps.notification.createPanelAlert = vi.fn().mockResolvedValue(undefined)

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.notification.notifyAdminWhatsApp).toHaveBeenCalledWith('+5575999999999', 'Novo lead: Joao')
      expect(deps.notification.createPanelAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'info',
          contatoId: 'contact-123',
          automacaoId: automation.id,
        })
      )
    })

    it('should fail for unsupported action type', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
      })
      // Override acoes directly to test unsupported type
      const hackedAutomation = Object.create(automation)
      Object.defineProperty(hackedAutomation, 'acoes', {
        get: () => [{ tipo: 'unknown_action', config: {} }],
      })
      Object.defineProperty(hackedAutomation, 'id', { get: () => automation.id })
      Object.defineProperty(hackedAutomation, 'nome', { get: () => automation.nome })

      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)

      await useCase.executeAutomation(hackedAutomation, 'contact-123')

      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
          erro: expect.stringContaining('não suportada'),
        })
      )
    })
  })

  describe('delay actions (aguardar)', () => {
    it('should pause execution on aguardar action', async () => {
      const automation = createTestAutomation({
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } },
          { tipo: 'aguardar', config: { dias: 3 } },
          { tipo: 'enviar_mensagem', config: { mensagem: 'Follow up!' } },
        ],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      // Should have paused after first message and delay
      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'aguardando',
          proximaAcaoEm: expect.any(Date),
        })
      )
      expect(deps.eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.execution.paused',
        })
      )
      // Should NOT have sent the follow-up message yet
      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('resumeExecution', () => {
    it('should resume paused execution from correct action index', async () => {
      const automation = createTestAutomation({
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } },
          { tipo: 'aguardar', config: { dias: 1 } },
          { tipo: 'enviar_mensagem', config: { mensagem: 'Follow up!' } },
        ],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
        status: 'aguardando',
        acoesExecutadas: [
          { tipo: 'enviar_mensagem', executadaAt: new Date(), sucesso: true },
          { tipo: 'aguardar', executadaAt: new Date(), sucesso: true },
        ],
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.findExecutionById = vi.fn().mockResolvedValue(execution)
      deps.repository.findById = vi.fn().mockResolvedValue(automation)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Follow up!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })

      await useCase.resumeExecution(execution.id)

      // Should send the follow-up message
      expect(deps.messageSender.sendMessage).toHaveBeenCalledWith(contact.telefone, 'Follow up!')
      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'sucesso',
        })
      )
    })

    it('should do nothing when execution not found', async () => {
      deps.repository.findExecutionById = vi.fn().mockResolvedValue(null)

      await useCase.resumeExecution('non-existent')

      expect(deps.repository.findById).not.toHaveBeenCalled()
    })

    it('should do nothing when automation not found', async () => {
      const execution = createExecutionData()
      deps.repository.findExecutionById = vi.fn().mockResolvedValue(execution)
      deps.repository.findById = vi.fn().mockResolvedValue(null)

      await useCase.resumeExecution(execution.id)

      expect(deps.repository.updateExecution).not.toHaveBeenCalled()
    })
  })

  describe('retry with exponential backoff', () => {
    it('should retry failed action up to 3 times', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true })

      const executePromise = useCase.executeAutomation(automation, 'contact-123')

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0)
      // Wait for first retry delay (1s)
      await vi.advanceTimersByTimeAsync(1000)
      // Wait for second retry delay (2s)
      await vi.advanceTimersByTimeAsync(2000)

      await executePromise

      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(3)
      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'sucesso',
        })
      )
    })

    it('should fail after max retries exceeded', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn()
        .mockResolvedValue({ success: false, error: 'Service unavailable' })

      const executePromise = useCase.executeAutomation(automation, 'contact-123')

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)

      await executePromise

      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(3)
      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
          erro: expect.stringContaining('3 tentativas'),
        })
      )
      expect(deps.eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.execution.failed',
        })
      )
    })

    it('should not retry non-retryable errors', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_template', config: { templateId: 'template-123' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.findById = vi.fn().mockResolvedValue(null) // Template not found is non-retryable

      await useCase.executeAutomation(automation, 'contact-123')

      // Should fail immediately without retries
      expect(deps.template.findById).toHaveBeenCalledTimes(1)
      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
          erro: expect.stringContaining('não encontrado'),
        })
      )
    })

    it('should use exponential backoff delays (1s, 2s, 4s)', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Error' })
        .mockResolvedValueOnce({ success: false, error: 'Error' })
        .mockResolvedValueOnce({ success: true })

      const executePromise = useCase.executeAutomation(automation, 'contact-123')

      // First call happens immediately
      await vi.advanceTimersByTimeAsync(0)
      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(1)

      // Second call after 1s delay
      await vi.advanceTimersByTimeAsync(1000)
      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(2)

      // Third call after 2s delay
      await vi.advanceTimersByTimeAsync(2000)
      expect(deps.messageSender.sendMessage).toHaveBeenCalledTimes(3)

      await executePromise
    })
  })

  describe('execution completion', () => {
    it('should mark execution as completed when all actions succeed', async () => {
      const automation = createTestAutomation({
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'welcomed' } },
        ],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: true })
      deps.contact.addTag = vi.fn().mockResolvedValue({ success: true })

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.repository.updateExecution).toHaveBeenLastCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'sucesso',
          acoesExecutadas: expect.arrayContaining([
            expect.objectContaining({ tipo: 'enviar_mensagem', sucesso: true }),
            expect.objectContaining({ tipo: 'adicionar_tag', sucesso: true }),
          ]),
        })
      )
      expect(deps.eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.execution.completed',
          payload: expect.objectContaining({
            acoesExecutadas: 2,
          }),
        })
      )
    })

    it('should mark execution as failed when action fails', async () => {
      const automation = createTestAutomation({
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'welcomed' } },
        ],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })
      const contact = createContactData({ id: 'contact-123' })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(contact)
      deps.template.renderForContact = vi.fn().mockResolvedValue('Hello!')
      deps.messageSender.sendMessage = vi.fn().mockResolvedValue({ success: false, error: 'WhatsApp API error' })

      const executePromise = useCase.executeAutomation(automation, 'contact-123')

      // Advance through retries
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)

      await executePromise

      expect(deps.repository.updateExecution).toHaveBeenLastCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
        })
      )
      // Should not have executed the second action
      expect(deps.contact.addTag).not.toHaveBeenCalled()
    })

    it('should fail when contact not found during action execution', async () => {
      const automation = createTestAutomation({
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } }],
      })
      const execution = createExecutionData({
        automacaoId: automation.id,
        contatoId: 'contact-123',
      })

      deps.repository.createExecution = vi.fn().mockResolvedValue(execution)
      deps.repository.updateExecution = vi.fn().mockResolvedValue(execution)
      deps.contact.findById = vi.fn().mockResolvedValue(null)

      await useCase.executeAutomation(automation, 'contact-123')

      expect(deps.repository.updateExecution).toHaveBeenCalledWith(
        execution.id,
        expect.objectContaining({
          status: 'falha',
          erro: expect.stringContaining('Contato não encontrado'),
        })
      )
    })
  })
})
