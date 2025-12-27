/**
 * WhatsApp Channel Adapter
 *
 * Implements the ChannelAdapter interface for WhatsApp Business API (Cloud API).
 * Handles sending/receiving messages through Meta's official API.
 */

import { config } from '../config/index.js'
import type {
  ChannelAdapter,
  IncomingMessage,
  SendResult,
  WebhookVerification,
} from './channel.adapter.js'

// WhatsApp API specific types
interface WhatsAppTextMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text'
  text: {
    preview_url: boolean
    body: string
  }
}

interface WhatsAppButtonMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'interactive'
  interactive: {
    type: 'button'
    body: { text: string }
    action: {
      buttons: Array<{
        type: 'reply'
        reply: { id: string; title: string }
      }>
    }
  }
}

interface WhatsAppListMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'interactive'
  interactive: {
    type: 'list'
    header?: { type: 'text'; text: string }
    body: { text: string }
    action: {
      button: string
      sections: Array<{
        title: string
        rows: Array<{ id: string; title: string; description?: string }>
      }>
    }
  }
}

interface WhatsAppApiResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

interface WhatsAppWebhookPayload {
  object: string
  entry?: Array<{
    id: string
    changes?: Array<{
      value?: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
          image?: { id: string; mime_type: string }
          audio?: { id: string; mime_type: string }
          video?: { id: string; mime_type: string }
          document?: { id: string; filename: string; mime_type: string }
          location?: { latitude: number; longitude: number }
          interactive?: {
            type: string
            button_reply?: { id: string; title: string }
            list_reply?: { id: string; title: string }
          }
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

/**
 * WhatsApp Business API Adapter
 */
export class WhatsAppAdapter implements ChannelAdapter {
  readonly channel = 'whatsapp' as const

  private get apiUrl(): string {
    return `${config.whatsapp.apiUrl}/${config.whatsapp.phoneId}/messages`
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  private isConfigured(): boolean {
    return !!(config.whatsapp.phoneId && config.whatsapp.accessToken)
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendText(to: string, text: string): Promise<SendResult> {
    if (!this.isConfigured()) {
      console.error('[WhatsApp] Credentials not configured')
      return {
        success: false,
        error: 'WhatsApp credentials not configured',
      }
    }

    const message: WhatsAppTextMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.normalizePhone(to),
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    }

    return this.sendRequest(message)
  }

  /**
   * Send a message with quick reply buttons
   */
  async sendWithButtons(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WhatsApp credentials not configured' }
    }

    // WhatsApp allows max 3 buttons
    const limitedButtons = buttons.slice(0, 3)

    const message: WhatsAppButtonMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.normalizePhone(to),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: limitedButtons.map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title.slice(0, 20) }, // Max 20 chars
          })),
        },
      },
    }

    return this.sendRequest(message)
  }

  /**
   * Send a list message
   */
  async sendList(
    to: string,
    header: string,
    body: string,
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  ): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WhatsApp credentials not configured' }
    }

    const message: WhatsAppListMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.normalizePhone(to),
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          button: 'Ver opções',
          sections: sections.map(section => ({
            title: section.title.slice(0, 24), // Max 24 chars
            rows: section.rows.map(row => ({
              id: row.id,
              title: row.title.slice(0, 24),
              description: row.description?.slice(0, 72),
            })),
          })),
        },
      },
    }

    return this.sendRequest(message)
  }

  /**
   * Parse incoming webhook payload
   */
  parseIncomingMessage(payload: unknown): IncomingMessage | null {
    try {
      const data = payload as WhatsAppWebhookPayload

      // Check if this is a valid WhatsApp webhook
      if (data.object !== 'whatsapp_business_account') {
        return null
      }

      const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      if (!message) {
        return null
      }

      // Determine message type
      let type: IncomingMessage['type'] = 'unknown'
      let text: string | undefined
      let mediaUrl: string | undefined

      switch (message.type) {
        case 'text':
          type = 'text'
          text = message.text?.body
          break
        case 'image':
          type = 'image'
          mediaUrl = message.image?.id // Media ID to fetch later
          break
        case 'audio':
          type = 'audio'
          mediaUrl = message.audio?.id
          break
        case 'video':
          type = 'video'
          mediaUrl = message.video?.id
          break
        case 'document':
          type = 'document'
          mediaUrl = message.document?.id
          break
        case 'location':
          type = 'location'
          break
        case 'interactive':
          type = 'text'
          // Extract button/list reply
          text =
            message.interactive?.button_reply?.title ||
            message.interactive?.list_reply?.title
          break
        default:
          type = 'unknown'
      }

      return {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type,
        text,
        mediaUrl,
        raw: message,
      }
    } catch (error) {
      console.error('[WhatsApp] Failed to parse webhook payload:', error)
      return null
    }
  }

  /**
   * Handle webhook verification (GET request from Meta)
   */
  handleVerification(params: WebhookVerification): string | null {
    if (
      params.mode === 'subscribe' &&
      params.token === config.whatsapp.verifyToken
    ) {
      console.log('[WhatsApp] Webhook verified successfully')
      return params.challenge
    }
    console.error('[WhatsApp] Webhook verification failed')
    return null
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(_payload: unknown, _signature: string): boolean {
    // TODO: Implement HMAC-SHA256 verification
    // This requires the app secret and crypto operations
    // For now, return true but should be implemented for production
    return true
  }

  /**
   * Normalize phone number to WhatsApp format
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /**
   * Send request to WhatsApp API
   */
  private async sendRequest(
    message: WhatsAppTextMessage | WhatsAppButtonMessage | WhatsAppListMessage
  ): Promise<SendResult> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        const errorData = await response.json() as { error?: { message?: string } }
        console.error('[WhatsApp] API error:', errorData)
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send message',
        }
      }

      const data = (await response.json()) as WhatsAppApiResponse
      return {
        success: true,
        messageId: data.messages[0]?.id,
      }
    } catch (error) {
      console.error('[WhatsApp] Send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export singleton instance
export const whatsappAdapter = new WhatsAppAdapter()
