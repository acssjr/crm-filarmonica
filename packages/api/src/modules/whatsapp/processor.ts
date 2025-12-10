import { matchIntent } from '../../lib/intent-matcher.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp-client.js'
import { SPAM_PROTECTION_RESPONSE } from '../../lib/templates.js'
import { findOrCreateContact, parseCampaignCode } from '../contacts/contact.service.js'
import { getOrCreateConversation } from '../conversations/conversation.service.js'
import { saveIncomingMessage, saveOutgoingMessage, isDuplicateMessage } from '../messages/message.service.js'
import {
  logFirstContact,
  logMessageReceived,
  logMessageSent,
  logIntentDetected,
} from '../events/event.service.js'
import type { IncomingMessageJob } from './message.queue.js'

// Simple in-memory spam tracking (replace with Redis in production)
const spamTracker = new Map<string, { count: number; lastReset: number }>()
const SPAM_THRESHOLD = 3
const SPAM_WINDOW_MS = 60 * 1000 // 1 minute

function checkSpamProtection(from: string, hasContext: boolean): boolean {
  const now = Date.now()
  const tracker = spamTracker.get(from)

  if (!tracker || now - tracker.lastReset > SPAM_WINDOW_MS) {
    spamTracker.set(from, { count: hasContext ? 0 : 1, lastReset: now })
    return false
  }

  if (hasContext) {
    tracker.count = 0
    return false
  }

  tracker.count++
  return tracker.count >= SPAM_THRESHOLD
}

export interface ProcessResult {
  success: boolean
  intent: string
  response: string
  messageId?: string
  blocked?: boolean
  error?: string
  contactId?: string
  conversationId?: string
}

export async function processIncomingMessage(
  job: IncomingMessageJob
): Promise<ProcessResult> {
  const { from, messageId: whatsappMessageId, type, text } = job

  // Check for duplicate message (idempotency)
  if (await isDuplicateMessage(whatsappMessageId)) {
    console.log(`[Processor] Duplicate message ${whatsappMessageId}, skipping`)
    return {
      success: true,
      intent: 'duplicate',
      response: '',
      blocked: true,
    }
  }

  // Parse campaign code from first message
  const campaignCode = parseCampaignCode(text)
  const origem = campaignCode ? 'campanha' : 'organico'

  // Find or create contact
  const { contact, isNew } = await findOrCreateContact(from, origem, campaignCode)

  // Log first contact event if new
  if (isNew) {
    await logFirstContact(contact.id, origem)
  }

  // Get or create conversation
  const { conversation } = await getOrCreateConversation(contact.id)

  // Save incoming message
  await saveIncomingMessage({
    conversaId: conversation.id,
    conteudo: text || '[mensagem nao-texto]',
    whatsappId: whatsappMessageId,
  })

  // Log message received event
  await logMessageReceived(contact.id, whatsappMessageId, text)

  // Match intent and get response
  const match = matchIntent(text, type)

  // Log intent detected
  await logIntentDetected(contact.id, match.intent, match.confidence)

  // Check for spam (contextless messages)
  const hasContext = match.confidence !== 'low'
  const isSpam = checkSpamProtection(from, hasContext)

  if (isSpam) {
    console.log(`[Processor] Spam protection triggered for ${from}`)
    return {
      success: true,
      intent: 'spam_blocked',
      response: SPAM_PROTECTION_RESPONSE,
      blocked: true,
      contactId: contact.id,
      conversationId: conversation.id,
    }
  }

  // Send response via WhatsApp
  const result = await sendWhatsAppMessage(from, match.response)

  // Save outgoing message
  await saveOutgoingMessage({
    conversaId: conversation.id,
    conteudo: match.response,
    whatsappId: result.messageId,
    tipo: 'automatica',
  })

  // Log message sent event
  if (result.success && result.messageId) {
    await logMessageSent(contact.id, result.messageId, 'automatica')
  }

  if (!result.success) {
    return {
      success: false,
      intent: match.intent,
      response: match.response,
      error: result.error,
      contactId: contact.id,
      conversationId: conversation.id,
    }
  }

  return {
    success: true,
    intent: match.intent,
    response: match.response,
    messageId: result.messageId,
    contactId: contact.id,
    conversationId: conversation.id,
  }
}
