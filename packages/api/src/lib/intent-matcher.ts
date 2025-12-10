import { detectIntent, type IntentId } from './intents.js'
import { getTemplateResponse, NON_TEXT_MESSAGE_RESPONSE } from './templates.js'

export interface MatchResult {
  intent: IntentId
  response: string
  confidence: 'high' | 'medium' | 'low'
}

export function matchIntent(text: string | undefined, messageType: string): MatchResult {
  // Handle non-text messages
  if (messageType !== 'text' || !text) {
    return {
      intent: 'desconhecido',
      response: NON_TEXT_MESSAGE_RESPONSE,
      confidence: 'high',
    }
  }

  const intent = detectIntent(text)
  const response = getTemplateResponse(intent)

  // Determine confidence based on intent
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (intent === 'desconhecido') {
    confidence = 'low'
  } else if (['saudacao', 'horario', 'localizacao'].includes(intent)) {
    confidence = 'high'
  }

  return {
    intent,
    response,
    confidence,
  }
}
