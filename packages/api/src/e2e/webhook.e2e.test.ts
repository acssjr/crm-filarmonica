/**
 * E2E Tests para Webhook WhatsApp
 *
 * Testa o fluxo do webhook:
 * 1. Webhook recebe mensagem
 * 2. Retorna 200 OK imediatamente (SLA WhatsApp)
 * 3. Mensagem é enfileirada para processamento assíncrono
 *
 * Nota: O envio de resposta é feito pelo worker, não pelo webhook.
 * Para testar o fluxo completo, veja processor.e2e.test.ts
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { webhookRoutes } from '../modules/whatsapp/webhook.routes.js'
import { enqueueIncomingMessage } from '../modules/whatsapp/message.queue.js'

describe('Webhook WhatsApp E2E', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(webhookRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /webhooks/whatsapp (Verificação)', () => {
    it('deve retornar challenge quando token é válido', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/webhooks/whatsapp',
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'filarmonica-verify-token',
          'hub.challenge': 'challenge-123',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toBe('challenge-123')
    })

    it('deve retornar 403 quando token é inválido', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/webhooks/whatsapp',
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'challenge-123',
        },
      })

      expect(response.statusCode).toBe(403)
      expect(response.body).toBe('Forbidden')
    })

    it('deve retornar 403 quando mode não é subscribe', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/webhooks/whatsapp',
        query: {
          'hub.mode': 'unsubscribe',
          'hub.verify_token': 'filarmonica-verify-token',
          'hub.challenge': 'challenge-123',
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('POST /webhooks/whatsapp (Mensagem)', () => {
    // Payload padrão do WhatsApp Business API
    const createWebhookPayload = (from: string, text: string, messageId = 'wamid.test') => ({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5575999000000',
                  phone_number_id: '123456789',
                },
                contacts: [{ profile: { name: 'Test User' }, wa_id: from }],
                messages: [
                  {
                    from,
                    id: messageId,
                    timestamp: String(Date.now()),
                    type: 'text',
                    text: { body: text },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    })

    it('deve retornar 200 OK imediatamente (SLA WhatsApp)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: createWebhookPayload('5575999123456', 'Olá'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toBe('OK')
    })

    it('deve enfileirar mensagem de texto para processamento', async () => {
      const payload = createWebhookPayload('5575999111111', 'Olá, gostaria de informações', 'wamid.123')

      await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload,
      })

      expect(enqueueIncomingMessage).toHaveBeenCalledWith({
        from: '5575999111111',
        messageId: 'wamid.123',
        timestamp: expect.any(String),
        type: 'text',
        text: 'Olá, gostaria de informações',
        receivedAt: expect.any(String),
      })
    })

    it('deve enfileirar mensagem com código de campanha', async () => {
      const payload = createWebhookPayload('5575999222222', 'CAMP01', 'wamid.456')

      await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload,
      })

      expect(enqueueIncomingMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '5575999222222',
          text: 'CAMP01',
        })
      )
    })

    it('deve processar múltiplas mensagens sequencialmente', async () => {
      // Primeira mensagem
      await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: createWebhookPayload('5575999333333', 'Olá', 'msg-1'),
      })

      // Segunda mensagem
      await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: createWebhookPayload('5575999333333', 'Quero saber sobre aulas', 'msg-2'),
      })

      // Deve ter enfileirado ambas
      expect(enqueueIncomingMessage).toHaveBeenCalledTimes(2)
    })

    it('não deve enfileirar para payload de status update (sem mensagem)', async () => {
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  statuses: [
                    {
                      id: 'wamid.status',
                      status: 'delivered',
                      timestamp: String(Date.now()),
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: statusPayload,
      })

      expect(response.statusCode).toBe(200)
      // Não deve tentar enfileirar para status update
      expect(enqueueIncomingMessage).not.toHaveBeenCalled()
    })

    it('deve lidar com payload malformado graciosamente', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: { invalid: 'payload' },
      })

      // Deve retornar 200 mesmo com payload inválido (requisito do WhatsApp)
      expect(response.statusCode).toBe(200)
      expect(enqueueIncomingMessage).not.toHaveBeenCalled()
    })

    it('deve enfileirar mensagem de imagem (tipo não-texto)', async () => {
      const imagePayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: '5575999444444',
                      id: 'wamid.image',
                      timestamp: String(Date.now()),
                      type: 'image',
                      image: { id: 'img-123', mime_type: 'image/jpeg' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      }

      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: imagePayload,
      })

      expect(response.statusCode).toBe(200)
      expect(enqueueIncomingMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '5575999444444',
          type: 'image',
          text: undefined,
        })
      )
    })

    it('deve incluir timestamp correto na mensagem enfileirada', async () => {
      const beforeTime = new Date().toISOString()

      await app.inject({
        method: 'POST',
        url: '/webhooks/whatsapp',
        payload: createWebhookPayload('5575999555555', 'Test'),
      })

      const afterTime = new Date().toISOString()

      expect(enqueueIncomingMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          receivedAt: expect.any(String),
        })
      )

      // Verifica que o timestamp está dentro do intervalo esperado
      const call = vi.mocked(enqueueIncomingMessage).mock.calls[0][0]
      expect(call.receivedAt >= beforeTime).toBe(true)
      expect(call.receivedAt <= afterTime).toBe(true)
    })
  })
})
