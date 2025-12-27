import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { getContacts, updateContactDetails } from './contact.service.js'
import { findContactById } from './contact.repository.js'
import { listConversationsByContact } from '../conversations/conversation.repository.js'
import { findInteressadoByContactId } from '../prospects/prospect.repository.js'

interface ListContactsQuery {
  page?: string
  limit?: string
  search?: string
  origem?: string
  estadoJornada?: string
}

interface ContactParams {
  id: string
}

interface UpdateContactBody {
  nome?: string
  tipo?: 'desconhecido' | 'responsavel' | 'interessado_direto'
  estadoJornada?: string
}

export async function contactRoutes(app: FastifyInstance): Promise<void> {
  // GET /contacts
  app.get<{ Querystring: ListContactsQuery }>(
    '/contacts',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ListContactsQuery }>, reply: FastifyReply) => {
      const { page, limit, search, origem, estadoJornada } = request.query

      const result = await getContacts({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        origem,
        estadoJornada,
      })

      // Flatten pagination for frontend
      return reply.send({
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      })
    }
  )

  // GET /contacts/:id
  app.get<{ Params: ContactParams }>(
    '/contacts/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ContactParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const contact = await findContactById(id)

      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      // Get related data
      const [interessado, conversas] = await Promise.all([
        findInteressadoByContactId(id),
        listConversationsByContact(id),
      ])

      return reply.send({
        contato: {
          ...contact,
          interessado,
          ultimaConversa: conversas[0] || null,
        }
      })
    }
  )

  // PATCH /contacts/:id
  app.patch<{ Params: ContactParams; Body: UpdateContactBody }>(
    '/contacts/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ContactParams; Body: UpdateContactBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { nome, tipo, estadoJornada } = request.body

      const updated = await updateContactDetails(id, {
        nome,
        tipo,
        estadoJornada: estadoJornada as any,
      })

      if (!updated) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      return reply.send(updated)
    }
  )

  // GET /contacts/:id/conversations
  app.get<{ Params: ContactParams }>(
    '/contacts/:id/conversations',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ContactParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const contact = await findContactById(id)

      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      const conversas = await listConversationsByContact(id)
      return reply.send(conversas)
    }
  )
}
