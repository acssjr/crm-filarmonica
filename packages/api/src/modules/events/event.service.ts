import { createEvent } from './event.repository.js'
import type { Evento } from '../../db/schema.js'

export async function logFirstContact(contatoId: string, origem: string): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'primeiro_contato',
    dados: { origem },
  })
}

export async function logMessageReceived(
  contatoId: string,
  messageId: string,
  text?: string
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'mensagem_recebida',
    dados: { messageId, preview: text?.substring(0, 100) },
  })
}

export async function logMessageSent(
  contatoId: string,
  messageId: string,
  tipo: 'automatica' | 'manual'
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'mensagem_enviada',
    dados: { messageId, tipo },
  })
}

export async function logIntentDetected(
  contatoId: string,
  intent: string,
  confidence: string
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'intencao_detectada',
    dados: { intent, confidence },
  })
}

export async function logJourneyUpdated(
  contatoId: string,
  from: string,
  to: string
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'jornada_atualizada',
    dados: { de: from, para: to },
  })
}

export async function logProspectCreated(
  contatoId: string,
  interessadoId: string
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'ficha_gerada',
    dados: { interessadoId },
  })
}

export async function logScheduleIncompatible(contatoId: string): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'horario_incompativel',
    dados: {},
  })
}

export async function logHumanTakeover(
  contatoId: string,
  adminId: string
): Promise<Evento> {
  return createEvent({
    contatoId,
    tipo: 'atendimento_humano',
    dados: { adminId },
  })
}
