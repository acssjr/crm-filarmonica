import 'dotenv/config'

/**
 * Centralized configuration for the CRM API
 * All hardcoded values and environment variables should be accessed through this module
 */

// Environment
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

// Server configuration
export const server = {
  port: parseInt(process.env.API_PORT || '3000', 10),
  host: process.env.API_HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || true,
  logLevel: process.env.LOG_LEVEL || 'info',
} as const

// Security configuration
export const security = {
  cookieSecret: process.env.COOKIE_SECRET,
  jwtSecret: process.env.JWT_SECRET || 'jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
} as const

// Database configuration
export const database = {
  url: process.env.DATABASE_URL,
} as const

// Redis configuration
export const redis = {
  url: process.env.REDIS_URL,
} as const

// WhatsApp API configuration
export const whatsapp = {
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}`,
  phoneId: process.env.WHATSAPP_PHONE_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
} as const

// Instagram API configuration (prepared for future)
export const instagram = {
  apiVersion: process.env.INSTAGRAM_API_VERSION || 'v21.0',
  apiUrl: `https://graph.facebook.com/${process.env.INSTAGRAM_API_VERSION || 'v21.0'}`,
  pageId: process.env.INSTAGRAM_PAGE_ID,
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
} as const

// Messenger API configuration (prepared for future)
export const messenger = {
  apiVersion: process.env.MESSENGER_API_VERSION || 'v21.0',
  apiUrl: `https://graph.facebook.com/${process.env.MESSENGER_API_VERSION || 'v21.0'}`,
  pageId: process.env.MESSENGER_PAGE_ID,
  accessToken: process.env.MESSENGER_ACCESS_TOKEN,
  verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
} as const

// Spam protection configuration
export const spamProtection = {
  threshold: parseInt(process.env.SPAM_THRESHOLD || '3', 10),
  windowMs: parseInt(process.env.SPAM_WINDOW_MS || '60000', 10), // 1 minute
  enabled: process.env.SPAM_PROTECTION_ENABLED !== 'false',
} as const

// Application metadata
export const app = {
  name: 'CRM Filarmonica',
  version: process.env.npm_package_version || '1.0.0',
} as const

// Validate required configuration
export function validateConfig(): void {
  const errors: string[] = []

  if (!database.url) {
    errors.push('DATABASE_URL is required')
  }

  if (env.isProduction) {
    if (!security.cookieSecret) {
      errors.push('COOKIE_SECRET is required in production')
    }
    if (security.cookieSecret && security.cookieSecret.length < 32) {
      errors.push('COOKIE_SECRET must be at least 32 characters')
    }
    if (!whatsapp.phoneId || !whatsapp.accessToken) {
      console.warn('WhatsApp credentials not configured - messaging will be disabled')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }
}

// Export all config
export const config = {
  env,
  server,
  security,
  database,
  redis,
  whatsapp,
  instagram,
  messenger,
  spamProtection,
  app,
  validate: validateConfig,
} as const

export default config
