/**
 * Unit Tests for AutomationUseCases
 * Tests create, update, delete, activate, deactivate, getAll, getById, getExecutions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AutomationUseCases } from './create-automation.usecase.js'
import { Automation } from '../domain/entities/automation.entity.js'
import {
  createAutomationInput,
  createAutomationPersistence,
  createMockRepository,
  createMockEventPublisher,
} from '../../../__tests__/factories.js'

describe('AutomationUseCases', () => {
  let useCase: AutomationUseCases
  let mockRepository: ReturnType<typeof createMockRepository>
  let mockEventPublisher: ReturnType<typeof createMockEventPublisher>

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockEventPublisher = createMockEventPublisher()
    useCase = new AutomationUseCases(mockRepository, mockEventPublisher)
    vi.clearAllMocks()
  })

  describe('execute (create automation)', () => {
    it('should create automation successfully with valid input', async () => {
      const input = createAutomationInput({
        nome: 'Welcome Automation',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Welcome!' } }],
      })
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.execute(input)

      expect(result.error).toBeUndefined()
      expect(result.automation).toBeDefined()
      expect(result.automation!.nome).toBe('Welcome Automation')
      expect(result.automation!.ativo).toBe(false)
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1)
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.created',
          payload: expect.objectContaining({
            nome: 'Welcome Automation',
            triggerTipo: 'novo_contato',
          }),
        })
      )
    })

    it('should create automation with conditions', async () => {
      const input = createAutomationInput({
        nome: 'Filtered Automation',
        condicoes: [
          { campo: 'origem', operador: 'igual', valor: 'organico' },
          { campo: 'tags', operador: 'contem', valor: ['interessado'] },
        ],
      })
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.execute(input)

      expect(result.error).toBeUndefined()
      expect(result.automation).toBeDefined()
      expect(result.automation!.condicoes).toHaveLength(2)
    })

    it('should create automation with multiple actions', async () => {
      const input = createAutomationInput({
        nome: 'Multi-action Automation',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Hello!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'tag-123' } },
          { tipo: 'aguardar', config: { dias: 2 } },
          { tipo: 'enviar_mensagem', config: { mensagem: 'Follow up!' } },
        ],
      })
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.execute(input)

      expect(result.error).toBeUndefined()
      expect(result.automation!.acoes).toHaveLength(4)
    })

    it('should return error when nome is empty', async () => {
      const input = createAutomationInput({ nome: '' })

      const result = await useCase.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Nome deve ter entre 1 e 100 caracteres')
      expect(mockRepository.save).not.toHaveBeenCalled()
      expect(mockEventPublisher.publish).not.toHaveBeenCalled()
    })

    it('should return error when nome is too long', async () => {
      const input = createAutomationInput({ nome: 'A'.repeat(101) })

      const result = await useCase.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Nome deve ter entre 1 e 100 caracteres')
    })

    it('should return error when acoes is empty', async () => {
      const input = createAutomationInput({ acoes: [] })

      const result = await useCase.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Automação deve ter pelo menos uma ação')
    })

    it('should return error when action requires missing config', async () => {
      const input = createAutomationInput({
        acoes: [{ tipo: 'enviar_template' }], // Missing templateId
      })

      const result = await useCase.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Ação enviar_template requer templateId')
    })

    it('should return error when repository save fails', async () => {
      const input = createAutomationInput()
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'))

      const result = await useCase.execute(input)

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
      expect(mockEventPublisher.publish).not.toHaveBeenCalled()
    })

    it('should trim whitespace from nome', async () => {
      const input = createAutomationInput({ nome: '  Spaced Name  ' })
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.execute(input)

      expect(result.automation!.nome).toBe('Spaced Name')
    })

    it('should validate tempo_sem_interacao trigger requires dias', async () => {
      const input = createAutomationInput({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: {}, // Missing dias
      })

      const result = await useCase.execute(input)

      expect(result.error).toContain('tempo_sem_interacao')
      expect(result.error).toContain('dias')
    })
  })

  describe('update', () => {
    it('should update automation successfully', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.update(existingData.id, { nome: 'Updated Name' })

      expect(result.error).toBeUndefined()
      expect(result.automation!.nome).toBe('Updated Name')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should return error when automation not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.update('non-existent-id', { nome: 'New Name' })

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Automação não encontrada')
    })

    it('should return error when trying to update active automation', async () => {
      const existingData = createAutomationPersistence({ ativo: true })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)

      const result = await useCase.update(existingData.id, { nome: 'New Name' })

      expect(result.automation).toBeUndefined()
      expect(result.error).toBe('Não é possível editar uma automação ativa')
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should update trigger type and config', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.update(existingData.id, {
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip-tag' },
      })

      expect(result.automation!.trigger.tipo).toBe('tag_adicionada')
      expect(result.automation!.trigger.config.tagId).toBe('vip-tag')
    })

    it('should handle repository errors gracefully', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      const result = await useCase.update(existingData.id, { nome: 'New Name' })

      expect(result.error).toBe('Save failed')
    })
  })

  describe('delete', () => {
    it('should delete inactive automation successfully', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.delete.mockResolvedValue(true)

      const result = await useCase.delete(existingData.id)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockRepository.delete).toHaveBeenCalledWith(existingData.id)
    })

    it('should return error when automation not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.delete('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when trying to delete active automation', async () => {
      const existingData = createAutomationPersistence({ ativo: true })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)

      const result = await useCase.delete(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Não é possível excluir uma automação ativa')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle repository delete failure', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'))

      const result = await useCase.delete(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('activate', () => {
    it('should activate inactive automation successfully', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.activate(existingData.id)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.activated',
        })
      )
    })

    it('should return success without changes when already active', async () => {
      const existingData = createAutomationPersistence({ ativo: true })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)

      const result = await useCase.activate(existingData.id)

      expect(result.success).toBe(true)
      expect(mockRepository.save).not.toHaveBeenCalled()
      expect(mockEventPublisher.publish).not.toHaveBeenCalled()
    })

    it('should return error when automation not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.activate('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
    })

    it('should handle repository errors gracefully', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      const result = await useCase.activate(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Save failed')
    })
  })

  describe('deactivate', () => {
    it('should deactivate active automation successfully', async () => {
      const existingData = createAutomationPersistence({ ativo: true })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockResolvedValue(undefined)

      const result = await useCase.deactivate(existingData.id)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'automation.deactivated',
        })
      )
    })

    it('should return success without changes when already inactive', async () => {
      const existingData = createAutomationPersistence({ ativo: false })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)

      const result = await useCase.deactivate(existingData.id)

      expect(result.success).toBe(true)
      expect(mockRepository.save).not.toHaveBeenCalled()
      expect(mockEventPublisher.publish).not.toHaveBeenCalled()
    })

    it('should return error when automation not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.deactivate('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Automação não encontrada')
    })

    it('should handle repository errors gracefully', async () => {
      const existingData = createAutomationPersistence({ ativo: true })
      const automation = Automation.fromPersistence({
        ...existingData,
        triggerTipo: existingData.triggerTipo,
        triggerConfig: existingData.triggerConfig as Record<string, unknown>,
        condicoes: existingData.condicoes as Array<{ campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'; valor: string | string[] }>,
        acoes: existingData.acoes as Array<{ tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'; config: Record<string, unknown> }>,
      })
      mockRepository.findById.mockResolvedValue(automation)
      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      const result = await useCase.deactivate(existingData.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Save failed')
    })
  })

  describe('getAll', () => {
    it('should return all automations', async () => {
      const automations = [
        Automation.fromPersistence({
          ...createAutomationPersistence({ nome: 'Auto 1' }),
          triggerTipo: 'novo_contato',
          triggerConfig: {},
          condicoes: [],
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hi' } }],
        }),
        Automation.fromPersistence({
          ...createAutomationPersistence({ nome: 'Auto 2' }),
          triggerTipo: 'tag_adicionada',
          triggerConfig: { tagId: 'vip' },
          condicoes: [],
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hello' } }],
        }),
      ]
      mockRepository.findAll.mockResolvedValue(automations)

      const result = await useCase.getAll()

      expect(result).toHaveLength(2)
      expect(result[0].nome).toBe('Auto 1')
      expect(result[1].nome).toBe('Auto 2')
    })

    it('should return empty array when no automations exist', async () => {
      mockRepository.findAll.mockResolvedValue([])

      const result = await useCase.getAll()

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return automation when found', async () => {
      const automation = Automation.fromPersistence({
        ...createAutomationPersistence({ nome: 'My Automation' }),
        triggerTipo: 'novo_contato',
        triggerConfig: {},
        condicoes: [],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hi' } }],
      })
      mockRepository.findById.mockResolvedValue(automation)

      const result = await useCase.getById('some-id')

      expect(result).toBeDefined()
      expect(result!.nome).toBe('My Automation')
    })

    it('should return null when automation not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.getById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('getExecutions', () => {
    it('should return executions for automation', async () => {
      const executions = [
        {
          id: 'exec-1',
          automacaoId: 'auto-1',
          contatoId: 'contact-1',
          status: 'sucesso' as const,
          acoesExecutadas: [],
          createdAt: new Date(),
        },
        {
          id: 'exec-2',
          automacaoId: 'auto-1',
          contatoId: 'contact-2',
          status: 'falha' as const,
          acoesExecutadas: [],
          erro: 'Some error',
          createdAt: new Date(),
        },
      ]
      mockRepository.findExecutionsByAutomation.mockResolvedValue(executions)

      const result = await useCase.getExecutions('auto-1')

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('sucesso')
      expect(result[1].status).toBe('falha')
    })

    it('should return empty array when no executions exist', async () => {
      mockRepository.findExecutionsByAutomation.mockResolvedValue([])

      const result = await useCase.getExecutions('auto-1')

      expect(result).toEqual([])
    })
  })
})
