/**
 * E2E Test Setup
 * Configura banco de dados real (PGlite) e mocks de serviços externos
 *
 * Para testes de webhook: usa mocks de serviços internos
 * Para testes de processor: usa serviços reais com banco PGlite
 */

import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema.js'

// Database instance for E2E tests
export let pgliteClient: PGlite
export let testDb: ReturnType<typeof drizzle<typeof schema>>

// Initialize PGlite before mocking db
const initPGlite = async () => {
  pgliteClient = new PGlite()
  testDb = drizzle(pgliteClient, { schema })
  return testDb
}

// Create promise for async initialization
const dbPromise = initPGlite()

// Mock the db module to use PGlite - MUST be before other imports
vi.mock('../db/index.js', async () => {
  const db = await dbPromise
  return {
    db,
    schema,
    // Re-export schema types
    contatos: schema.contatos,
    conversas: schema.conversas,
    mensagens: schema.mensagens,
    interessados: schema.interessados,
  }
})

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

// Mock spam protection - allow all messages through for E2E tests
vi.mock('../lib/spam-protection.js', () => {
  const checkFn = vi.fn().mockImplementation(() =>
    Promise.resolve({ isSpam: false, count: 1, remainingWindow: 0 })
  )
  const resetFn = vi.fn().mockImplementation(() => Promise.resolve())

  return {
    spamProtection: {
      check: checkFn,
      reset: resetFn,
      getCount: vi.fn().mockImplementation(() => Promise.resolve(0)),
      block: vi.fn().mockImplementation(() => Promise.resolve()),
      isBlocked: vi.fn().mockImplementation(() => Promise.resolve(false)),
      unblock: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    checkSpamProtection: vi.fn().mockImplementation(() => Promise.resolve(false)),
    SpamProtectionService: vi.fn().mockImplementation(() => ({
      check: checkFn,
      reset: resetFn,
    })),
  }
})

// Mock event logging - we don't need to test event logs in E2E
vi.mock('../modules/events/event.service.js', () => ({
  logFirstContact: vi.fn().mockResolvedValue(undefined),
  logMessageReceived: vi.fn().mockResolvedValue(undefined),
  logMessageSent: vi.fn().mockResolvedValue(undefined),
  logIntentDetected: vi.fn().mockResolvedValue(undefined),
  logJourneyUpdated: vi.fn().mockResolvedValue(undefined),
}))

// SQL para criar schema completo (matches schema.ts)
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

  DO $$ BEGIN
    CREATE TYPE status_conversa AS ENUM ('ativa', 'encerrada');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE direcao_mensagem AS ENUM ('entrada', 'saida');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE tipo_mensagem AS ENUM ('texto', 'automatica', 'manual');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    CREATE TYPE status_envio AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'falhou');
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
    status status_conversa NOT NULL DEFAULT 'ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
  );

  -- Tabela de mensagens
  CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas(id),
    direcao direcao_mensagem NOT NULL,
    conteudo TEXT NOT NULL,
    tipo tipo_mensagem NOT NULL,
    enviado_por UUID,
    whatsapp_id VARCHAR(100),
    status_envio status_envio NOT NULL DEFAULT 'enviada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagem_whatsapp ON mensagens(whatsapp_id);

  -- Tabela de interessados
  CREATE TABLE IF NOT EXISTS interessados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contato_id UUID NOT NULL UNIQUE REFERENCES contatos(id),
    nome VARCHAR(200) NOT NULL,
    idade INTEGER NOT NULL DEFAULT 0,
    instrumento_desejado VARCHAR(100) NOT NULL,
    instrumento_sugerido VARCHAR(100),
    experiencia_musical TEXT,
    expectativas TEXT,
    disponibilidade_horario BOOLEAN NOT NULL DEFAULT false,
    compativel BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`

beforeAll(async () => {
  console.log('[E2E Setup] Initializing PGlite database...')
  // Wait for db to be initialized (already done by dbPromise)
  await dbPromise
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
