import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken, JwtPayload } from '../../lib/jwt.js'

declare module 'fastify' {
  interface FastifyRequest {
    admin: JwtPayload
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from cookie
    const token = request.cookies.access_token

    if (!token) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token de acesso nao fornecido',
        statusCode: 401,
      })
    }

    // Verify token
    const payload = verifyToken(token)
    request.admin = payload
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de acesso invalido ou expirado',
      statusCode: 401,
    })
  }
}
