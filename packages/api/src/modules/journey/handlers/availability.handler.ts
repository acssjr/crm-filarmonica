import type { HandlerContext, HandlerResult } from './index.js'

// Filarmônica schedule
const SCHEDULE = {
  days: ['segunda', 'quarta', 'sexta'],
  time: '15h às 17h',
  address: 'Praça da Bandeira, 25 - Centro, Nazaré - BA',
}

export async function handleAvailabilityCheck(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, contact } = ctx
  const normalized = message.toLowerCase().trim()

  // Check for positive availability
  const isAvailable =
    normalized.includes('sim') ||
    normalized.includes('posso') ||
    normalized.includes('consigo') ||
    normalized.includes('disponivel') ||
    normalized.includes('ok') ||
    normalized.includes('blz') ||
    normalized.includes('beleza') ||
    normalized.includes('pode ser') ||
    normalized.includes('vou') ||
    normalized.includes('estarei') ||
    normalized.includes('segunda') ||
    normalized.includes('quarta') ||
    normalized.includes('sexta')

  // Check for negative availability
  const notAvailable =
    normalized.includes('nao posso') ||
    normalized.includes('nao consigo') ||
    normalized.includes('trabalho') ||
    normalized.includes('estudo') ||
    normalized.includes('faculdade') ||
    normalized.includes('escola') ||
    normalized.includes('impossivel') ||
    normalized.includes('dificil') ||
    normalized.includes('infelizmente')

  if (notAvailable) {
    return {
      response: `Entendo que o horario pode ser dificil. 😔

Nossos ensaios acontecem:
📅 Segunda, Quarta e Sexta
🕐 Das 15h as 17h

Voce conseguiria vir em pelo menos *um desses dias*?

Se nao for possivel agora, podemos manter seu contato para futuras oportunidades!`,
      nextState: 'incompativel',
      data: {
        motivoIncompatibilidade: 'horario',
        detalhes: message.substring(0, 200),
      },
    }
  }

  if (isAvailable) {
    // Extract which days they can attend
    const availableDays: string[] = []
    if (normalized.includes('segunda')) availableDays.push('segunda')
    if (normalized.includes('quarta')) availableDays.push('quarta')
    if (normalized.includes('sexta')) availableDays.push('sexta')

    // If they said yes but didn't specify days, assume all
    const daysText =
      availableDays.length > 0
        ? availableDays.join(', ')
        : 'segunda, quarta e sexta'

    const contactName = contact.nome || 'futuro musico'

    return {
      response: `Perfeito, ${contactName}! 🎉

Estamos muito felizes em recebe-lo(a) na Filarmonica!

📍 *Endereco:* ${SCHEDULE.address}
📅 *Dias:* ${daysText}
🕐 *Horario:* ${SCHEDULE.time}

Pode aparecer em qualquer um desses dias para conhecer a turma e comecar!

Sera um prazer te receber! 🎵🎺`,
      nextState: 'cadastro_completo',
      data: {
        diasDisponiveis: availableDays.length > 0 ? availableDays : SCHEDULE.days,
      },
      shouldSaveProspect: true,
    }
  }

  // Unclear response
  return {
    response: `Nao entendi bem sua resposta. 🤔

Nossos ensaios sao:
📅 Segunda, Quarta e Sexta
🕐 Das 15h as 17h

Voce consegue participar em algum desses dias?`,
  }
}
