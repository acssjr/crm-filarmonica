/**
 * Test Factories
 * Generate consistent test data for unit tests
 */
import { v4 as uuidv4 } from 'uuid'
import type { TriggerTipo } from '../modules/automations/domain/value-objects/trigger.vo.js'
import type { ActionTipo } from '../modules/automations/domain/value-objects/action.vo.js'
import type { ConditionCampo, ConditionOperador } from '../modules/automations/domain/value-objects/condition.vo.js'

// ==================== Automation Factories ====================

export interface CreateAutomationInputFactory {
  nome?: string
  triggerTipo?: TriggerTipo
  triggerConfig?: Record<string, unknown>
  condicoes?: Array<{
    campo: ConditionCampo
    operador: ConditionOperador
    valor: string | string[]
  }>
  acoes?: Array<{
    tipo: ActionTipo
    config?: Record<string, unknown>
  }>
}

export function createAutomationInput(overrides: CreateAutomationInputFactory = {}) {
  return {
    nome: overrides.nome ?? `Test Automation ${Date.now()}`,
    triggerTipo: overrides.triggerTipo ?? 'novo_contato' as TriggerTipo,
    triggerConfig: overrides.triggerConfig ?? {},
    condicoes: overrides.condicoes ?? [],
    acoes: overrides.acoes ?? [
      { tipo: 'enviar_mensagem' as ActionTipo, config: { mensagem: 'Hello!' } },
    ],
  }
}

export function createAutomationPersistence(overrides: Partial<{
  id: string
  nome: string
  ativo: boolean
  triggerTipo: TriggerTipo
  triggerConfig: Record<string, unknown>
  condicoes: unknown[]
  acoes: unknown[]
  createdAt: Date
  updatedAt: Date
}> = {}) {
  const now = new Date()
  return {
    id: overrides.id ?? uuidv4(),
    nome: overrides.nome ?? 'Test Automation',
    ativo: overrides.ativo ?? false,
    triggerTipo: overrides.triggerTipo ?? 'novo_contato' as TriggerTipo,
    triggerConfig: overrides.triggerConfig ?? {},
    condicoes: overrides.condicoes ?? [],
    acoes: overrides.acoes ?? [{ tipo: 'enviar_mensagem', config: { mensagem: 'Hi' } }],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}

// ==================== Contact Factories ====================

export function createContactData(overrides: Partial<{
  id: string
  telefone: string
  nome: string
  estadoJornada: string
  origem: string
  tags: string[]
  idade: number
  instrumentoDesejado: string
}> = {}) {
  return {
    id: overrides.id ?? uuidv4(),
    telefone: overrides.telefone ?? '+5575988123456',
    nome: overrides.nome ?? 'João Silva',
    estadoJornada: overrides.estadoJornada ?? 'inicial',
    origem: overrides.origem ?? 'organico',
    tags: overrides.tags ?? [],
    idade: overrides.idade,
    instrumentoDesejado: overrides.instrumentoDesejado,
  }
}

// ==================== Execution Factories ====================

export function createExecutionData(overrides: Partial<{
  id: string
  automacaoId: string
  contatoId: string
  status: 'executando' | 'sucesso' | 'falha' | 'aguardando'
  acoesExecutadas: unknown[]
  erro: string
  proximaAcaoEm: Date
  createdAt: Date
}> = {}) {
  return {
    id: overrides.id ?? uuidv4(),
    automacaoId: overrides.automacaoId ?? uuidv4(),
    contatoId: overrides.contatoId ?? uuidv4(),
    status: overrides.status ?? 'executando',
    acoesExecutadas: overrides.acoesExecutadas ?? [],
    erro: overrides.erro,
    proximaAcaoEm: overrides.proximaAcaoEm,
    createdAt: overrides.createdAt ?? new Date(),
  }
}

// ==================== Mock Builders ====================

export function createMockRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    findByTrigger: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findExecutionById: vi.fn(),
    findExecutionsByAutomation: vi.fn(),
    findPendingExecutions: vi.fn(),
    createExecution: vi.fn(),
    updateExecution: vi.fn(),
    hasRecentExecution: vi.fn(),
  }
}

export function createMockEventPublisher() {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(() => {}),
  }
}

export function createMockMessageSender() {
  return {
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
    sendTemplate: vi.fn().mockResolvedValue({ success: true }),
  }
}

export function createMockNotification() {
  return {
    createPanelAlert: vi.fn().mockResolvedValue(undefined),
    notifyAdminWhatsApp: vi.fn().mockResolvedValue({ success: true }),
  }
}

export function createMockContact() {
  return {
    findById: vi.fn(),
    getContactData: vi.fn(),
    addTag: vi.fn().mockResolvedValue({ success: true }),
    removeTag: vi.fn().mockResolvedValue({ success: true }),
    updateJourneyState: vi.fn().mockResolvedValue({ success: true }),
    findContactsWithoutInteraction: vi.fn().mockResolvedValue([]),
  }
}

export function createMockTemplate() {
  return {
    findById: vi.fn(),
    renderForContact: vi.fn().mockImplementation((content: string) => Promise.resolve(content)),
  }
}

// Import vi from vitest for mock functions
import { vi } from 'vitest'
