/**
 * E2E Tests para Sistema de Automações
 *
 * Testa o fluxo completo de automações:
 * 1. Trigger é disparado (novo_contato, tag_adicionada, jornada_mudou, etc.)
 * 2. Condições são avaliadas
 * 3. Ações são executadas sequencialmente
 *
 * Cenários:
 * - Trigger novo_contato envia mensagem de boas-vindas
 * - Trigger tag_adicionada executa ação específica
 * - Trigger com condições que não são atendidas
 * - Múltiplas ações em sequência
 * - Rate limiting previne execução duplicada
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

// Create hoisted mock functions
const { mockSendWhatsApp } = vi.hoisted(() => ({
  mockSendWhatsApp: vi.fn(() => {
    const id = `wamid.out.${Date.now()}.${Math.random().toString(36).slice(2)}`
    return Promise.resolve({ success: true, messageId: id })
  }),
}))

// Mock WhatsApp API
vi.mock('../lib/whatsapp-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/whatsapp-client.js')>()
  return {
    ...original,
    sendWhatsAppMessage: mockSendWhatsApp,
  }
})

// Mock BullMQ queue (we'll test directly via use case)
vi.mock('./automation.scheduler.js', () => ({
  queueTriggerEvent: vi.fn().mockResolvedValue(undefined),
  queueResumeExecution: vi.fn().mockResolvedValue(undefined),
  getAutomationQueue: vi.fn(),
  startAutomationWorker: vi.fn(),
  schedulePeriodicCheck: vi.fn(),
  initializeAutomationScheduler: vi.fn(),
}))

import { testDb, pgliteClient } from './setup.js'
import { contatos, tags, contatoTags, automacoes, automacaoExecucoes, alertas } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { ExecuteAutomationUseCase } from '../modules/automations/application/execute-automation.usecase.js'
import { AutomationRepository } from '../modules/automations/adapters/automation.repository.js'
import { ContactAdapter } from '../modules/automations/adapters/contact.adapter.js'
import type { TriggerEvent } from '../modules/automations/domain/value-objects/trigger.vo.js'

// Simple adapters for E2E testing
const mockEventPublisher = {
  publish: vi.fn().mockResolvedValue(undefined),
}

const mockNotificationAdapter = {
  notifyAdminWhatsApp: vi.fn().mockResolvedValue({ success: true }),
  createPanelAlert: vi.fn().mockResolvedValue(undefined),
  findAlerts: vi.fn().mockResolvedValue({ alerts: [], total: 0 }),
  countUnread: vi.fn().mockResolvedValue(0),
  markAsRead: vi.fn().mockResolvedValue(undefined),
}

const mockTemplateAdapter = {
  findById: vi.fn().mockResolvedValue(null),
  renderForContact: vi.fn().mockImplementation((template: string) => Promise.resolve(template)),
}

const mockMessageSender = {
  sendMessage: vi.fn().mockResolvedValue({ success: true }),
}

// Additional SQL for automation tables
const createAutomationSchemaSQL = `
  -- Automation trigger types enum
  DO $$ BEGIN
    CREATE TYPE automacao_trigger_tipo AS ENUM (
      'novo_contato', 'tag_adicionada', 'tag_removida',
      'jornada_mudou', 'tempo_sem_interacao', 'mensagem_recebida'
    );
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- Automation execution status enum
  DO $$ BEGIN
    CREATE TYPE automacao_execucao_status AS ENUM (
      'executando', 'sucesso', 'falha', 'aguardando'
    );
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- Alert types enum
  DO $$ BEGIN
    CREATE TYPE alerta_tipo AS ENUM ('info', 'warning', 'success');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- Tags table (needed for tag actions)
  CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Contact tags junction table
  CREATE TABLE IF NOT EXISTS contato_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contato_id, tag_id)
  );

  -- Automacoes table
  CREATE TABLE IF NOT EXISTS automacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT false,
    trigger_tipo automacao_trigger_tipo NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}',
    condicoes JSONB NOT NULL DEFAULT '[]',
    acoes JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_automacoes_ativo ON automacoes(ativo);
  CREATE INDEX IF NOT EXISTS idx_automacoes_trigger ON automacoes(trigger_tipo);

  -- Automacao execucoes table
  CREATE TABLE IF NOT EXISTS automacao_execucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_id UUID NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,
    contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
    status automacao_execucao_status NOT NULL DEFAULT 'executando',
    acoes_executadas JSONB NOT NULL DEFAULT '[]',
    erro TEXT,
    proxima_acao_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Alertas table
  CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo alerta_tipo NOT NULL DEFAULT 'info',
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
    automacao_id UUID NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,
    lido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`

// Helper to create contact
async function createContact(telefone: string, nome?: string) {
  const [contact] = await testDb
    .insert(contatos)
    .values({
      telefone,
      nome: nome || 'Contato Teste',
      tipo: 'interessado_direto',
      origem: 'organico',
      estadoJornada: 'inicial',
    })
    .returning()
  return contact
}

// Helper to create tag
async function createTag(nome: string) {
  const [tag] = await testDb.insert(tags).values({ nome, cor: '#6366f1' }).returning()
  return tag
}

// Helper to create automation
async function createAutomation(data: {
  nome: string
  triggerTipo: string
  triggerConfig?: Record<string, unknown>
  condicoes?: Array<{ campo: string; operador: string; valor: string | string[] }>
  acoes: Array<{ tipo: string; config: Record<string, unknown> }>
  ativo?: boolean
}) {
  const [automation] = await testDb
    .insert(automacoes)
    .values({
      nome: data.nome,
      ativo: data.ativo ?? true,
      triggerTipo: data.triggerTipo as 'novo_contato' | 'tag_adicionada' | 'tag_removida' | 'jornada_mudou' | 'tempo_sem_interacao' | 'mensagem_recebida',
      triggerConfig: data.triggerConfig || {},
      condicoes: data.condicoes || [],
      acoes: data.acoes,
    })
    .returning()
  return automation
}

// Helper to get executions for automation
async function getExecutions(automacaoId: string) {
  return testDb
    .select()
    .from(automacaoExecucoes)
    .where(eq(automacaoExecucoes.automacaoId, automacaoId))
}

// Helper to get contact tags
async function getContactTags(contatoId: string) {
  const rows = await testDb
    .select({ tagId: contatoTags.tagId })
    .from(contatoTags)
    .where(eq(contatoTags.contatoId, contatoId))
  return rows.map(r => r.tagId)
}

describe('Automation E2E - Sistema de Automações', () => {
  let executeAutomationService: ExecuteAutomationUseCase
  let automationRepository: AutomationRepository
  let contactAdapter: ContactAdapter

  beforeAll(async () => {
    // Create automation schema
    await pgliteClient.exec(createAutomationSchemaSQL)

    // Initialize services with test database
    automationRepository = new AutomationRepository()
    contactAdapter = new ContactAdapter()

    executeAutomationService = new ExecuteAutomationUseCase({
      repository: automationRepository,
      messageSender: mockMessageSender,
      notification: mockNotificationAdapter,
      contact: contactAdapter,
      template: mockTemplateAdapter,
      eventPublisher: mockEventPublisher,
    })
  })

  beforeEach(async () => {
    // Clean tables in correct order (respecting FK constraints)
    await pgliteClient.exec(`
      TRUNCATE TABLE alertas CASCADE;
      TRUNCATE TABLE automacao_execucoes CASCADE;
      TRUNCATE TABLE automacoes CASCADE;
      TRUNCATE TABLE contato_tags CASCADE;
      TRUNCATE TABLE tags CASCADE;
      TRUNCATE TABLE mensagens CASCADE;
      TRUNCATE TABLE conversas CASCADE;
      TRUNCATE TABLE interessados CASCADE;
      TRUNCATE TABLE contatos CASCADE;
    `)
    vi.clearAllMocks()

    // Reset mock implementations (vitest restoreMocks: true clears them)
    mockMessageSender.sendMessage.mockResolvedValue({ success: true })
    mockEventPublisher.publish.mockResolvedValue(undefined)
    mockNotificationAdapter.notifyAdminWhatsApp.mockResolvedValue({ success: true })
    mockNotificationAdapter.createPanelAlert.mockResolvedValue(undefined)
    mockTemplateAdapter.renderForContact.mockImplementation((template: string) => Promise.resolve(template))
  })

  describe('Trigger: novo_contato', () => {
    it('deve executar automação quando novo contato é criado', async () => {
      // Create automation that sends welcome message on new contact
      const automation = await createAutomation({
        nome: 'Boas-vindas automático',
        triggerTipo: 'novo_contato',
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Bem-vindo! Como podemos ajudar?' },
          },
        ],
      })

      // Create contact
      const contact = await createContact('+5575999888777', 'João Silva')

      // Trigger automation
      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify execution was created
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')

      // Verify message was sent
      expect(mockMessageSender.sendMessage).toHaveBeenCalledWith(
        '+5575999888777',
        'Bem-vindo! Como podemos ajudar?'
      )
    })

    it('não deve executar automação inativa', async () => {
      // Create inactive automation
      await createAutomation({
        nome: 'Automação inativa',
        triggerTipo: 'novo_contato',
        ativo: false,
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Mensagem teste' },
          },
        ],
      })

      const contact = await createContact('+5575999666555')

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify no message was sent
      expect(mockMessageSender.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Trigger: tag_adicionada', () => {
    it('deve executar quando tag específica é adicionada', async () => {
      const tag = await createTag('vip')
      const contact = await createContact('+5575999555444')

      // Create automation that triggers on specific tag
      const automation = await createAutomation({
        nome: 'Tag VIP adicionada',
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: tag.id },
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Você agora é um cliente VIP!' },
          },
        ],
      })

      // Add tag to contact (simulating the trigger)
      await testDb.insert(contatoTags).values({ contatoId: contact.id, tagId: tag.id })

      // Trigger automation
      const event: TriggerEvent = {
        tipo: 'tag_adicionada',
        contatoId: contact.id,
        data: { tagId: tag.id },
      }

      await executeAutomationService.handleTrigger(event)

      // Verify execution
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')
    })

    it('não deve executar quando tag diferente é adicionada', async () => {
      const tagVip = await createTag('vip')
      const tagNormal = await createTag('normal')
      const contact = await createContact('+5575999333222')

      // Automation triggers only on VIP tag
      await createAutomation({
        nome: 'Tag VIP adicionada',
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: tagVip.id },
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Você é VIP!' },
          },
        ],
      })

      // Trigger with different tag
      const event: TriggerEvent = {
        tipo: 'tag_adicionada',
        contatoId: contact.id,
        data: { tagId: tagNormal.id },
      }

      await executeAutomationService.handleTrigger(event)

      // Verify no message was sent
      expect(mockMessageSender.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Trigger: jornada_mudou', () => {
    it('deve executar quando estado de jornada muda para estado específico', async () => {
      const contact = await createContact('+5575999222111')

      // Create automation that triggers when contact becomes qualified
      const automation = await createAutomation({
        nome: 'Qualificado - notificar admin',
        triggerTipo: 'jornada_mudou',
        triggerConfig: { estado: 'qualificado' },
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Parabéns! Você foi qualificado para as aulas.' },
          },
        ],
      })

      // Trigger automation
      const event: TriggerEvent = {
        tipo: 'jornada_mudou',
        contatoId: contact.id,
        data: { estado: 'qualificado' },
      }

      await executeAutomationService.handleTrigger(event)

      // Verify execution
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')
    })
  })

  describe('Condições', () => {
    it('deve executar apenas quando todas as condições são atendidas', async () => {
      const tag = await createTag('interessado')
      const contact = await createContact('+5575999111000')

      // Add tag to contact
      await testDb.insert(contatoTags).values({ contatoId: contact.id, tagId: tag.id })

      // Create automation with condition (contact must have 'interessado' tag)
      const automation = await createAutomation({
        nome: 'Mensagem para interessados',
        triggerTipo: 'novo_contato',
        condicoes: [
          { campo: 'tags', operador: 'contem', valor: tag.id },
        ],
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Obrigado pelo interesse!' },
          },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify execution
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
    })

    it('não deve executar quando condição não é atendida', async () => {
      const tag = await createTag('vip')
      const contact = await createContact('+5575988877766')
      // Contact does NOT have the VIP tag

      // Automation requires VIP tag
      await createAutomation({
        nome: 'Apenas VIPs',
        triggerTipo: 'novo_contato',
        condicoes: [
          { campo: 'tags', operador: 'contem', valor: tag.id },
        ],
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Oferta exclusiva VIP!' },
          },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify no message was sent
      expect(mockMessageSender.sendMessage).not.toHaveBeenCalled()
    })

    it('deve avaliar condição de estado de jornada', async () => {
      const contact = await createContact('+5575977766655')
      // Update contact to 'coletando_nome' state
      await testDb
        .update(contatos)
        .set({ estadoJornada: 'coletando_nome' })
        .where(eq(contatos.id, contact.id))

      const automation = await createAutomation({
        nome: 'Lembrete de nome',
        triggerTipo: 'mensagem_recebida',
        condicoes: [
          { campo: 'estadoJornada', operador: 'igual', valor: 'coletando_nome' },
        ],
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Por favor, nos informe seu nome!' },
          },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'mensagem_recebida',
        contatoId: contact.id,
        data: { mensagem: 'oi' },
      }

      await executeAutomationService.handleTrigger(event)

      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')
    })
  })

  describe('Ações Múltiplas', () => {
    it('deve executar múltiplas ações em sequência', async () => {
      const tag = await createTag('processado')
      const contact = await createContact('+5575966655544')

      const automation = await createAutomation({
        nome: 'Fluxo completo',
        triggerTipo: 'novo_contato',
        acoes: [
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Mensagem 1' },
          },
          {
            tipo: 'adicionar_tag',
            config: { tagId: tag.id },
          },
          {
            tipo: 'enviar_mensagem',
            config: { mensagem: 'Mensagem 2' },
          },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify all actions executed
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')
      expect(executions[0].acoesExecutadas).toHaveLength(3)

      // Verify messages sent
      expect(mockMessageSender.sendMessage).toHaveBeenCalledTimes(2)
      expect(mockMessageSender.sendMessage).toHaveBeenNthCalledWith(1, '+5575966655544', 'Mensagem 1')
      expect(mockMessageSender.sendMessage).toHaveBeenNthCalledWith(2, '+5575966655544', 'Mensagem 2')

      // Verify tag was added
      const contactTags = await getContactTags(contact.id)
      expect(contactTags).toContain(tag.id)
    })

    it('deve parar execução quando ação falha', async () => {
      const contact = await createContact('+5575955544433')

      // Make second message fail consistently (all retries fail)
      mockMessageSender.sendMessage
        .mockResolvedValueOnce({ success: true })  // First action succeeds
        .mockResolvedValue({ success: false, error: 'WhatsApp error' })  // All subsequent calls fail

      const automation = await createAutomation({
        nome: 'Fluxo com falha',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'OK' } },
          { tipo: 'enviar_mensagem', config: { mensagem: 'FALHA' } },
          { tipo: 'enviar_mensagem', config: { mensagem: 'NUNCA' } },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify execution failed
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('falha')
      // Due to retry logic (3 attempts), sendMessage is called 4 times total
      // (1 success + 3 failed retries)
      expect(mockMessageSender.sendMessage).toHaveBeenCalledTimes(4)
    })
  })

  describe('Ação: mudar_jornada', () => {
    it('deve alterar estado da jornada do contato', async () => {
      const contact = await createContact('+5575944433322')

      const automation = await createAutomation({
        nome: 'Marcar como qualificado',
        triggerTipo: 'novo_contato',
        acoes: [
          {
            tipo: 'mudar_jornada',
            config: { estado: 'qualificado' },
          },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      await executeAutomationService.handleTrigger(event)

      // Verify contact journey state was updated
      const [updatedContact] = await testDb
        .select()
        .from(contatos)
        .where(eq(contatos.id, contact.id))

      expect(updatedContact.estadoJornada).toBe('qualificado')
    })
  })

  describe('Ação: adicionar_tag / remover_tag', () => {
    it('deve adicionar tag ao contato', async () => {
      const tag = await createTag('novo')
      const contact = await createContact('+5575933322211')

      const automation = await createAutomation({
        nome: 'Adicionar tag novo',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'adicionar_tag', config: { tagId: tag.id } },
        ],
      })

      await executeAutomationService.handleTrigger({
        tipo: 'novo_contato',
        contatoId: contact.id,
      })

      const contactTags = await getContactTags(contact.id)
      expect(contactTags).toContain(tag.id)
    })

    it('deve remover tag do contato', async () => {
      const tag = await createTag('temporaria')
      const contact = await createContact('+5575922211100')

      // Add tag first
      await testDb.insert(contatoTags).values({ contatoId: contact.id, tagId: tag.id })

      const automation = await createAutomation({
        nome: 'Remover tag',
        triggerTipo: 'jornada_mudou',
        triggerConfig: { estado: 'qualificado' },
        acoes: [
          { tipo: 'remover_tag', config: { tagId: tag.id } },
        ],
      })

      await executeAutomationService.handleTrigger({
        tipo: 'jornada_mudou',
        contatoId: contact.id,
        data: { estado: 'qualificado' },
      })

      const contactTags = await getContactTags(contact.id)
      expect(contactTags).not.toContain(tag.id)
    })
  })

  describe('Rate Limiting', () => {
    it('não deve executar mesma automação duas vezes no período de rate limit', async () => {
      const contact = await createContact('+5575911100099')

      const automation = await createAutomation({
        nome: 'Rate limited',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Olá!' } },
        ],
      })

      const event: TriggerEvent = {
        tipo: 'novo_contato',
        contatoId: contact.id,
      }

      // First execution
      await executeAutomationService.handleTrigger(event)

      // Reset mock to track second call
      mockMessageSender.sendMessage.mockClear()

      // Second execution (should be rate limited)
      await executeAutomationService.handleTrigger(event)

      // Verify message was NOT sent second time
      expect(mockMessageSender.sendMessage).not.toHaveBeenCalled()

      // Verify only one execution record
      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
    })
  })

  describe('Múltiplas Automações', () => {
    it('deve executar todas as automações que correspondem ao trigger', async () => {
      const contact = await createContact('+5575900099988')

      // Create two automations for same trigger
      const automation1 = await createAutomation({
        nome: 'Automação 1',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Mensagem da automação 1' } },
        ],
      })

      const automation2 = await createAutomation({
        nome: 'Automação 2',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Mensagem da automação 2' } },
        ],
      })

      await executeAutomationService.handleTrigger({
        tipo: 'novo_contato',
        contatoId: contact.id,
      })

      // Verify both automations executed
      const exec1 = await getExecutions(automation1.id)
      const exec2 = await getExecutions(automation2.id)

      expect(exec1.length).toBe(1)
      expect(exec2.length).toBe(1)
      expect(mockMessageSender.sendMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe('Trigger: mensagem_recebida', () => {
    it('deve executar quando mensagem contém palavra-chave', async () => {
      const contact = await createContact('+5575899988877')

      const automation = await createAutomation({
        nome: 'Resposta automática FAQ',
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'funcionamento' },
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Nosso horario e das 8h as 18h.' } },
        ],
      })

      await executeAutomationService.handleTrigger({
        tipo: 'mensagem_recebida',
        contatoId: contact.id,
        data: { mensagem: 'Qual o horario de funcionamento?' },
      })

      const executions = await getExecutions(automation.id)
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('sucesso')
    })

    it('não deve executar quando mensagem não contém palavra-chave', async () => {
      const contact = await createContact('+5575888877766')

      await createAutomation({
        nome: 'Resposta FAQ',
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'preco' },
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Os precos sao...' } },
        ],
      })

      await executeAutomationService.handleTrigger({
        tipo: 'mensagem_recebida',
        contatoId: contact.id,
        data: { mensagem: 'Ola, bom dia!' },
      })

      expect(mockMessageSender.sendMessage).not.toHaveBeenCalled()
    })
  })
})
