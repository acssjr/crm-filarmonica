/**
 * Execute Automation Use Case
 * Handles the execution of automation actions for a contact
 */

import { Automation } from '../domain/entities/automation.entity.js'
import { Action, isDelayAction, getDelayDays } from '../domain/value-objects/action.vo.js'
import { TriggerEvent, matchesTrigger } from '../domain/value-objects/trigger.vo.js'
import { evaluateAllConditions } from '../domain/value-objects/condition.vo.js'
import { AutomationRepositoryPort, AutomationExecution } from '../domain/ports/automation.repository.port.js'
import { MessageSenderPort } from '../domain/ports/message-sender.port.js'
import { NotificationPort } from '../domain/ports/notification.port.js'
import { ContactPort } from '../domain/ports/contact.port.js'
import { TemplatePort } from '../domain/ports/template.port.js'
import { EventPublisherPort } from '../domain/ports/event-publisher.port.js'
import {
  createExecutionStartedEvent,
  createExecutionCompletedEvent,
  createExecutionFailedEvent,
  createExecutionPausedEvent,
} from '../domain/events/automation.events.js'

export interface ExecuteAutomationDeps {
  repository: AutomationRepositoryPort
  messageSender: MessageSenderPort
  notification: NotificationPort
  contact: ContactPort
  template: TemplatePort
  eventPublisher: EventPublisherPort
}

export class ExecuteAutomationUseCase {
  constructor(private deps: ExecuteAutomationDeps) {}

  /**
   * Handle a trigger event - find matching automations and execute them
   */
  async handleTrigger(event: TriggerEvent): Promise<void> {
    console.log(`[ExecuteAutomation] Handling trigger: ${event.tipo} for contact ${event.contatoId}`)

    // Find active automations matching this trigger
    const automations = await this.deps.repository.findByTrigger(event.tipo)

    for (const automation of automations) {
      try {
        // Check if trigger config matches
        if (!matchesTrigger(automation.trigger, event)) {
          continue
        }

        // Rate limiting: Check for recent execution (prevent duplicates/loops)
        const hasRecent = await this.deps.repository.hasRecentExecution(
          automation.id,
          event.contatoId,
          60 // 60 minute window
        )
        if (hasRecent) {
          console.log(
            `[ExecuteAutomation] Skipping automation ${automation.id} for contact ${event.contatoId} - recent execution exists`
          )
          continue
        }

        // Evaluate conditions
        const contactData = await this.deps.contact.getContactData(event.contatoId)
        if (!contactData) {
          console.log(`[ExecuteAutomation] Contact ${event.contatoId} not found, skipping`)
          continue
        }

        if (!evaluateAllConditions(automation.condicoes, contactData)) {
          console.log(`[ExecuteAutomation] Conditions not met for automation ${automation.id}`)
          continue
        }

        // Create execution and start
        await this.executeAutomation(automation, event.contatoId)
      } catch (error) {
        // Isolate failures - continue processing other automations
        console.error(
          `[ExecuteAutomation] Error processing automation ${automation.id}:`,
          error
        )
      }
    }
  }

  /**
   * Execute an automation for a contact
   */
  async executeAutomation(automation: Automation, contatoId: string): Promise<void> {
    console.log(`[ExecuteAutomation] Starting automation ${automation.id} for contact ${contatoId}`)

    // Create execution record
    const execution = await this.deps.repository.createExecution({
      automacaoId: automation.id,
      contatoId,
    })

    await this.deps.eventPublisher.publish(
      createExecutionStartedEvent(automation.id, execution.id, contatoId)
    )

    await this.processActions(automation, execution, 0)
  }

