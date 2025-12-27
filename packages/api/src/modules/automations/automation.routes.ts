/**
 * Automation Routes
 * HTTP adapter for the automations module
 */

import { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../auth/auth.middleware.js'
import { automationService, alertService } from './index.js'

// Zod Schemas
const uuidSchema = z.string().uuid('ID deve ser um UUID válido')

const triggerTipoSchema = z.enum([
  'novo_contato',
  'tag_adicionada',
  'tag_removida',
  'jornada_mudou',
  'tempo_sem_interacao',
  'mensagem_recebida',
])

const conditionCampoSchema = z.enum([
  'tags',
  'estadoJornada',
  'origem',
  'idade',
  'instrumentoDesejado',
])

const conditionOperadorSchema = z.enum(['igual', 'diferente', 'contem', 'nao_contem'])

const actionTipoSchema = z.enum([
  'enviar_mensagem',
  'enviar_template',
  'adicionar_tag',
  'remover_tag',
  'mudar_jornada',
  'notificar_admin',
  'aguardar',
])

const createAutomationSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  triggerTipo: triggerTipoSchema,
  triggerConfig: z
    .object({
      tagId: z.string().uuid().optional(),
      estado: z.string().optional(),
      dias: z.number().int().min(1).optional(),
      palavraChave: z.string().optional(),
    })
    .optional(),
  condicoes: z
    .array(
      z.object({
        campo: conditionCampoSchema,
        operador: conditionOperadorSchema,
        valor: z.union([z.string(), z.array(z.string())]),
      })
    )
    .optional(),
  acoes: z
    .array(
      z.object({
        tipo: actionTipoSchema,
        config: z
          .object({
            mensagem: z.string().optional(),
            templateId: z.string().uuid().optional(),
            tagId: z.string().uuid().optional(),
            estado: z.string().optional(),
            adminPhone: z.string().optional(),
            dias: z.number().int().min(1).optional(),
          })
          .optional(),
      })
    )
    .min(1, 'Pelo menos uma ação é obrigatória'),
})

const updateAutomationSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  triggerTipo: triggerTipoSchema.optional(),
  triggerConfig: z
    .object({
      tagId: z.string().uuid().optional(),
      estado: z.string().optional(),
      dias: z.number().int().min(1).optional(),
      palavraChave: z.string().optional(),
    })
    .optional(),
  condicoes: z
    .array(
      z.object({
        campo: conditionCampoSchema,
        operador: conditionOperadorSchema,
        valor: z.union([z.string(), z.array(z.string())]),
      })
    )
    .optional(),
  acoes: z
    .array(
      z.object({
        tipo: actionTipoSchema,
        config: z
          .object({
            mensagem: z.string().optional(),
            templateId: z.string().uuid().optional(),
            tagId: z.string().uuid().optional(),
            estado: z.string().optional(),
            adminPhone: z.string().optional(),
            dias: z.number().int().min(1).optional(),
          })
          .optional(),
      })
    )
    .optional(),
})

type CreateAutomationBody = z.infer<typeof createAutomationSchema>
type UpdateAutomationBody = z.infer<typeof updateAutomationSchema>

interface IdParams {
  id: string
}

interface PaginationQuery {
  page?: string
  limit?: string
}

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

export async function automationRoutes(app: FastifyInstance): Promise<void> {
  // ==================== AUTOMATIONS CRUD ====================

  // GET /automacoes - List all automations
  app.get('/automacoes', { preHandler: [authMiddleware] }, async (_request, reply) => {
    const automations = await automationService.getAll()
    const result = automations.map(a => a.toPersistence())
    return reply.send(result)
  })

  // GET /automacoes/:id - Get automation by ID
  app.get<{ Params: IdParams }>(
    '/automacoes/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const automation = await automationService.getById(id)
      if (!automation) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Automação não encontrada',
          statusCode: 404,
        })
      }

      return reply.send(automation.toPersistence())
    }
  )

  // POST /automacoes - Create new automation
  app.post<{ Body: CreateAutomationBody }>(
    '/automacoes',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parseResult = createAutomationSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'Dados inválidos',
          statusCode: 400,
        })
      }

      const result = await automationService.execute(parseResult.data)

      if (result.error) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: result.error,
          statusCode: 400,
        })
      }

      return reply.status(201).send(result.automation!.toPersistence())
    }
  )

  // PATCH /automacoes/:id - Update automation
  app.patch<{ Params: IdParams; Body: UpdateAutomationBody }>(
    '/automacoes/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const parseResult = updateAutomationSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: parseResult.error.errors[0]?.message || 'Dados inválidos',
          statusCode: 400,
        })
      }

      const result = await automationService.update(id, parseResult.data)

      if (result.error) {
        const status = result.error.includes('não encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error,
          statusCode: status,
        })
      }

      return reply.send(result.automation!.toPersistence())
    }
  )

  // DELETE /automacoes/:id - Delete automation
  app.delete<{ Params: IdParams }>(
    '/automacoes/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await automationService.delete(id)

      if (!result.success) {
        const status = result.error?.includes('não encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error || 'Erro ao excluir',
          statusCode: status,
        })
      }

      return reply.status(204).send()
    }
  )

  // POST /automacoes/:id/ativar - Activate automation
  app.post<{ Params: IdParams }>(
    '/automacoes/:id/ativar',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await automationService.activate(id)

      if (!result.success) {
        const status = result.error?.includes('não encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error || 'Erro ao ativar',
          statusCode: status,
        })
      }

      return reply.send({ success: true })
    }
  )

  // POST /automacoes/:id/desativar - Deactivate automation
  app.post<{ Params: IdParams }>(
    '/automacoes/:id/desativar',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const result = await automationService.deactivate(id)

      if (!result.success) {
        const status = result.error?.includes('não encontrada') ? 404 : 400
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: result.error || 'Erro ao desativar',
          statusCode: status,
        })
      }

      return reply.send({ success: true })
    }
  )

  // GET /automacoes/:id/execucoes - Get automation executions
  app.get<{ Params: IdParams }>(
    '/automacoes/:id/execucoes',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      const automation = await automationService.getById(id)
      if (!automation) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Automação não encontrada',
          statusCode: 404,
        })
      }

      const executions = await automationService.getExecutions(id)
      return reply.send(executions)
    }
  )

  // ==================== ALERTS ====================

  // GET /alertas - List alerts with pagination
  app.get<{ Querystring: PaginationQuery }>(
    '/alertas',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10)
      const limit = parseInt(request.query.limit || '20', 10)

      const { data, total } = await alertService.getAlerts(page, limit)

      return reply.send({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }
  )

  // GET /alertas/count - Get unread alerts count
  app.get('/alertas/count', { preHandler: [authMiddleware] }, async (_request, reply) => {
    const count = await alertService.getUnreadAlertsCount()
    return reply.send({ count })
  })

  // PATCH /alertas/:id/lido - Mark alert as read
  app.patch<{ Params: IdParams }>(
    '/alertas/:id/lido',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      if (!validateUuid(id, reply)) return

      await alertService.markAlertAsRead(id)
      return reply.send({ success: true })
    }
  )
}
