import type { Contato } from '../../../db/schema.js'
import type { JourneyState } from '../transitions.js'
import { handleNameCollection } from './name.handler.js'
import { handleAgeCollection } from './age.handler.js'
import { handleInstrumentCollection } from './instrument.handler.js'
import { handleSaxophoneVerification } from './saxophone.handler.js'
import { handleExperienceCollection } from './experience.handler.js'
import { handleAvailabilityCheck } from './availability.handler.js'
import { handleIncompatible } from './incompatible.handler.js'

export interface HandlerContext {
  contact: Contato
  message: string
  intent: string
}

export interface HandlerResult {
  response: string
  nextState?: JourneyState
  data?: Record<string, unknown>
  shouldSaveProspect?: boolean
}

export type StateHandler = (ctx: HandlerContext) => Promise<HandlerResult>

const handlers: Partial<Record<JourneyState, StateHandler>> = {
  coletando_nome: handleNameCollection,
  coletando_idade: handleAgeCollection,
  coletando_instrumento: handleInstrumentCollection,
  verificando_saxofone: handleSaxophoneVerification,
  coletando_experiencia: handleExperienceCollection,
  coletando_disponibilidade: handleAvailabilityCheck,
  incompativel: handleIncompatible,
}

export function getHandler(state: JourneyState): StateHandler | undefined {
  return handlers[state]
}

export async function handleState(
  state: JourneyState,
  ctx: HandlerContext
): Promise<HandlerResult | null> {
  const handler = getHandler(state)
  if (!handler) return null
  return handler(ctx)
}

// Prompts para iniciar cada estado
export const STATE_PROMPTS: Partial<Record<JourneyState, string>> = {
  coletando_nome: `Que otimo que voce tem interesse! 🎵

Para comecarmos, qual e o seu nome (ou o nome do interessado em aprender musica)?`,

  coletando_idade: `Obrigado! E qual a idade do interessado?

(Aceitamos alunos de todas as idades!)`,

  coletando_instrumento: `Perfeito! Qual instrumento voce gostaria de aprender?

🎺 Temos vagas para:
- Metais: Trompete, Trombone, *Tuba*, *Bombardino*
- Madeiras: Clarinete, *Sax Tenor*, *Sax Baritono*
- Percussao

⭐ *Instrumentos em destaque* = maior demanda, aulas mais disponiveis!`,

  coletando_experiencia: `Otima escolha! 🎵

Voce ja tem alguma experiencia com musica? (Pode ser qualquer coisa: aulas anteriores, tocar de ouvido, cantar, etc.)`,

  coletando_disponibilidade: `Quase la! 📅

Nossas aulas sao:
*Segunda, Quarta e Sexta*
*Das 15h as 17h*

Voce tem disponibilidade nesses horarios?`,
}
