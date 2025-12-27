import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { reportService, type PeriodPreset } from './report.service.js'

interface ReportQuery {
  inicio?: string
  fim?: string
  periodo?: PeriodPreset
}

interface ExportParams {
  tipo: 'contatos' | 'funil' | 'instrumentos'
}

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  // GET /relatorios/contatos - Contacts report
  app.get<{ Querystring: ReportQuery }>(
    '/relatorios/contatos',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ReportQuery }>, reply: FastifyReply) => {
      const { inicio, fim, periodo } = request.query
      const range = reportService.parseDateRange(inicio, fim, periodo)
      const report = await reportService.getContactsReport(range)
      return reply.send(report)
    }
  )

  // GET /relatorios/conversas - Conversations report
  app.get<{ Querystring: ReportQuery }>(
    '/relatorios/conversas',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ReportQuery }>, reply: FastifyReply) => {
      const { inicio, fim, periodo } = request.query
      const range = reportService.parseDateRange(inicio, fim, periodo)
      const report = await reportService.getConversationsReport(range)
      return reply.send(report)
    }
  )

  // GET /relatorios/funil - Funnel report
  app.get(
    '/relatorios/funil',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const report = await reportService.getFunnelReport()
      return reply.send(report)
    }
  )

  // GET /relatorios/campanhas - Campaigns report
  app.get<{ Querystring: ReportQuery }>(
    '/relatorios/campanhas',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ReportQuery }>, reply: FastifyReply) => {
      const { inicio, fim, periodo } = request.query
      const range = reportService.parseDateRange(inicio, fim, periodo)
      const report = await reportService.getCampaignsReport(range)
      return reply.send(report)
    }
  )

  // GET /relatorios/instrumentos - Instruments report
  app.get(
    '/relatorios/instrumentos',
    { preHandler: [authMiddleware] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const report = await reportService.getInstrumentsReport()
      return reply.send(report)
    }
  )

  // GET /relatorios/:tipo/export - Export report as CSV
  app.get<{ Params: ExportParams; Querystring: ReportQuery }>(
    '/relatorios/:tipo/export',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ExportParams; Querystring: ReportQuery }>, reply: FastifyReply) => {
      const { tipo } = request.params
      const { inicio, fim, periodo } = request.query

      let csv: string
      let filename: string

      switch (tipo) {
        case 'contatos': {
          const range = reportService.parseDateRange(inicio, fim, periodo)
          const report = await reportService.getContactsReport(range)
          csv = reportService.contactsReportToCsv(report)
          filename = `relatorio-contatos-${new Date().toISOString().split('T')[0]}.csv`
          break
        }
        case 'funil': {
          const report = await reportService.getFunnelReport()
          csv = reportService.funnelReportToCsv(report)
          filename = `relatorio-funil-${new Date().toISOString().split('T')[0]}.csv`
          break
        }
        case 'instrumentos': {
          const report = await reportService.getInstrumentsReport()
          csv = reportService.instrumentsReportToCsv(report)
          filename = `relatorio-instrumentos-${new Date().toISOString().split('T')[0]}.csv`
          break
        }
        default:
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Tipo de relatorio invalido. Use: contatos, funil ou instrumentos',
            statusCode: 400,
          })
      }

      reply.header('Content-Type', 'text/csv; charset=utf-8')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(csv)
    }
  )
}
