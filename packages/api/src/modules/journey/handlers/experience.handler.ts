import type { HandlerContext, HandlerResult } from './index.js'
import { STATE_PROMPTS } from './index.js'

export async function handleExperienceCollection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx
  const normalized = message.toLowerCase().trim()

  // Check for experience levels
  const hasExperience =
    normalized.includes('sim') ||
    normalized.includes('toco') ||
    normalized.includes('tocava') ||
    normalized.includes('tenho experiencia') ||
    normalized.includes('ja toquei') ||
    normalized.includes('aprendi') ||
    normalized.includes('estudei') ||
    normalized.includes('anos') ||
    normalized.includes('meses')

  const noExperience =
    normalized.includes('nao') ||
    normalized.includes('nunca') ||
    normalized.includes('iniciante') ||
    normalized.includes('comecar') ||
    normalized.includes('zero') ||
    normalized.includes('nenhuma')

  let experienceLevel: string
  let experienceDetails: string | null = null

  if (noExperience) {
    experienceLevel = 'iniciante'
  } else if (hasExperience) {
    experienceLevel = 'experiente'
    // Try to extract time of experience
    const yearsMatch = normalized.match(/(\d+)\s*anos?/)
    const monthsMatch = normalized.match(/(\d+)\s*mes(?:es)?/)

    if (yearsMatch) {
      experienceDetails = `${yearsMatch[1]} anos`
    } else if (monthsMatch) {
      experienceDetails = `${monthsMatch[1]} meses`
    } else {
      experienceDetails = message.substring(0, 100) // Store raw response
    }
  } else {
    // Unclear response
    return {
      response: `Pode me contar um pouco mais? 🤔

Voce ja tocou algum instrumento antes?
- Se sim, por quanto tempo?
- Se nao, sem problemas! Aceitamos iniciantes.`,
    }
  }

  return {
    response: `${experienceLevel === 'iniciante' ? 'Otimo! Todos sao bem-vindos, iniciantes ou experientes! 🎵' : 'Que legal! Sua experiencia vai ajudar muito! 🎵'}

${STATE_PROMPTS.verificando_disponibilidade}`,
    nextState: 'verificando_disponibilidade',
    data: {
      experiencia: experienceLevel,
      detalhesExperiencia: experienceDetails,
    },
  }
}
