/**
 * E2E Test Setup
 * Configura banco de dados real (PGlite) e mocks de serviços externos
 */

import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema.js'

// Database instance for E2E tests
export let pgliteClient: PGlite
export let testDb: ReturnType<typeof drizzle<typeof schema>>

// Mock WhatsApp API - keep parseWebhookPayload real, mock sendWhatsAppMessage
vi.mock('../lib/whatsapp-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/whatsapp-client.js')>()
  return {
    ...original,
    sendWhatsAppMessage: vi.fn().mockResolvedValue({
      success: true,
      messageId: 'wamid.test123',
    }),
  }
})

// Mock BullMQ queue - just return job ID, we test the processor separately
vi.mock('../modules/whatsapp/message.queue.js', () => ({
  enqueueIncomingMessage: vi.fn().mockResolvedValue('test-job-id'),
  whatsappIncomingQueue: {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
  },
}))

// Mock spam protection
vi.mock('../lib/spam-protection.js', () => ({
  spamProtection: {
    check: vi.fn().mockResolvedValue({ isSpam: false, count: 1 }),
    reset: vi.fn(),
  },
}))

// Mock message deduplication
vi.mock('../modules/messages/message.service.js', () => ({
  isDuplicateMessage: vi.fn().mockResolvedValue(false),
  saveIncomingMessage: vi.fn().mockResolvedValue({ id: 'msg-in-1' }),
  saveOutgoingMessage: vi.fn().mockResolvedValue({ id: 'msg-out-1' }),
}))

// Mock event logging
vi.mock('../modules/events/event.service.js', () => ({
  logFirstContact: vi.fn().mockResolvedValue(undefined),
  logMessageReceived: vi.fn().mockResolvedValue(undefined),
  logMessageSent: vi.fn().mockResolvedValue(undefined),
  logIntentDetected: vi.fn().mockResolvedValue(undefined),
}))

// Mock journey service to return default responses
vi.mock('../modules/journey/journey.service.js', () => ({
  journeyService: {
    processMessage: vi.fn().mockResolvedValue(null), // Use intent matcher response
  },
}))

// SQL para criar schema completo
const createSchemaSQL = `
  -- Enums
  DO $$ BEGIN
    CREATE TYPE origem AS ENUM ('organico', 'campanha', 'indicacao');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE tipo_contato AS ENUM ('desconhecido', 'responsavel', 'interessado_direto');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE estado_jornada AS ENUM (
      'inicial', 'boas_vindas', 'coletando_nome', 'coletando_idade',
      'coletando_instrumento', 'verificando_saxofone', 'coletando_experiencia',
      'coletando_disponibilidade', 'incompativel', 'qualificado', 'atendimento_humano'
    );
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE canal AS ENUM ('whatsapp', 'instagram', 'messenger');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- Tabela de contatos
  CREATE TABLE IF NOT EXISTS contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(200),
    tipo tipo_contato NOT NULL DEFAULT 'desconhecido',
    origem origem NOT NULL DEFAULT 'organico',
    origem_campanha VARCHAR(50),
    canal canal NOT NULL DEFAULT 'whatsapp',
    estado_jornada estado_jornada NOT NULL DEFAULT 'inicial',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Tabela de conversas
  CREATE TABLE IF NOT EXISTS conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contato_id UUID NOT NULL REFERENCES contatos(id),
    canal canal NOT NULL DEFAULT 'whatsapp',
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Tabela de mensagens
  CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas(id),
    direcao VARCHAR(10) NOT NULL,
    conteudo TEXT NOT NULL,
    whatsapp_id VARCHAR(100),
    tipo VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Tabela de interessados
  CREATE TABLE IF NOT EXISTS interessados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contato_id UUID NOT NULL UNIQUE REFERENCES contatos(id),
    nome VARCHAR(200),
    idade INTEGER,
    instrumento_desejado VARCHAR(100),
    experiencia_musical TEXT,
    disponibilidade TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`

beforeAll(async () => {
  console.log('[E2E Setup] Initializing PGlite database...')
  pgliteClient = new PGlite()
  testDb = drizzle(pgliteClient, { schema })
  await pgliteClient.exec(createSchemaSQL)
  console.log('[E2E Setup] Database ready')
})

afterAll(async () => {
  console.log('[E2E Setup] Closing database...')
  await pgliteClient.close()
})

beforeEach(async () => {
  // Limpar tabelas antes de cada teste
  await pgliteClient.exec(`
    TRUNCATE TABLE mensagens CASCADE;
    TRUNCATE TABLE conversas CASCADE;
    TRUNCATE TABLE interessados CASCADE;
    TRUNCATE TABLE contatos CASCADE;
  `)
  vi.clearAllMocks()
})

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
