/**
 * Channel Adapter Pattern
 *
 * This pattern allows the CRM to handle messages from different channels
 * (WhatsApp, Instagram, Messenger) in a unified way.
 *
 * Reference: docs uteis/CRM Omni-Channel para Escola de Música.md
 * "Para evitar que o código do CRM se torne um emaranhado de condições
 * específicas para cada canal, recomenda-se o uso do Adapter Pattern"
 */

// Using local type to avoid circular dependency
export type Canal = 'whatsapp' | 'instagram' | 'messenger'

// Standardized incoming message format
export interface IncomingMessage {
  messageId: string
  from: string // Phone number or provider-specific ID
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'unknown'
  text?: string
  mediaUrl?: string
  raw?: unknown // Original payload for debugging
}

// Standardized outgoing message format
export interface OutgoingMessage {
  to: string
  text: string
  replyTo?: string // Message ID to reply to
}

// Result of sending a message
export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

// Webhook verification parameters
export interface WebhookVerification {
  mode: string
  token: string
  challenge: string
}

/**
 * Channel Adapter Interface
 *
 * Each channel (WhatsApp, Instagram, Messenger) implements this interface.
 * This allows the message processor to work with any channel without
 * knowing the specifics of each platform's API.
 */
export interface ChannelAdapter {
  /** Channel identifier */
  readonly channel: Canal

  /** Send a text message */
  sendText(to: string, text: string): Promise<SendResult>

  /** Send a message with quick reply buttons (if supported) */
  sendWithButtons?(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<SendResult>

  /** Send a list message (if supported) */
  sendList?(
    to: string,
    header: string,
    body: string,
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  ): Promise<SendResult>

  /** Parse incoming webhook payload to standardized format */
  parseIncomingMessage(payload: unknown): IncomingMessage | null

  /** Verify webhook signature for security */
  verifyWebhookSignature?(payload: unknown, signature: string): boolean

  /** Handle webhook verification (GET request) */
  handleVerification?(params: WebhookVerification): string | null
}

/**
 * Channel Adapter Registry
 *
 * Holds all registered channel adapters for easy access.
 */
class ChannelAdapterRegistry {
  private adapters = new Map<Canal, ChannelAdapter>()

  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channel, adapter)
  }

  get(channel: Canal): ChannelAdapter | undefined {
    return this.adapters.get(channel)
  }

  getAll(): ChannelAdapter[] {
    return Array.from(this.adapters.values())
  }

  has(channel: Canal): boolean {
    return this.adapters.has(channel)
  }
}

// Singleton registry instance
export const channelRegistry = new ChannelAdapterRegistry()
