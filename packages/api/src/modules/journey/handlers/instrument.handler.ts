import type { HandlerContext, HandlerResult } from './index.js'
import { STATE_PROMPTS } from './index.js'
import {
  isRestrictedInstrument,
  isPriorityInstrument,
  getSuggestedAlternatives,
  AVAILABLE_INSTRUMENTS,
} from '../../../lib/instruments.js'

export async function handleInstrumentCollection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  const instrument = extractInstrument(message)

  if (!instrument) {
    return {
      response: `Desculpe, nao reconheci o instrumento. 🎵

Temos aulas para:
- Trompete, Trombone, Tuba, Bombardino
- Clarinete, Sax Tenor, Sax Baritono
- Percussao

Qual desses te interessa?`,
    }
  }

  // Check if it's the restricted saxophone alto
  if (isRestrictedInstrument(instrument)) {
    const alternatives = getSuggestedAlternatives(instrument)
    return {
      response: `Entendo seu interesse no Saxofone Alto! 🎷

Preciso te explicar algo importante: no momento, estamos com muitos alunos de Sax Alto e poucas vagas.

Mas temos otimas alternativas:
${alternatives.map((a) => `- *${a.charAt(0).toUpperCase() + a.slice(1)}*`).join('\n')}

O Sax Tenor e Baritono tem o mesmo dedilhado, e voce pode migrar depois!

Gostaria de considerar uma dessas opcoes, ou prefere aguardar uma vaga no Sax Alto?`,
      nextState: 'verificando_saxofone',
      data: { instrumentoDesejado: instrument },
    }
  }

  // Priority instrument - encourage!
  let priorityMessage = ''
  if (isPriorityInstrument(instrument)) {
    priorityMessage = '\n\n⭐ Otima escolha! Esse instrumento esta em alta demanda na banda!'
  }

  return {
    response: `${instrument.charAt(0).toUpperCase() + instrument.slice(1)}, excelente escolha! 🎵${priorityMessage}

${STATE_PROMPTS.coletando_experiencia}`,
    nextState: 'coletando_experiencia',
    data: { instrumentoDesejado: instrument },
  }
}

function extractInstrument(message: string): string | null {
  const normalized = message.toLowerCase().trim()

  // Direct matches
  for (const instrument of AVAILABLE_INSTRUMENTS) {
    if (normalized.includes(instrument.toLowerCase())) {
      return instrument
    }
  }

  // Common variations
  const variations: Record<string, string> = {
    'saxofone': 'sax tenor',
    'sax': 'sax tenor',
    'trumpet': 'trompete',
    'clarinet': 'clarinete',
    'flute': 'flauta',
    'bateria': 'percussao',
    'tambor': 'percussao',
    'caixa': 'percussao',
  }

  for (const [variant, instrument] of Object.entries(variations)) {
    if (normalized.includes(variant)) {
      return instrument
    }
  }

  // Check for sax alto specifically
  if (normalized.includes('alto') && normalized.includes('sax')) {
    return 'sax alto'
  }

  return null
}
