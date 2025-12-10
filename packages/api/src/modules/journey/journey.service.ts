import type { Contato } from '@crm-filarmonica/shared'
import type { JourneyState } from './transitions.js'
import { transitionTo, shouldStartJourney, isJourneyActive } from './state-machine.js'
import { STATE_PROMPTS, type HandlerContext, type HandlerResult } from './handlers/index.js'
import { handleNameCollection } from './handlers/name.handler.js'
import { handleAgeCollection } from './handlers/age.handler.js'
import { handleInstrumentSelection } from './handlers/instrument.handler.js'
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
  coletando_instrumento: handleInstrumentSelection,
  verificando_sax: handleSaxophoneVerification,
  coletando_experiencia: handleExperienceCollection,
  verificando_disponibilidade: handleAvailabilityCheck,
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
    const readyForName = await transitionTo(updated, 'coletando_nome')

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
   */
  private async updateContactData(
    contactId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const updates: Partial<Contato> = {}

    if (data.nome) updates.nome = data.nome as string
    if (data.idade) updates.idade = data.idade as number
    if (data.instrumento) updates.instrumento = data.instrumento as string
    if (data.instrumentoSugerido) updates.instrumento = data.instrumentoSugerido as string

    // Store additional data in metadata
    const metadataFields = [
      'experiencia',
      'detalhesExperiencia',
      'diasDisponiveis',
      'motivoIncompatibilidade',
      'listaEspera',
      'desistiu',
      'notas',
    ]

    const metadata: Record<string, unknown> = {}
    for (const field of metadataFields) {
      if (data[field] !== undefined) {
        metadata[field] = data[field]
      }
    }

    if (Object.keys(metadata).length > 0) {
      updates.metadados = {
        ...(typeof updates.metadados === 'object' ? updates.metadados : {}),
        ...metadata,
      } as Record<string, unknown>
    }

    if (Object.keys(updates).length > 0) {
      await contactService.update(contactId, updates)
    }
  }

  /**
   * Save collected data as a prospect
   */
  private async saveProspect(contactId: string): Promise<void> {
    // Check if already has prospect
    const existing = await prospectService.hasProspect(contactId)
    if (existing) {
      return
    }

    // Get updated contact data
    const contact = await contactService.getById(contactId)
    if (!contact) {
      return
    }

    const metadata = (contact.metadados as Record<string, unknown>) || {}

    await prospectService.createFromJourney(contactId, {
      instrumento: contact.instrumento || undefined,
      experiencia: metadata.experiencia as string | undefined,
      diasDisponiveis: metadata.diasDisponiveis as string[] | undefined,
      notas: metadata.notas as string | undefined,
    })
  }

  /**
   * Request human assistance for a contact
   */
  async requestHumanAssistance(contact: Contato, reason: string): Promise<JourneyResponse> {
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
