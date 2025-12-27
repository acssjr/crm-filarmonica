import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import { config } from './config/index.js'
import { setupErrorHandler } from './plugins/error-handler.js'
import { setupLogger } from './plugins/logger.js'
import { webhookRoutes } from './modules/whatsapp/index.js'
import { authRoutes } from './modules/auth/index.js'
import { dashboardRoutes } from './modules/dashboard/index.js'
import { contactRoutes } from './modules/contacts/index.js'
import { conversationRoutes } from './modules/conversations/index.js'
import { prospectRoutes } from './modules/prospects/index.js'
import { tagRoutes } from './modules/tags/index.js'
import { templateRoutes } from './modules/templates/index.js'
import { campaignRoutes } from './modules/campaigns/index.js'
import { reportRoutes } from './modules/reports/index.js'
import { automationRoutes, initializeAutomationScheduler } from './modules/automations/index.js'

// Import workers to start them
import './workers/index.js'

// Validate configuration on startup
config.validate()

async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.server.logLevel,
      transport:
        config.env.isDevelopment
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
    origin: config.server.corsOrigin,
    credentials: true,
  })

  // Cookie secret is required in production (validated in config)
  const cookieSecret = config.security.cookieSecret ||
    (config.env.isDevelopment ? 'dev-cookie-secret-min-32-chars-long!' : undefined)

  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET is required in production')
  }

  await app.register(cookie, {
    secret: cookieSecret,
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
    // Root endpoint
    api.get('/', async () => {
      return {
        name: config.app.name,
        version: config.app.version,
        status: 'running',
      }
    })

    // Register all routes
    await api.register(webhookRoutes)
    await api.register(authRoutes)
    await api.register(dashboardRoutes)
    await api.register(contactRoutes)
    await api.register(conversationRoutes)
    await api.register(prospectRoutes)
    await api.register(tagRoutes)
    await api.register(templateRoutes)
    await api.register(campaignRoutes)
    await api.register(reportRoutes)
    await api.register(automationRoutes)
  }, { prefix: '/api' })

  return app
}

async function start() {
  const app = await buildApp()

  try {
    // Initialize automation scheduler
    initializeAutomationScheduler()

    await app.listen({ port: config.server.port, host: config.server.host })
    app.log.info(`${config.app.name} API v${config.app.version}`)
    app.log.info(`Server running on http://${config.server.host}:${config.server.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
