import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { login, getAdminById } from './auth.service.js'
import { authMiddleware } from './auth.middleware.js'

interface LoginBody {
  email: string
  senha: string
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login
  app.post<{ Body: LoginBody }>(
    '/auth/login',
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { email, senha } = request.body

      if (!email || !senha) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Email e senha sao obrigatorios',
          statusCode: 400,
        })
      }

      const result = await login(email, senha)

      if (!result.success) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: result.error,
          statusCode: 401,
        })
      }

      // Set access token cookie
      reply.setCookie('access_token', result.tokens!.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
      })

      // Set refresh token cookie
      reply.setCookie('refresh_token', result.tokens!.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      return reply.send({
        admin: result.admin,
        expiresAt: result.tokens!.expiresAt.toISOString(),
      })
    }
  )

  // POST /auth/logout
  app.post(
    '/auth/logout',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.clearCookie('access_token', { path: '/' })
      reply.clearCookie('refresh_token', { path: '/api/auth' })
      return reply.status(204).send()
    }
  )

  // GET /auth/me
  app.get(
    '/auth/me',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await getAdminById(request.admin.sub)

      if (!admin) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Administrador nao encontrado',
          statusCode: 404,
        })
      }

      return reply.send(admin)
    }
  )
}
