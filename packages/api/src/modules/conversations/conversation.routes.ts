import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { listActiveConversations, getConversationWithMessages } from './conversation.repository.js'
import { listMessages } from '../messages/message.repository.js'
import { saveOutgoingMessage } from '../messages/message.service.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp-client.js'
import { logMessageSent } from '../events/event.service.js'

interface ConversationParams {
  id: string
}

interface ListConversationsQuery {
  status?: string
}

interface ListMessagesQuery {
  before?: string
  limit?: string
}

interface SendMessageBody {
  conteudo: string
}

export async function conversationRoutes(app: FastifyInstance): Promise<void> {
  // GET /conversations
  app.get<{ Querystring: ListConversationsQuery }>(
    '/conversations',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest<{ Querystring: ListConversationsQuery }>, reply: FastifyReply) => {
      const conversations = await listActiveConversations()
      return reply.send({
        data: conversations,
        total: conversations.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      })
    }
  )

  // GET /conversations/:id
  app.get<{ Params: ConversationParams }>(
    '/conversations/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ConversationParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const conversation = await getConversationWithMessages(id)

      if (!conversation) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Conversa nao encontrada',
          statusCode: 404,
        })
      }

      return reply.send({ conversa: conversation })
    }
  )

  // GET /conversations/:id/messages
  app.get<{ Params: ConversationParams; Querystring: ListMessagesQuery }>(
    '/conversations/:id/messages',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ConversationParams; Querystring: ListMessagesQuery }>, reply: FastifyReply) => {
      const { id } = request.params
      const { before, limit } = request.query

      const messages = await listMessages({
        conversaId: id,
        before: before ? new Date(before) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      })

      return reply.send(messages)
    }
  )

  // POST /conversations/:id/messages
  app.post<{ Params: ConversationParams; Body: SendMessageBody }>(
    '/conversations/:id/messages',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ConversationParams; Body: SendMessageBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { conteudo } = request.body
      const adminId = request.admin.sub

      if (!conteudo || conteudo.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Conteudo da mensagem e obrigatorio',
          statusCode: 400,
        })
      }

      // Get conversation and contact
      const conversation = await getConversationWithMessages(id)

      if (!conversation) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Conversa nao encontrada',
          statusCode: 404,
        })
      }

      // Send via WhatsApp
      const result = await sendWhatsAppMessage(conversation.contato.telefone, conteudo)

      // Save message
      const message = await saveOutgoingMessage({
        conversaId: id,
        conteudo,
        whatsappId: result.messageId,
        enviadoPor: adminId,
        tipo: 'manual',
      })

      // Log event
      if (result.success && result.messageId) {
        await logMessageSent(conversation.contato.id, result.messageId, 'manual')
      }

      return reply.status(201).send(message)
    }
  )
}
