import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { campaignService } from './campaign.service.js'
import type { CampaignFilters } from './campaign.repository.js'

interface IdParams {
  id: string
}

interface CreateCampaignBody {
  nome: string
  templateId: string
  filtros?: CampaignFilters
  agendadaPara?: string
  recorrencia?: 'nenhuma' | 'diario' | 'semanal' | 'mensal'
  recorrenciaFim?: string
}

interface UpdateCampaignBody {
  nome?: string
  templateId?: string
  filtros?: CampaignFilters
  agendadaPara?: string
  recorrencia?: 'nenhuma' | 'diario' | 'semanal' | 'mensal'
  recorrenciaFim?: string
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
      const body = request.body

      if (!body.nome || !body.templateId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Nome e templateId sao obrigatorios',
          statusCode: 400,
        })
      }

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
      const body = request.body

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

  // GET /campanhas/:id/destinatarios - Get campaign recipients
  app.get<{ Params: IdParams }>(
    '/campanhas/:id/destinatarios',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const campaign = await campaignService.getById(id)
      if (!campaign) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Campanha nao encontrada',
          statusCode: 404,
        })
      }

      const recipients = await campaignService.getRecipients(id)
      return reply.send(recipients)
    }
  )

  // POST /campanhas/:id/destinatarios - Add recipients
  app.post<{ Params: IdParams; Body: AddRecipientsBody }>(
    '/campanhas/:id/destinatarios',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: IdParams; Body: AddRecipientsBody }>, reply: FastifyReply) => {
      const { id } = request.params
      const { contatoIds, fromFilters } = request.body

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
      const { agendadaPara } = request.body

      if (!agendadaPara) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'agendadaPara e obrigatorio',
          statusCode: 400,
        })
      }

      const result = await campaignService.schedule(id, new Date(agendadaPara))

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
