import { eq, desc, and, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { conversas, contatos, mensagens, type Conversa, type NewConversa } from '../../db/schema.js'

export async function findActiveConversation(contatoId: string): Promise<Conversa | null> {
  const result = await db
    .select()
    .from(conversas)
    .where(
      and(
        eq(conversas.contatoId, contatoId),
        eq(conversas.status, 'ativa')
      )
    )
    .orderBy(desc(conversas.updatedAt))
    .limit(1)

  return result[0] || null
}

export async function findConversationById(id: string): Promise<Conversa | null> {
  const result = await db
    .select()
    .from(conversas)
    .where(eq(conversas.id, id))
    .limit(1)

  return result[0] || null
}

export async function createConversation(data: NewConversa): Promise<Conversa> {
  const result = await db
    .insert(conversas)
    .values(data)
    .returning()

  return result[0]
}

export async function updateConversation(
  id: string,
  data: Partial<NewConversa>
): Promise<Conversa | null> {
  const result = await db
    .update(conversas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(conversas.id, id))
    .returning()

  return result[0] || null
}

export async function closeConversation(id: string): Promise<Conversa | null> {
  return updateConversation(id, {
    status: 'encerrada',
    closedAt: new Date(),
  })
}

export async function listActiveConversations() {
  const result = await db
    .select({
      conversa: conversas,
      contato: contatos,
    })
    .from(conversas)
    .innerJoin(contatos, eq(conversas.contatoId, contatos.id))
    .where(eq(conversas.status, 'ativa'))
    .orderBy(desc(conversas.updatedAt))

  return result.map((row) => ({
    ...row.conversa,
    contato: row.contato,
  }))
}

export async function listConversationsByContact(contatoId: string) {
  return db
    .select()
    .from(conversas)
    .where(eq(conversas.contatoId, contatoId))
    .orderBy(desc(conversas.createdAt))
}

export async function countActiveConversations(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversas)
    .where(eq(conversas.status, 'ativa'))

  return Number(result[0]?.count || 0)
}

export async function getConversationWithMessages(id: string) {
  const conversa = await findConversationById(id)
  if (!conversa) return null

  const contato = await db
    .select()
    .from(contatos)
    .where(eq(contatos.id, conversa.contatoId))
    .limit(1)

  const msgs = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.conversaId, id))
    .orderBy(mensagens.createdAt)

  return {
    ...conversa,
    contato: contato[0],
    mensagens: msgs,
  }
}
