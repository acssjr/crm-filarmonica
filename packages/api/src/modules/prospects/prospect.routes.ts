import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { listProspects, getProspectWithContact } from './prospect.repository.js'

interface ListProspectsQuery {
  compativel?: string
  instrumento?: string
}

interface ProspectParams {
  id: string
}

export async function prospectRoutes(app: FastifyInstance): Promise<void> {
  // GET /prospects
  app.get<{ Querystring: ListProspectsQuery }>(
    '/prospects',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Querystring: ListProspectsQuery }>, reply: FastifyReply) => {
      const { compativel, instrumento } = request.query

      const prospects = await listProspects({
        compativel: compativel !== undefined ? compativel === 'true' : undefined,
        instrumento,
      })

      return reply.send(prospects)
    }
  )

  // GET /prospects/:id
  app.get<{ Params: ProspectParams }>(
    '/prospects/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: ProspectParams }>, reply: FastifyReply) => {
      const { id } = request.params

      const prospect = await getProspectWithContact(id)

      if (!prospect) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Interessado nao encontrado',
          statusCode: 404,
        })
      }

      return reply.send(prospect)
    }
  )
}
