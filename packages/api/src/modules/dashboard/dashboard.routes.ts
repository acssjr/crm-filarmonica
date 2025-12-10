import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../auth/auth.middleware.js'
import { getDashboardStats } from './dashboard.service.js'

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  // GET /dashboard/stats
  app.get(
    '/dashboard/stats',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const stats = await getDashboardStats()
      return reply.send(stats)
    }
  )
}
