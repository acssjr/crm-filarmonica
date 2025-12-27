import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { tagService } from './tag.service.js'
import { findContactById } from '../contacts/contact.repository.js'

interface TagParams {
  id: string
}

interface ContactTagParams {
  id: string
  tagId: string
}

interface CreateTagBody {
  nome: string
  cor?: 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
}

interface UpdateTagBody {
  nome?: string
  cor?: 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
}

interface UpdateContactTagsBody {
  tagIds: string[]
}

export async function tagRoutes(app: FastifyInstance): Promise<void> {
  // ==================== TAG CRUD ====================

  // GET /tags - List all tags
  app.get(
    '/tags',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const tags = await tagService.getAll()
      return reply.send(tags)
    }
  )

  // GET /tags/stats - Get tag statistics
  app.get(
    '/tags/stats',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await tagService.getStatistics()
      return reply.send(stats)
    }
  )

  // GET /tags/:id - Get tag by ID
  app.get<{ Params: TagParams }>(
    '/tags/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const tag = await tagService.getById(id)

      if (!tag) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Tag nao encontrada',
          statusCode: 404,
        })
      }

      return reply.send(tag)
    }
  )

  // POST /tags - Create new tag
  app.post<{ Body: CreateTagBody }>(
    '/tags',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: CreateTagBody }>, reply: FastifyReply) => {
      const { nome, cor } = request.body

      if (!nome) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Nome e obrigatorio',
          statusCode: 400,
        })
      }

      const result = await tagService.create({ nome, cor })

      if (result.error) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send(result.tag)
    }
  )

  // PATCH /tags/:id - Update tag
  app.patch<{ Params: TagParams; Body: UpdateTagBody }>(
    '/tags/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: TagParams; Body: UpdateTagBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { nome, cor } = request.body

      const result = await tagService.update(id, { nome, cor })

      if (result.error) {
        const status = result.error.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.send(result.tag)
    }
  )

  // DELETE /tags/:id - Delete tag
  app.delete<{ Params: TagParams }>(
    '/tags/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const result = await tagService.delete(id)

      if (!result.success) {
        return reply.status(404).send({
          error: 'Not Found',
          message: result.error || 'Tag nao encontrada',
          statusCode: 404,
        })
      }

      return reply.status(204).send()
    }
  )

  // ==================== CONTACT TAGS ====================

  // GET /contacts/:id/tags - Get contact's tags
  app.get<{ Params: TagParams }>(
    '/contacts/:id/tags',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const contact = await findContactById(id)
      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      const tags = await tagService.getContactTags(id)
      return reply.send(tags)
    }
  )

  // PUT /contacts/:id/tags - Update contact's tags (replace all)
  app.put<{ Params: TagParams; Body: UpdateContactTagsBody }>(
    '/contacts/:id/tags',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: TagParams; Body: UpdateContactTagsBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { tagIds } = request.body

      const contact = await findContactById(id)
      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      if (!Array.isArray(tagIds)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'tagIds deve ser um array',
          statusCode: 400,
        })
      }

      const result = await tagService.updateContactTags(id, tagIds)

      if (!result.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      const tags = await tagService.getContactTags(id)
      return reply.send(tags)
    }
  )

  // POST /contacts/:id/tags/:tagId - Add tag to contact
  app.post<{ Params: ContactTagParams }>(
    '/contacts/:id/tags/:tagId',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ContactTagParams }>, reply: FastifyReply) => {
      const { id, tagId } = request.params

      const contact = await findContactById(id)
      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      const result = await tagService.addToContact(id, tagId)

      if (!result.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send({ success: true })
    }
  )

  // DELETE /contacts/:id/tags/:tagId - Remove tag from contact
  app.delete<{ Params: ContactTagParams }>(
    '/contacts/:id/tags/:tagId',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ContactTagParams }>, reply: FastifyReply) => {
      const { id, tagId } = request.params

      const contact = await findContactById(id)
      if (!contact) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Contato nao encontrado',
          statusCode: 404,
        })
      }

      await tagService.removeFromContact(id, tagId)
      return reply.status(204).send()
    }
  )
}
