/**
 * Automation Events Integration
 * Connects system events to automation triggers
 */

import { TriggerEvent } from './domain/value-objects/trigger.vo.js'
import { queueTriggerEvent } from './automation.scheduler.js'

/**
 * Emit when a new contact is created
 */
export async function emitNewContact(contatoId: string): Promise<void> {
  const event: TriggerEvent = {
    tipo: 'novo_contato',
    contatoId,
  }

  await queueTriggerEvent(event)
}

/**
 * Emit when a tag is added to a contact
 */
export async function emitTagAdded(contatoId: string, tagId: string): Promise<void> {
  const event: TriggerEvent = {
    tipo: 'tag_adicionada',
    contatoId,
    data: { tagId },
  }

  await queueTriggerEvent(event)
}

/**
 * Emit when a tag is removed from a contact
 */
export async function emitTagRemoved(contatoId: string, tagId: string): Promise<void> {
  const event: TriggerEvent = {
    tipo: 'tag_removida',
    contatoId,
    data: { tagId },
  }

  await queueTriggerEvent(event)
}

/**
 * Emit when a contact's journey state changes
 */
export async function emitJourneyChanged(contatoId: string, estado: string): Promise<void> {
  const event: TriggerEvent = {
    tipo: 'jornada_mudou',
    contatoId,
    data: { estado },
  }

  await queueTriggerEvent(event)
}

/**
 * Emit when a message is received from a contact
 */
export async function emitMessageReceived(contatoId: string, mensagem: string): Promise<void> {
  const event: TriggerEvent = {
    tipo: 'mensagem_recebida',
    contatoId,
    data: { mensagem },
  }

  await queueTriggerEvent(event)
}

/**
 * Integration helpers to be called from other modules
 */
export const automationEvents = {
  newContact: emitNewContact,
  tagAdded: emitTagAdded,
  tagRemoved: emitTagRemoved,
  journeyChanged: emitJourneyChanged,
  messageReceived: emitMessageReceived,
}
