import type { HandlerContext, HandlerResult } from './index.js'
import { STATE_PROMPTS } from './index.js'

export async function handleAgeCollection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx

  const age = extractAge(message)

  if (age === null || age < 0 || age > 120) {
    return {
      response: `Desculpe, nao entendi a idade. Pode informar apenas o numero?

Por exemplo: "12 anos" ou apenas "12"`,
    }
  }

  let ageComment = ''
  if (age < 7) {
    ageComment = '\n\n(Para criancas menores de 7 anos, recomendamos comecar pela musicalizacao infantil!)'
  } else if (age >= 60) {
    ageComment = '\n\n(Nunca e tarde para aprender musica! Temos alunos de todas as idades. 🎵)'
  }

  return {
    response: `${age} anos, anotado! ${ageComment}

${STATE_PROMPTS.coletando_instrumento}`,
    nextState: 'coletando_instrumento',
    data: { idade: age },
  }
}

function extractAge(message: string): number | null {
  // Remove common words and extract number
  const cleaned = message
    .replace(/anos?|idade|tenho|ele tem|ela tem|e|eh|é/gi, '')
    .trim()

  // Find first number in the message
  const match = cleaned.match(/\d+/)
  if (!match) return null

  return parseInt(match[0], 10)
}
