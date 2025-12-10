import {
  findMessageByWhatsAppId,
  createMessage,
  updateMessageStatus,
  listMessages as listMessagesRepo,
  type ListMessagesParams,
} from './message.repository.js'
import type { Mensagem, NewMensagem } from '../../db/schema.js'

export interface SaveIncomingMessageParams {
  conversaId: string
  conteudo: string
  whatsappId: string
}

export async function saveIncomingMessage(
  params: SaveIncomingMessageParams
): Promise<Mensagem | null> {
  const { conversaId, conteudo, whatsappId } = params

  // Check for duplicate (idempotency)
  const existing = await findMessageByWhatsAppId(whatsappId)
  if (existing) {
    return null // Already processed
  }

  return createMessage({
    conversaId,
    direcao: 'entrada',
    conteudo,
    tipo: 'texto',
    whatsappId,
    statusEnvio: 'entregue',
  })
}

export interface SaveOutgoingMessageParams {
  conversaId: string
  conteudo: string
  whatsappId?: string
  enviadoPor?: string
  tipo?: 'automatica' | 'manual'
}

export async function saveOutgoingMessage(
  params: SaveOutgoingMessageParams
): Promise<Mensagem> {
  const { conversaId, conteudo, whatsappId, enviadoPor, tipo = 'automatica' } = params

  return createMessage({
    conversaId,
    direcao: 'saida',
    conteudo,
    tipo,
    whatsappId,
    enviadoPor,
    statusEnvio: whatsappId ? 'enviada' : 'pendente',
  })
}

export async function markMessageAsSent(
  id: string,
  whatsappId: string
): Promise<void> {
  await updateMessageStatus(id, 'enviada')
}

export async function markMessageAsDelivered(id: string): Promise<void> {
  await updateMessageStatus(id, 'entregue')
}

export async function markMessageAsRead(id: string): Promise<void> {
  await updateMessageStatus(id, 'lida')
}

export async function markMessageAsFailed(id: string): Promise<void> {
  await updateMessageStatus(id, 'falhou')
}

export async function getMessages(params: ListMessagesParams): Promise<Mensagem[]> {
  return listMessagesRepo(params)
}

export async function isDuplicateMessage(whatsappId: string): Promise<boolean> {
  const existing = await findMessageByWhatsAppId(whatsappId)
  return existing !== null
}
