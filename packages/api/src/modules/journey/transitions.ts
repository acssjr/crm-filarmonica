import type { Contato } from '../../db/schema.js'

export type JourneyState = Contato['estadoJornada']

// Valid state transitions
export const TRANSITIONS: Record<JourneyState, JourneyState[]> = {
  inicial: ['boas_vindas'],
  boas_vindas: ['coletando_nome', 'atendimento_humano'],
  coletando_nome: ['coletando_idade', 'atendimento_humano'],
  coletando_idade: ['coletando_instrumento', 'atendimento_humano'],
  coletando_instrumento: ['verificando_saxofone', 'coletando_experiencia', 'atendimento_humano'],
  verificando_saxofone: ['coletando_experiencia', 'atendimento_humano'],
  coletando_experiencia: ['coletando_disponibilidade', 'atendimento_humano'],
  coletando_disponibilidade: ['qualificado', 'incompativel', 'atendimento_humano'],
  incompativel: ['atendimento_humano'],
  qualificado: ['atendimento_humano'],
  atendimento_humano: [],
}

export function canTransition(from: JourneyState, to: JourneyState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextStates(current: JourneyState): JourneyState[] {
  return TRANSITIONS[current] || []
}

// Triggers that cause state transitions
export interface TransitionTrigger {
  intent?: string
  keyword?: string
  pattern?: RegExp
}

export const STATE_TRIGGERS: Record<JourneyState, TransitionTrigger[]> = {
  inicial: [],
  boas_vindas: [
    { intent: 'saudacao' },
    { intent: 'matricula' },
    { keyword: 'oi' },
    { keyword: 'ola' },
  ],
  coletando_nome: [
    { intent: 'matricula' },
    { keyword: 'quero' },
    { keyword: 'interesse' },
    { keyword: 'matricula' },
  ],
  coletando_idade: [],
  coletando_instrumento: [],
  verificando_saxofone: [
    { pattern: /sax(ofone)?\s*(alto)?/i },
  ],
  coletando_experiencia: [],
  coletando_disponibilidade: [],
  incompativel: [
    { keyword: 'nao' },
    { keyword: 'impossivel' },
  ],
  qualificado: [
    { keyword: 'sim' },
    { keyword: 'tenho' },
    { keyword: 'disponivel' },
  ],
  atendimento_humano: [
    { keyword: 'humano' },
    { keyword: 'pessoa' },
    { keyword: 'atendente' },
  ],
}
