/**
 * Run Scheduled Automations Use Case
 * Handles periodic checks for time-based triggers and resuming paused executions
 */

import { AutomationRepositoryPort } from '../domain/ports/automation.repository.port.js'
import { ContactPortPort } from '../domain/ports/contact.port.js'
import { ExecuteAutomationUseCase } from './execute-automation.usecase.js'
import { TriggerEvent } from '../domain/value-objects/trigger.vo.js'

export class RunScheduledAutomationsUseCase {
  constructor(
    private repository: AutomationRepositoryPort,
    private contact: ContactPortPort,
    private executeAutomation: ExecuteAutomationUseCase
  ) {}

  /**
   * Check and execute time-based automations (tempo_sem_interacao)
   */
  async checkTimeBasedAutomations(): Promise<void> {
    console.log('[ScheduledAutomations] Checking time-based automations...')

    // Find active automations with tempo_sem_interacao trigger
    const automations = await this.repository.findByTrigger('tempo_sem_interacao')

    for (const automation of automations) {
      const dias = automation.trigger.config.dias
      if (!dias || dias < 1) continue

      // Find contacts without interaction for X days
      const contactIds = await this.contact.findContactsWithoutInteraction(dias)

      console.log(
        `[ScheduledAutomations] Found ${contactIds.length} contacts without interaction for ${dias} days`
      )

      for (const contatoId of contactIds) {
        const event: TriggerEvent = {
          tipo: 'tempo_sem_interacao',
          contatoId,
          data: { dias },
        }

        await this.executeAutomation.handleTrigger(event)
      }
    }
  }

  /**
   * Resume paused executions that are ready to continue
   */
  async resumePausedExecutions(): Promise<void> {
    console.log('[ScheduledAutomations] Checking for paused executions to resume...')

    const pendingExecutions = await this.repository.findPendingExecutions()

    console.log(`[ScheduledAutomations] Found ${pendingExecutions.length} executions to resume`)

    for (const execution of pendingExecutions) {
      await this.executeAutomation.resumeExecution(execution.id)
    }
  }

  /**
   * Run all scheduled checks
   */
  async run(): Promise<void> {
    await this.checkTimeBasedAutomations()
    await this.resumePausedExecutions()
  }
}
