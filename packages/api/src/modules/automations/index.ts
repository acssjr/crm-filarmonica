/**
 * Automations Module
 * Exports all services and components
 */

// Domain
export { Automation } from './domain/entities/automation.entity.js'
export type { CreateAutomationInput, UpdateAutomationInput } from './domain/entities/automation.entity.js'
export type { Trigger, TriggerTipo, TriggerEvent } from './domain/value-objects/trigger.vo.js'
export type { Condition, ConditionCampo, ConditionOperador } from './domain/value-objects/condition.vo.js'
export type { Action, ActionTipo } from './domain/value-objects/action.vo.js'

// Adapters
import { automationRepository } from './adapters/automation.repository.js'
import { whatsappSenderAdapter } from './adapters/whatsapp-sender.adapter.js'
import { notificationAdapter } from './adapters/notification.adapter.js'
import { contactAdapter } from './adapters/contact.adapter.js'
import { templateAdapter } from './adapters/template.adapter.js'
import { eventPublisher } from './adapters/event-publisher.adapter.js'

// Use Cases
import { AutomationUseCases } from './application/create-automation.usecase.js'
import { ExecuteAutomationUseCase } from './application/execute-automation.usecase.js'
import { RunScheduledAutomationsUseCase } from './application/run-scheduled-automations.usecase.js'

// Create service instances
export const automationService = new AutomationUseCases(automationRepository, eventPublisher)

export const executeAutomationService = new ExecuteAutomationUseCase({
  repository: automationRepository,
  messageSender: whatsappSenderAdapter,
  notification: notificationAdapter,
  contact: contactAdapter,
  template: templateAdapter,
  eventPublisher,
})

export const scheduledAutomationsService = new RunScheduledAutomationsUseCase(
  automationRepository,
  contactAdapter,
  executeAutomationService
)

// Alert service (from notification adapter)
export const alertService = notificationAdapter

// Routes
export { automationRoutes } from './automation.routes.js'

// Scheduler
export { initializeAutomationScheduler, queueTriggerEvent } from './automation.scheduler.js'

// Events
export { automationEvents } from './automation.events.js'
