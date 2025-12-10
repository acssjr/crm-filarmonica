import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { parseWebhookPayload } from '../../lib/whatsapp-client.js'
import { enqueueIncomingMessage } from './message.queue.js'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'filarmonica-verify-token'

interface WebhookVerifyQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Webhook verification (GET)
  app.get<{ Querystring: WebhookVerifyQuery }>(
    '/webhooks/whatsapp',
    async (request: FastifyRequest<{ Querystring: WebhookVerifyQuery }>, reply: FastifyReply) => {
      const mode = request.query['hub.mode']
      const token = request.query['hub.verify_token']
      const challenge = request.query['hub.challenge']

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] Verification successful')
        return reply.status(200).send(challenge)
      }

      console.log('[Webhook] Verification failed - invalid token')
      return reply.status(403).send('Forbidden')
    }
  )

  // Webhook receiver (POST)
  app.post('/webhooks/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    // Always respond 200 immediately to acknowledge receipt
    // This is critical for WhatsApp's SLA requirements
    reply.status(200).send('OK')

    try {
      const message = parseWebhookPayload(request.body)

      if (!message) {
        console.log('[Webhook] No message in payload, possibly a status update')
        return
      }

      console.log(`[Webhook] Received message from ${message.from}: ${message.text?.substring(0, 50) || '[non-text]'}`)

      // Enqueue for async processing
      const jobId = await enqueueIncomingMessage({
        from: message.from,
        messageId: message.messageId,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text,
        receivedAt: new Date().toISOString(),
      })

      console.log(`[Webhook] Message enqueued as job ${jobId}`)
    } catch (error) {
      console.error('[Webhook] Error processing webhook:', error)
      // Don't throw - we already sent 200
    }
  })
}
