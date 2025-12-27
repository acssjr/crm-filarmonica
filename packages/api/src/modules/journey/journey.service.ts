import type { Contato } from '../../db/schema.js'
import type { JourneyState } from './transitions.js'
import { transitionTo, shouldStartJourney, isJourneyActive } from './state-machine.js'
import { STATE_PROMPTS, type HandlerContext, type HandlerResult } from './handlers/index.js'
import { handleNameCollection } from './handlers/name.handler.js'
import { handleAgeCollection } from './handlers/age.handler.js'
import { handleInstrumentCollection } from './handlers/instrument.handler.js'
import { handleSaxophoneVerification } from './handlers/saxophone.handler.js'
import { handleExperienceCollection } from './handlers/experience.handler.js'
import { handleAvailabilityCheck } from './handlers/availability.handler.js'
import { handleIncompatible } from './handlers/incompatible.handler.js'
import { prospectService } from '../prospects/prospect.service.js'
import { contactService } from '../contacts/contact.service.js'

type StateHandler = (ctx: HandlerContext) => Promise<HandlerResult>

const STATE_HANDLERS: Partial<Record<JourneyState, StateHandler>> = {
  coletando_nome: handleNameCollection,
  coletando_idade: handleAgeCollection,
  coletando_instrumento: handleInstrumentCollection,
  verificando_saxofone: handleSaxophoneVerification,
  coletando_experiencia: handleExperienceCollection,
  coletando_disponibilidade: handleAvailabilityCheck,
  incompativel: handleIncompatible,
}

export interface JourneyResponse {
  response: string
  stateChanged: boolean
  newState?: JourneyState
}

export class JourneyService {
  /**
   * Process a message through the journey state machine
   */
  async processMessage(
    contact: Contato,
    message: string,
    intent: string
  ): Promise<JourneyResponse | null> {
    const currentState = contact.estadoJornada as JourneyState

    // Check if we should start a new journey
    if (shouldStartJourney(intent, currentState)) {
      return this.startJourney(contact)
    }

    // If not in active journey, return null (let normal intent handling take over)
    if (!isJourneyActive(currentState)) {
      return null
    }

    // Get handler for current state
    const handler = STATE_HANDLERS[currentState]

    if (!handler) {
      // No handler for this state - might be waiting for human
      return null
    }

    // Create handler context
    const ctx: HandlerContext = {
      contact,
      message,
      intent,
    }

    // Execute handler
    const result = await handler(ctx)

    // Process result
    return this.processHandlerResult(contact, result)
  }

  /**
   * Start a new journey for a contact
   */
  async startJourney(contact: Contato): Promise<JourneyResponse> {
    // Transition to welcome state
    const updated = await transitionTo(contact, 'boas_vindas')

    if (!updated) {
      return {
        response: STATE_PROMPTS.boas_vindas!,
        stateChanged: false,
      }
    }

    // Immediately transition to name collection
    await transitionTo(updated, 'coletando_nome')

    return {
      response: `${STATE_PROMPTS.boas_vindas}\n\n${STATE_PROMPTS.coletando_nome}`,
      stateChanged: true,
      newState: 'coletando_nome',
    }
  }

  /**
   * Process handler result and update contact state
   */
  private async processHandlerResult(
    contact: Contato,
    result: HandlerResult
  ): Promise<JourneyResponse> {
    let stateChanged = false
    let newState: JourneyState | undefined

    // Update contact data if provided
    if (result.data) {
      await this.updateContactData(contact.id, result.data)
    }

    // Transition to next state if specified
    if (result.nextState) {
      const updated = await transitionTo(contact, result.nextState)
      if (updated) {
        stateChanged = true
        newState = result.nextState

        // Save prospect if journey is complete
        if (result.shouldSaveProspect) {
          await this.saveProspect(contact.id)
        }
      }
    }

    return {
      response: result.response,
      stateChanged,
      newState,
    }
  }

  /**
   * Update contact with collected data
   * Note: Only 'nome' can be stored on Contato. Other data (instrumento, experiencia, etc.)
   * is stored in the interessados table via saveProspect()
   */
  private async updateContactData(
    contactId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Only update fields that exist on Contato
    if (data.nome) {
      await contactService.update(contactId, { nome: data.nome as string })
    }
    // Store the data for later use in saveProspect
    // This data is passed through HandlerResult and used when shouldSaveProspect is true
    this.pendingProspectData.set(contactId, data)
  }

  // Temporary storage for prospect data collected during journey
  private pendingProspectData = new Map<string, Record<string, unknown>>()

  /**
   * Save collected data as a prospect
   */
  private async saveProspect(contactId: string): Promise<void> {
    // Check if already has prospect
    const existing = await prospectService.hasProspect(contactId)
    if (existing) {
      return
    }

    // Get pending prospect data collected during journey
    const pendingData = this.pendingProspectData.get(contactId) || {}

    await prospectService.createFromJourney(contactId, {
      instrumento: pendingData.instrumento as string | undefined,
      experiencia: pendingData.experiencia as string | undefined,
      diasDisponiveis: pendingData.diasDisponiveis as string[] | undefined,
      notas: pendingData.notas as string | undefined,
    })

    // Clean up pending data
    this.pendingProspectData.delete(contactId)
  }

  /**
   * Request human assistance for a contact
   */
  async requestHumanAssistance(contact: Contato, _reason: string): Promise<JourneyResponse> {
    await transitionTo(contact, 'atendimento_humano')

    return {
      response: `Vou transferir voce para um atendente humano.

Um membro da nossa equipe vai te responder em breve! 🙋‍♂️

Enquanto isso, fique a vontade para enviar sua duvida.`,
      stateChanged: true,
      newState: 'atendimento_humano',
    }
  }
}

export const journeyService = new JourneyService()
