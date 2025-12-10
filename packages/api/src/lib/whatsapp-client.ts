const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text'
  text: {
    preview_url: boolean
    body: string
  }
}

export interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<SendMessageResult> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error('WhatsApp credentials not configured')
    return {
      success: false,
      error: 'WhatsApp credentials not configured',
    }
  }

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`

  const message: WhatsAppMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to.replace(/\D/g, ''), // Remove non-digits
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('WhatsApp API error:', errorData)
      return {
        success: false,
        error: errorData.error?.message || 'Failed to send message',
      }
    }

    const data = (await response.json()) as WhatsAppResponse
    return {
      success: true,
      messageId: data.messages[0]?.id,
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Parse incoming webhook payload
export interface IncomingMessage {
  from: string
  messageId: string
  timestamp: string
  type: string
  text?: string
}

export function parseWebhookPayload(payload: unknown): IncomingMessage | null {
  try {
    const data = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from: string
              id: string
              timestamp: string
              type: string
              text?: { body: string }
            }>
          }
        }>
      }>
    }

    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) return null

    return {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text?.body,
    }
  } catch {
    return null
  }
}
