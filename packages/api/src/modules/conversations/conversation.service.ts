import {
  findActiveConversation,
  createConversation,
  updateConversation,
  findConversationById,
} from './conversation.repository.js'
import type { Conversa } from '../../db/schema.js'

// 24 hours in milliseconds
const NEW_CONVERSATION_THRESHOLD_MS = 24 * 60 * 60 * 1000

export interface GetOrCreateResult {
  conversation: Conversa
  isNew: boolean
}

export async function getOrCreateConversation(
  contatoId: string,
  canal: 'whatsapp' = 'whatsapp'
): Promise<GetOrCreateResult> {
  // Try to find active conversation
  const existing = await findActiveConversation(contatoId)

  if (existing) {
    // Check if last update was within 24 hours
    const lastUpdate = new Date(existing.updatedAt).getTime()
    const now = Date.now()

    if (now - lastUpdate < NEW_CONVERSATION_THRESHOLD_MS) {
      // Update timestamp and return existing
      await updateConversation(existing.id, { updatedAt: new Date() })
      return { conversation: existing, isNew: false }
    }

    // Close old conversation
    await updateConversation(existing.id, {
      status: 'encerrada',
      closedAt: new Date(),
    })
  }

  // Create new conversation
  const newConversation = await createConversation({
    contatoId,
    canal,
    status: 'ativa',
  })

  return { conversation: newConversation, isNew: true }
}

export async function getConversationById(id: string): Promise<Conversa | null> {
  return findConversationById(id)
}

export async function touchConversation(id: string): Promise<void> {
  await updateConversation(id, { updatedAt: new Date() })
}
