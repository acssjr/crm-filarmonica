/**
 * Create Automation Use Case
 */

import { v4 as uuidv4 } from 'uuid'
import { Automation, CreateAutomationInput, UpdateAutomationInput } from '../domain/entities/automation.entity.js'
import { AutomationRepositoryPort } from '../domain/ports/automation.repository.port.js'
import { EventPublisherPort } from '../domain/ports/event-publisher.port.js'
import {
  createAutomationCreatedEvent,
  createAutomationActivatedEvent,
  createAutomationDeactivatedEvent,
} from '../domain/events/automation.events.js'

export class AutomationUseCases {
  constructor(
    private repository: AutomationRepositoryPort,
    private eventPublisher: EventPublisherPort
  ) {}

  async execute(input: CreateAutomationInput): Promise<{ automation?: Automation; error?: string }> {
    try {
      const id = uuidv4()
      const automation = Automation.create(id, input)

      await this.repository.save(automation)

      await this.eventPublisher.publish(
        createAutomationCreatedEvent(
          automation.id,
          automation.nome,
          automation.trigger.tipo
        )
      )

      return { automation }
    } catch (error) {
      console.error('[CreateAutomation] Failed:', error)
      return { error: (error as Error).message }
    }
  }

  async update(
    id: string,
    input: UpdateAutomationInput
  ): Promise<{ automation?: Automation; error?: string }> {
    try {
      const automation = await this.repository.findById(id)
      if (!automation) {
        return { error: 'Automação não encontrada' }
      }

      if (automation.ativo) {
        return { error: 'Não é possível editar uma automação ativa' }
      }

      automation.update(input)
      await this.repository.save(automation)

      return { automation }
    } catch (error) {
      console.error('[UpdateAutomation] Failed:', error)
      return { error: (error as Error).message }
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const automation = await this.repository.findById(id)
      if (!automation) {
        return { success: false, error: 'Automação não encontrada' }
      }

      if (automation.ativo) {
        return { success: false, error: 'Não é possível excluir uma automação ativa' }
      }

      const success = await this.repository.delete(id)
      return { success }
    } catch (error) {
      console.error('[DeleteAutomation] Failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async activate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const automation = await this.repository.findById(id)
      if (!automation) {
        return { success: false, error: 'Automação não encontrada' }
      }

      if (automation.ativo) {
        return { success: true } // Already active
      }

      automation.activate()
      await this.repository.save(automation)

      await this.eventPublisher.publish(
        createAutomationActivatedEvent(automation.id, automation.nome)
      )

      return { success: true }
    } catch (error) {
      console.error('[ActivateAutomation] Failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async deactivate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const automation = await this.repository.findById(id)
      if (!automation) {
        return { success: false, error: 'Automação não encontrada' }
      }

      if (!automation.ativo) {
        return { success: true } // Already inactive
      }

      automation.deactivate()
      await this.repository.save(automation)

      await this.eventPublisher.publish(
        createAutomationDeactivatedEvent(automation.id, automation.nome)
      )

      return { success: true }
    } catch (error) {
      console.error('[DeactivateAutomation] Failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async getAll(): Promise<Automation[]> {
    return this.repository.findAll()
  }

  async getById(id: string): Promise<Automation | null> {
    return this.repository.findById(id)
  }

  async getExecutions(automacaoId: string) {
    return this.repository.findExecutionsByAutomation(automacaoId)
  }
}
