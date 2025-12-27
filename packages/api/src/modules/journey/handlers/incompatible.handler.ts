import type { HandlerContext, HandlerResult } from './index.js'

export async function handleIncompatible(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, contact } = ctx
  const normalized = message.toLowerCase().trim()

  // Check if they want to be kept on waitlist
  const wantsWaitlist =
    normalized.includes('sim') ||
    normalized.includes('pode') ||
    normalized.includes('guarda') ||
    normalized.includes('manter') ||
    normalized.includes('avisa') ||
    normalized.includes('contato') ||
    normalized.includes('quero') ||
    normalized.includes('ok')

  // Check if they don't want to continue
  const noInterest =
    normalized.includes('nao') ||
    normalized.includes('deixa') ||
    normalized.includes('obrigado') ||
    normalized.includes('valeu') ||
    normalized.includes('tchau')

  const contactName = contact.nome || ''

  if (wantsWaitlist) {
    return {
      response: `Anotado${contactName ? `, ${contactName}` : ''}! 📝

Vamos manter seu contato e avisaremos quando:
- Tivermos vagas para o instrumento desejado
- Houver mudancas nos horarios
- Tivermos eventos especiais abertos ao publico

Enquanto isso, fique a vontade para nos visitar!

📍 Praca da Bandeira, 25 - Centro, Nazare - BA

Ate breve! 🎵`,
      nextState: 'qualificado',
      data: {
        listaEspera: true,
      },
      shouldSaveProspect: true,
    }
  }

  if (noInterest) {
    return {
      response: `Tudo bem${contactName ? `, ${contactName}` : ''}!

Obrigado pelo interesse na Filarmonica.

Se mudar de ideia, e so nos chamar! 🎵

Ate mais!`,
      nextState: 'qualificado',
      data: {
        listaEspera: false,
        desistiu: true,
      },
    }
  }

  // Unclear response - ask for clarification
  return {
    response: `Gostaria que guardassemos seu contato para futuras oportunidades?

Podemos avisar quando:
- Tivermos vagas disponiveis
- Os horarios mudarem
- Tivermos eventos abertos`,
  }
}