  /**
   * Resume a paused execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const execution = await this.deps.repository.findExecutionById(executionId)
    if (!execution) {
      console.error(`[ExecuteAutomation] Execution ${executionId} not found`)
      return
    }

    const automation = await this.deps.repository.findById(execution.automacaoId)
    if (!automation) {
      console.error(`[ExecuteAutomation] Automation ${execution.automacaoId} not found`)
      return
    }

    // Continue from where we left off
    const nextActionIndex = execution.acoesExecutadas.length
    await this.processActions(automation, execution, nextActionIndex)
  }

  /**
   * Process actions starting from a specific index
   */
  private async processActions(
    automation: Automation,
    execution: AutomationExecution,
    startIndex: number
  ): Promise<void> {
    const actions = automation.acoes
    const acoesExecutadas = [...execution.acoesExecutadas]

    for (let i = startIndex; i < actions.length; i++) {
      const action = actions[i]

      // Check for delay action
      if (isDelayAction(action)) {
        const days = getDelayDays(action)
        const proximaAcaoEm = new Date()
        proximaAcaoEm.setDate(proximaAcaoEm.getDate() + days)

        acoesExecutadas.push({
          tipo: action.tipo,
          executadaAt: new Date(),
          sucesso: true,
        })

        await this.deps.repository.updateExecution(execution.id, {
          status: 'aguardando',
          acoesExecutadas,
          proximaAcaoEm,
        })

        await this.deps.eventPublisher.publish(
          createExecutionPausedEvent(
            automation.id,
            execution.id,
            execution.contatoId,
            proximaAcaoEm
          )
        )

        console.log(`[ExecuteAutomation] Execution ${execution.id} paused until ${proximaAcaoEm}`)
        return
      }

      // Execute action with retry for transient failures
      const result = await this.executeActionWithRetry(action, execution.contatoId, automation.id)

      acoesExecutadas.push({
        tipo: action.tipo,
        executadaAt: new Date(),
        sucesso: result.success,
        erro: result.error,
      })

      if (!result.success) {
        // Mark as failed
        await this.deps.repository.updateExecution(execution.id, {
          status: 'falha',
          acoesExecutadas,
          erro: result.error,
        })

        await this.deps.eventPublisher.publish(
          createExecutionFailedEvent(
            automation.id,
            execution.id,
            execution.contatoId,
            result.error || 'Unknown error'
          )
        )

        console.error(`[ExecuteAutomation] Execution ${execution.id} failed: ${result.error}`)
        return
      }
    }

    // All actions completed
    await this.deps.repository.updateExecution(execution.id, {
      status: 'sucesso',
      acoesExecutadas,
    })

    await this.deps.eventPublisher.publish(
      createExecutionCompletedEvent(
        automation.id,
        execution.id,
        execution.contatoId,
        acoesExecutadas.length
      )
    )

    console.log(`[ExecuteAutomation] Execution ${execution.id} completed successfully`)
  }

  /**
   * Execute action with retry and exponential backoff
   */
  private async executeActionWithRetry(
    action: Action,
    contatoId: string,
    automacaoId: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: string | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.executeAction(action, contatoId, automacaoId)

      if (result.success) {
        return result
      }

      lastError = result.error

      // Don't retry for non-transient errors
      if (this.isNonRetryableError(result.error)) {
        console.log(`[ExecuteAutomation] Non-retryable error, not retrying: ${result.error}`)
        return result
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000
        console.log(
          `[ExecuteAutomation] Action failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms: ${result.error}`
        )
        await this.delay(delayMs)
      }
    }

    return { success: false, error: `Falha após ${maxRetries} tentativas: ${lastError}` }
  }

  /**
   * Check if error is non-retryable (e.g., validation errors)
   */
  private isNonRetryableError(error?: string): boolean {
    if (!error) return false
    const nonRetryable = [
      'não encontrado',
      'não encontrada',
      'inválido',
      'inválida',
      'não suportada',
    ]
    return nonRetryable.some(term => error.toLowerCase().includes(term))
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: Action,
    contatoId: string,
    automacaoId: string
  ): Promise<{ success: boolean; error?: string }> {
    const contact = await this.deps.contact.findById(contatoId)
    if (!contact) {
      return { success: false, error: 'Contato não encontrado' }
    }

    switch (action.tipo) {
      case 'enviar_mensagem': {
        const mensagem = await this.deps.template.renderForContact(
          action.config.mensagem!,
          contatoId
        )
        return this.deps.messageSender.sendMessage(contact.telefone, mensagem)
      }

      case 'enviar_template': {
        const template = await this.deps.template.findById(action.config.templateId!)
        if (!template) {
          return { success: false, error: 'Template não encontrado' }
        }
        const rendered = await this.deps.template.renderForContact(template.conteudo, contatoId)
        return this.deps.messageSender.sendMessage(contact.telefone, rendered)
      }

      case 'adicionar_tag':
        return this.deps.contact.addTag(contatoId, action.config.tagId!)

      case 'remover_tag':
        return this.deps.contact.removeTag(contatoId, action.config.tagId!)

      case 'mudar_jornada':
        return this.deps.contact.updateJourneyState(contatoId, action.config.estado!)

      case 'notificar_admin': {
        const mensagem = await this.deps.template.renderForContact(
          action.config.mensagem!,
          contatoId
        )

        // Send WhatsApp notification
        await this.deps.notification.notifyAdminWhatsApp(action.config.adminPhone!, mensagem)

        // Create panel alert
        await this.deps.notification.createPanelAlert({
          tipo: 'info',
          titulo: 'Notificação de Automação',
          mensagem,
          contatoId,
          automacaoId,
        })

        return { success: true }
      }

      default:
        return { success: false, error: `Ação não suportada: ${action.tipo}` }
    }
  }
}
