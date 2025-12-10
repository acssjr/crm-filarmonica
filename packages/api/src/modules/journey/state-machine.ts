import type { Contato } from '../../db/schema.js'
import { updateContactJourneyState } from '../contacts/contact.service.js'
import { logJourneyUpdated } from '../events/event.service.js'
import { canTransition, type JourneyState } from './transitions.js'

export interface StateContext {
  contact: Contato
  message: string
  intent: string
}

export interface StateResult {
  nextState: JourneyState
  response: string
  data?: Record<string, unknown>
}

export async function transitionTo(
  contact: Contato,
  newState: JourneyState
): Promise<Contato | null> {
  const currentState = contact.estadoJornada

  if (!canTransition(currentState, newState)) {
    console.log(`[Journey] Invalid transition: ${currentState} -> ${newState}`)
    return null
  }

  const updated = await updateContactJourneyState(contact.id, newState)

  if (updated) {
    await logJourneyUpdated(contact.id, currentState, newState)
    console.log(`[Journey] ${contact.telefone}: ${currentState} -> ${newState}`)
  }

  return updated
}

export function shouldStartJourney(intent: string, currentState: JourneyState): boolean {
  // Start journey from initial state when user shows interest
  if (currentState === 'inicial' || currentState === 'boas_vindas') {
    return ['matricula', 'instrumento'].includes(intent)
  }
  return false
}

export function isJourneyActive(state: JourneyState): boolean {
  return ![
    'inicial',
    'boas_vindas',
    'incompativel',
    'qualificado',
    'atendimento_humano',
  ].includes(state)
}

export function isJourneyComplete(state: JourneyState): boolean {
  return ['qualificado', 'incompativel'].includes(state)
}
