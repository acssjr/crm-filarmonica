/**
 * Domain Events for Automation
 * Events that occur during automation lifecycle
 */

export interface DomainEvent {
  eventType: string
  occurredAt: Date
  payload: Record<string, unknown>
}

export interface AutomationCreatedEvent extends DomainEvent {
  eventType: 'automation.created'
  payload: {
    automacaoId: string
    nome: string
    triggerTipo: string
  }
}

export interface AutomationActivatedEvent extends DomainEvent {
  eventType: 'automation.activated'
  payload: {
    automacaoId: string
    nome: string
  }
}

export interface AutomationDeactivatedEvent extends DomainEvent {
  eventType: 'automation.deactivated'
  payload: {
    automacaoId: string
    nome: string
  }
}

export interface AutomationDeletedEvent extends DomainEvent {
  eventType: 'automation.deleted'
  payload: {
    automacaoId: string
  }
}

export interface AutomationExecutionStartedEvent extends DomainEvent {
  eventType: 'automation.execution.started'
  payload: {
    automacaoId: string
    execucaoId: string
    contatoId: string
  }
}

export interface AutomationExecutionCompletedEvent extends DomainEvent {
  eventType: 'automation.execution.completed'
  payload: {
    automacaoId: string
    execucaoId: string
    contatoId: string
    acoesExecutadas: number
  }
}

export interface AutomationExecutionFailedEvent extends DomainEvent {
  eventType: 'automation.execution.failed'
  payload: {
    automacaoId: string
    execucaoId: string
    contatoId: string
    erro: string
  }
}

export interface AutomationExecutionPausedEvent extends DomainEvent {
  eventType: 'automation.execution.paused'
  payload: {
    automacaoId: string
    execucaoId: string
    contatoId: string
    proximaAcaoEm: Date
  }
}

export type AutomationEvent =
  | AutomationCreatedEvent
  | AutomationActivatedEvent
  | AutomationDeactivatedEvent
  | AutomationDeletedEvent
  | AutomationExecutionStartedEvent
  | AutomationExecutionCompletedEvent
  | AutomationExecutionFailedEvent
  | AutomationExecutionPausedEvent

// Factory functions
export function createAutomationCreatedEvent(
  automacaoId: string,
  nome: string,
  triggerTipo: string
): AutomationCreatedEvent {
  return {
    eventType: 'automation.created',
    occurredAt: new Date(),
    payload: { automacaoId, nome, triggerTipo },
  }
}

export function createAutomationActivatedEvent(
  automacaoId: string,
  nome: string
): AutomationActivatedEvent {
  return {
    eventType: 'automation.activated',
    occurredAt: new Date(),
    payload: { automacaoId, nome },
  }
}

export function createAutomationDeactivatedEvent(
  automacaoId: string,
  nome: string
): AutomationDeactivatedEvent {
  return {
    eventType: 'automation.deactivated',
    occurredAt: new Date(),
    payload: { automacaoId, nome },
  }
}

export function createExecutionStartedEvent(
  automacaoId: string,
  execucaoId: string,
  contatoId: string
): AutomationExecutionStartedEvent {
  return {
    eventType: 'automation.execution.started',
    occurredAt: new Date(),
    payload: { automacaoId, execucaoId, contatoId },
  }
}

export function createExecutionCompletedEvent(
  automacaoId: string,
  execucaoId: string,
  contatoId: string,
  acoesExecutadas: number
): AutomationExecutionCompletedEvent {
  return {
    eventType: 'automation.execution.completed',
    occurredAt: new Date(),
    payload: { automacaoId, execucaoId, contatoId, acoesExecutadas },
  }
}

export function createExecutionFailedEvent(
  automacaoId: string,
  execucaoId: string,
  contatoId: string,
  erro: string
): AutomationExecutionFailedEvent {
  return {
    eventType: 'automation.execution.failed',
    occurredAt: new Date(),
    payload: { automacaoId, execucaoId, contatoId, erro },
  }
}

export function createExecutionPausedEvent(
  automacaoId: string,
  execucaoId: string,
  contatoId: string,
  proximaAcaoEm: Date
): AutomationExecutionPausedEvent {
  return {
    eventType: 'automation.execution.paused',
    occurredAt: new Date(),
    payload: { automacaoId, execucaoId, contatoId, proximaAcaoEm },
  }
}
