import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { templateService } from './template.service.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp-client.js'

interface IdParams {
  id: string
}

interface CreateCategoryBody {
  nome: string
}

interface CreateTemplateBody {
  nome: string
  conteudo: string
  categoriaId?: string
  tipo?: 'interno' | 'hsm'
  hsmNome?: string
}

interface UpdateTemplateBody {
  nome?: string
  conteudo?: string
  categoriaId?: string | null
  tipo?: 'interno' | 'hsm'
  hsmNome?: string
  hsmStatus?: 'pendente' | 'aprovado' | 'rejeitado'
}

interface PreviewBody {
  conteudo: string
}

interface TestBody {
  telefone: string
}

interface ListTemplatesQuery {
  categoriaId?: string
}

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  // ==================== CATEGORIES ====================

  // GET /template-categorias - List all categories
  app.get(
    '/template-categorias',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const categories = await templateService.getAllCategories()
      return reply.send(categories)
    }
  )

  // POST /template-categorias - Create category
  app.post<{ Body: CreateCategoryBody }>(
    '/template-categorias',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) => {
      const { nome } = request.body

      if (!nome) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Nome e obrigatorio',
          statusCode: 400,
        })
      }

      const result = await templateService.createCategory(nome)

      if (result.error) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send(result.category)
    }
  )

  // DELETE /template-categorias/:id - Delete category
  app.delete<{ Params: IdParams }>(
    '/template-categorias/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const result = await templateService.deleteCategory(id)

      if (!result.success) {
        const status = result.error?.includes('sistema') ? 400 : 404
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.status(204).send()
    }
  )

  // ==================== TEMPLATES ====================

  // GET /templates - List all templates
  app.get<{ Querystring: ListTemplatesQuery }>(
    '/templates',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ListTemplatesQuery }>, reply: FastifyReply) => {
      const { categoriaId } = request.query
      const templates = await templateService.getAll(categoriaId)
      return reply.send(templates)
    }
  )

  // GET /templates/variables - Get available variables
  app.get(
    '/templates/variables',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const variables = templateService.getVariables()
      return reply.send(variables)
    }
  )

  // GET /templates/:id - Get template by ID
  app.get<{ Params: IdParams }>(
    '/templates/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const template = await templateService.getById(id)

      if (!template) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Template nao encontrado',
          statusCode: 404,
        })
      }

      return reply.send(template)
    }
  )

  // POST /templates - Create template
  app.post<{ Body: CreateTemplateBody }>(
    '/templates',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: CreateTemplateBody }>, reply: FastifyReply) => {
      const body = request.body

      if (!body.nome || !body.conteudo) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Nome e conteudo sao obrigatorios',
          statusCode: 400,
        })
      }

      const result = await templateService.create(body)

      if (result.error) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send(result.template)
    }
  )

  // PATCH /templates/:id - Update template
  app.patch<{ Params: IdParams; Body: UpdateTemplateBody }>(
    '/templates/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: UpdateTemplateBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const body = request.body

      const result = await templateService.update(id, body)

      if (result.error) {
        const status = result.error.includes('nao encontrado') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.send(result.template)
    }
  )

  // DELETE /templates/:id - Delete template
  app.delete<{ Params: IdParams }>(
    '/templates/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const result = await templateService.delete(id)

      if (!result.success) {
        return reply.status(404).send({
          error: 'Not Found',
          message: result.error || 'Template nao encontrado',
          statusCode: 404,
        })
      }

      return reply.status(204).send()
    }
  )

  // POST /templates/:id/preview - Preview template with example data
  app.post<{ Params: IdParams }>(
    '/templates/:id/preview',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      const template = await templateService.getById(id)

      if (!template) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Template nao encontrado',
          statusCode: 404,
        })
      }

      const preview = templateService.preview(template.conteudo)
      return reply.send({ original: template.conteudo, preview })
    }
  )

  // POST /templates/preview - Preview arbitrary content
  app.post<{ Body: PreviewBody }>(
    '/templates/preview',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: PreviewBody }>, reply: FastifyReply) => {
      const { conteudo } = request.body

      if (!conteudo) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Conteudo e obrigatorio',
          statusCode: 400,
        })
      }

      const preview = templateService.preview(conteudo)
      return reply.send({ original: conteudo, preview })
    }
  )

  // POST /templates/:id/test - Send test message
  app.post<{ Params: IdParams; Body: TestBody }>(
    '/templates/:id/test',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: TestBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { telefone } = request.body

      if (!telefone) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Telefone e obrigatorio',
          statusCode: 400,
        })
      }

      const template = await templateService.getById(id)

      if (!template) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Template nao encontrado',
          statusCode: 404,
        })
      }

      // Use preview (example data) for test
      const message = templateService.preview(template.conteudo)

      try {
        // Normalize phone number
        let normalizedPhone = telefone.replace(/\D/g, '')
        if (!normalizedPhone.startsWith('55')) {
          normalizedPhone = '55' + normalizedPhone
        }

        await sendWhatsAppMessage(normalizedPhone, message)

        return reply.send({
          success: true,
          message: 'Mensagem de teste enviada',
          preview: message,
        })
      } catch (error) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Falha ao enviar mensagem de teste',
          statusCode: 500,
        })
      }
    }
  )
}
