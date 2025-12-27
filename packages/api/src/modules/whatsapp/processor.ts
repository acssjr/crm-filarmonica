import { matchIntent } from '../../lib/intent-matcher.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp-client.js'
import { SPAM_PROTECTION_RESPONSE } from '../../lib/templates.js'
import { spamProtection } from '../../lib/spam-protection.js'
import { findOrCreateContact, parseCampaignCode, contactService } from '../contacts/contact.service.js'
import { getOrCreateConversation } from '../conversations/conversation.service.js'
import { saveIncomingMessage, saveOutgoingMessage, isDuplicateMessage } from '../messages/message.service.js'
import {
  logFirstContact,
  logMessageReceived,
  logMessageSent,
  logIntentDetected,
} from '../events/event.service.js'
import { journeyService } from '../journey/journey.service.js'
import type { IncomingMessageJob } from './message.queue.js'

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

  // Check for spam (contextless messages) - now using Redis
  const hasContext = match.confidence !== 'low'
  const spamCheck = await spamProtection.check(from, hasContext)

  if (spamCheck.isSpam) {
    console.log(`[Processor] Spam protection triggered for ${from} (${spamCheck.count} messages)`)
    return {
      success: true,
      intent: 'spam_blocked',
      response: SPAM_PROTECTION_RESPONSE,
      blocked: true,
      contactId: contact.id,
      conversationId: conversation.id,
    }
  }

  // Try journey state machine first
  let responseText = match.response
  let finalIntent: string = match.intent

  // Get fresh contact for journey processing
  const currentContact = await contactService.getById(contact.id)

  if (currentContact) {
    const journeyResponse = await journeyService.processMessage(
      currentContact,
      text || '',
      match.intent
    )

    if (journeyResponse) {
      responseText = journeyResponse.response
      finalIntent = journeyResponse.newState || match.intent
    }
  }

  // Send response via WhatsApp
  const result = await sendWhatsAppMessage(from, responseText)

  // Save outgoing message
  await saveOutgoingMessage({
    conversaId: conversation.id,
    conteudo: responseText,
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
      intent: finalIntent,
      response: responseText,
      error: result.error,
      contactId: contact.id,
      conversationId: conversation.id,
    }
  }

  return {
    success: true,
    intent: finalIntent,
    response: responseText,
    messageId: result.messageId,
    contactId: contact.id,
    conversationId: conversation.id,
  }
}
