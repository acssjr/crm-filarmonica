import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import { setupErrorHandler } from './plugins/error-handler.js'
import { setupLogger } from './plugins/logger.js'

const PORT = parseInt(process.env.API_PORT || '3000', 10)
const HOST = process.env.API_HOST || '0.0.0.0'

async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  })

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-min-32-chars-long!',
    hook: 'onRequest',
  })

  await app.register(formbody)

  // Setup error handling and logging
  setupErrorHandler(app)
  setupLogger(app)

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // API routes prefix
  app.register(async (api) => {
    // Routes will be registered here
    api.get('/', async () => {
      return { message: 'CRM Filarmonica API v1.0.0' }
    })
  }, { prefix: '/api' })

  return app
}

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`Server running on http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
