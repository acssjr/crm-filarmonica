import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../auth/auth.middleware.js'
import { campaignService } from './campaign.service.js'
import type { CampaignFilters } from './campaign.repository.js'

// Zod Schemas
const uuidSchema = z.string().uuid('ID deve ser um UUID válido')

const campaignFiltersSchema = z.object({
  origem: z.array(z.string()).optional(),
  estadoJornada: z.array(z.string()).optional(),
  tags: z.array(uuidSchema).optional(),
  instrumento: z.array(z.string()).optional(),
  canal: z.array(z.string()).optional(),
}).optional()

const createCampaignSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  templateId: uuidSchema,
  filtros: campaignFiltersSchema,
  agendadaPara: z.string().datetime().optional(),
  recorrencia: z.enum(['nenhuma', 'diario', 'semanal', 'mensal']).optional(),
  recorrenciaFim: z.string().datetime().optional(),
})

const updateCampaignSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  templateId: uuidSchema.optional(),
  filtros: campaignFiltersSchema,
  agendadaPara: z.string().datetime().optional(),
  recorrencia: z.enum(['nenhuma', 'diario', 'semanal', 'mensal']).optional(),
  recorrenciaFim: z.string().datetime().optional(),
})

const scheduleSchema = z.object({
  agendadaPara: z.string().datetime('Data de agendamento inválida'),
})

const addRecipientsSchema = z.object({
  contatoIds: z.array(uuidSchema).optional(),
  fromFilters: z.boolean().optional(),
})

// Helper para validar UUID
function validateUuid(id: string, reply: FastifyReply): boolean {
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    reply.status(400).send({
      error: 'Bad Request',
      message: 'ID inválido',
      statusCode: 400,
    })
    return false
  }
  return true
}

// Type inference
type CreateCampaignBody = z.infer<typeof createCampaignSchema>
type UpdateCampaignBody = z.infer<typeof updateCampaignSchema>

interface IdParams {
  id: string
}

interface RecipientsQuery {
  page?: string
  limit?: string
}

interface PreviewRecipientsBody {
  filtros: CampaignFilters
}

interface AddRecipientsBody {
  contatoIds?: string[]
  fromFilters?: boolean
}

interface ScheduleBody {
  agendadaPara: string
}

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  // ==================== CAMPAIGNS CRUD ====================

  // GET /campanhas - List all campaigns
  app.get(
    '/campanhas',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const campaigns = await campaignService.getAll()
      return reply.send(campaigns)
    }
  )

  // GET /campanhas/:id - Get campaign with details
  app.get<{ Params: IdParams }>(
    '/campanhas/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await campaignService.getWithDetails(id)

      if (!result) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Campanha nao encontrada',
          statusCode: 404,
        })
      }

      return reply.send(result)
    }
  )

  // POST /campanhas - Create campaign
  app.post<{ Body: CreateCampaignBody }>(
    '/campanhas',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: CreateCampaignBody }>, reply: FastifyReply) => {
      const parseResult = createCampaignSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'Dados inválidos',
          statusCode: 400,
        })
      }

      const body = parseResult.data
      const result = await campaignService.create({
        nome: body.nome,
        templateId: body.templateId,
        filtros: body.filtros,
        agendadaPara: body.agendadaPara ? new Date(body.agendadaPara) : undefined,
        recorrencia: body.recorrencia,
        recorrenciaFim: body.recorrenciaFim ? new Date(body.recorrenciaFim) : undefined,
      })

      if (result.error) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send(result.campanha)
    }
  )

  // PATCH /campanhas/:id - Update campaign
  app.patch<{ Params: IdParams; Body: UpdateCampaignBody }>(
    '/campanhas/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: UpdateCampaignBody }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const parseResult = updateCampaignSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'Dados inválidos',
          statusCode: 400,
        })
      }

      const body = parseResult.data
      const result = await campaignService.update(id, {
        nome: body.nome,
        templateId: body.templateId,
        filtros: body.filtros,
        agendadaPara: body.agendadaPara ? new Date(body.agendadaPara) : undefined,
        recorrencia: body.recorrencia,
        recorrenciaFim: body.recorrenciaFim ? new Date(body.recorrenciaFim) : undefined,
      })

      if (result.error) {
        const status = result.error.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.send(result.campanha)
    }
  )

  // DELETE /campanhas/:id - Delete campaign
  app.delete<{ Params: IdParams }>(
    '/campanhas/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await campaignService.delete(id)

      if (!result.success) {
        const status = result.error?.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.status(204).send()
    }
  )

  // ==================== RECIPIENTS ====================

  // POST /campanhas/preview-recipients - Preview recipients from filters
  app.post<{ Body: PreviewRecipientsBody }>(
    '/campanhas/preview-recipients',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: PreviewRecipientsBody }>, reply: FastifyReply) => {
      const { filtros } = request.body

      if (!filtros) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Filtros sao obrigatorios',
          statusCode: 400,
        })
      }

      const contacts = await campaignService.previewRecipients(filtros)
      return reply.send({
        total: contacts.length,
        contacts: contacts.slice(0, 50), // Limit preview to 50
      })
    }
  )

  // GET /campanhas/:id/destinatarios - Get campaign recipients (paginated)
  app.get<{ Params: IdParams; Querystring: RecipientsQuery }>(
    '/campanhas/:id/destinatarios',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Querystring: RecipientsQuery }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const page = Math.max(1, parseInt(request.query.page || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50', 10)))

      const campaign = await campaignService.getById(id)
      if (!campaign) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Campanha nao encontrada',
          statusCode: 404,
        })
      }

      const result = await campaignService.getRecipientsPaginated(id, page, limit)
      return reply.send(result)
    }
  )

  // POST /campanhas/:id/destinatarios - Add recipients
  app.post<{ Params: IdParams; Body: AddRecipientsBody }>(
    '/campanhas/:id/destinatarios',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: AddRecipientsBody }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const parseResult = addRecipientsSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'Dados inválidos',
          statusCode: 400,
        })
      }

      const { contatoIds, fromFilters } = parseResult.data

      let result: { count: number; error?: string }

      if (fromFilters) {
        result = await campaignService.addRecipientsFromFilters(id)
      } else if (contatoIds && contatoIds.length > 0) {
        result = await campaignService.addManualRecipients(id, contatoIds)
      } else {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Informe contatoIds ou fromFilters: true',
          statusCode: 400,
        })
      }

      if (result.error) {
        const status = result.error.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.send({ added: result.count })
    }
  )

  // ==================== SCHEDULING ====================

  // POST /campanhas/:id/agendar - Schedule campaign
  app.post<{ Params: IdParams; Body: ScheduleBody }>(
    '/campanhas/:id/agendar',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: ScheduleBody }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const parseResult = scheduleSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'agendadaPara é obrigatório',
          statusCode: 400,
        })
      }

      const result = await campaignService.schedule(id, new Date(parseResult.data.agendadaPara))

      if (!result.success) {
        const status = result.error?.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      const campaign = await campaignService.getById(id)
      return reply.send(campaign)
    }
  )

  // POST /campanhas/:id/cancelar - Cancel campaign
  app.post<{ Params: IdParams }>(
    '/campanhas/:id/cancelar',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await campaignService.cancel(id)

      if (!result.success) {
        const status = result.error?.includes('nao encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      const campaign = await campaignService.getById(id)
      return reply.send(campaign)
    }
  )
}
