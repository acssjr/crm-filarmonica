import { FastifyInstance, FastifyError } from 'fastify'

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500

    request.log.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
      },
    })

    // Don't expose internal errors to client
    if (statusCode >= 500) {
      return reply.status(statusCode).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro interno no servidor',
        statusCode,
      })
    }

    return reply.status(statusCode).send({
      error: error.name || 'Error',
      message: error.message,
      statusCode,
    })
  })
}
