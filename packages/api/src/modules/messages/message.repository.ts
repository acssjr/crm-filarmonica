import { eq, desc, lt, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { mensagens, type Mensagem, type NewMensagem } from '../../db/schema.js'

export async function findMessageByWhatsAppId(whatsappId: string): Promise<Mensagem | null> {
  const result = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.whatsappId, whatsappId))
    .limit(1)

  return result[0] || null
}

export async function createMessage(data: NewMensagem): Promise<Mensagem> {
  const result = await db
    .insert(mensagens)
    .values(data)
    .returning()

  return result[0]
}

export async function updateMessageStatus(
  id: string,
  statusEnvio: Mensagem['statusEnvio']
): Promise<void> {
  await db
    .update(mensagens)
    .set({ statusEnvio })
    .where(eq(mensagens.id, id))
}

export interface ListMessagesParams {
  conversaId: string
  before?: Date
  limit?: number
}

export async function listMessages(params: ListMessagesParams): Promise<Mensagem[]> {
  const { conversaId, before, limit = 50 } = params

  let query = db
    .select()
    .from(mensagens)
    .where(eq(mensagens.conversaId, conversaId))

  if (before) {
    query = db
      .select()
      .from(mensagens)
      .where(eq(mensagens.conversaId, conversaId))
      .where(lt(mensagens.createdAt, before))
  }

  return query
    .orderBy(desc(mensagens.createdAt))
    .limit(limit)
}

export async function getLastMessage(conversaId: string): Promise<Mensagem | null> {
  const result = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.conversaId, conversaId))
    .orderBy(desc(mensagens.createdAt))
    .limit(1)

  return result[0] || null
}
