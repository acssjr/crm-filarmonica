import type { HandlerContext, HandlerResult } from './index.js'
import { STATE_PROMPTS } from './index.js'

export async function handleSaxophoneVerification(ctx: HandlerContext): Promise<HandlerResult> {
  const { message } = ctx
  const normalized = message.toLowerCase().trim()

  // Check if user accepts alternative
  const acceptsAlternative =
    normalized.includes('sim') ||
    normalized.includes('ok') ||
    normalized.includes('pode ser') ||
    normalized.includes('tenor') ||
    normalized.includes('baritono') ||
    normalized.includes('clarinete') ||
    normalized.includes('trombone') ||
    normalized.includes('aceito') ||
    normalized.includes('quero')

  // Check if user wants to wait
  const wantsToWait =
    normalized.includes('aguardar') ||
    normalized.includes('esperar') ||
    normalized.includes('nao') ||
    normalized.includes('prefiro alto')

  if (wantsToWait) {
    return {
      response: `Entendido! Vou anotar seu interesse no Saxofone Alto.

Quando tivermos vagas, entraremos em contato. 📝

Enquanto isso, fique a vontade para nos visitar e conhecer a Filarmonica!

📍 Praca da Bandeira, 25 - Centro, Nazare - BA
🕐 Seg/Qua/Sex das 15h as 17h`,
      nextState: 'incompativel',
      data: { instrumentoSugerido: null, notas: 'Aguardando vaga sax alto' },
    }
  }

  if (acceptsAlternative) {
    // Try to extract which alternative they chose
    let chosenInstrument = 'sax tenor' // default

    if (normalized.includes('baritono')) {
      chosenInstrument = 'sax baritono'
    } else if (normalized.includes('clarinete')) {
      chosenInstrument = 'clarinete'
    } else if (normalized.includes('trombone')) {
      chosenInstrument = 'trombone'
    }

    return {
      response: `Otima decisao! O ${chosenInstrument} e um instrumento incrivel! 🎵

${STATE_PROMPTS.coletando_experiencia}`,
      nextState: 'coletando_experiencia',
      data: { instrumentoSugerido: chosenInstrument },
    }
  }

  // Unclear response
  return {
    response: `Nao entendi sua resposta. 🤔

Voce gostaria de:
1. Experimentar o *Sax Tenor* ou *Baritono* (mesmo dedilhado do Alto)
2. *Aguardar* uma vaga no Sax Alto

Qual prefere?`,
  }
}
