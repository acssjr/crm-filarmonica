import { FastifyInstance } from 'fastify'

export function setupLogger(app: FastifyInstance): void {
  // Add request ID to all requests
  app.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
    }, 'incoming request')
  })

  // Log response
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'request completed')
  })
}
