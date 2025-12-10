import type { HandlerContext, HandlerResult } from './index.js'
import { STATE_PROMPTS } from './index.js'

export async function handleNameCollection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  // Extract name from message (simple heuristic)
  const name = extractName(message)

  if (!name || name.length < 2) {
    return {
      response: `Desculpe, nao entendi o nome. Pode repetir por favor?

Qual e o nome do interessado em aprender musica?`,
    }
  }

  return {
    response: `Prazer, ${name}! 😊

${STATE_PROMPTS.coletando_idade}`,
    nextState: 'coletando_idade',
    data: { nome: name },
  }
}

function extractName(message: string): string {
  // Remove common prefixes
  let name = message
    .replace(/^(meu nome e|me chamo|sou o|sou a|eu sou|nome:?)\s*/i, '')
    .replace(/^(e|eh|é)\s*/i, '')
    .trim()

  // Take first 2-3 words as name
  const words = name.split(/\s+/).slice(0, 3)
  name = words.join(' ')

  // Capitalize first letter of each word
  name = name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return name
}
