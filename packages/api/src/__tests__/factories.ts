/**
 * Fábricas de Testes
 * Gera dados de teste consistentes para testes unitários
 */
import { v4 as uuidv4 } from 'uuid'
import { vi } from 'vitest'
import type { TriggerTipo, TriggerConfig } from '../modules/automations/domain/value-objects/trigger.vo.js'
import type { ActionTipo } from '../modules/automations/domain/value-objects/action.vo.js'
import type { ConditionCampo, ConditionOperador } from '../modules/automations/domain/value-objects/condition.vo.js'

// ==================== Fábricas de Automação ====================

export interface CreateAutomationInputFactory {
  nome?: string
  triggerTipo?: TriggerTipo
  triggerConfig?: TriggerConfig
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
    nome: overrides.nome ?? `Automação de Teste ${Date.now()}`,
    triggerTipo: overrides.triggerTipo ?? 'novo_contato' as TriggerTipo,
    triggerConfig: overrides.triggerConfig ?? {},
    condicoes: overrides.condicoes ?? [],
    acoes: overrides.acoes ?? [
      { tipo: 'enviar_mensagem' as ActionTipo, config: { mensagem: 'Olá!' } },
    ],
  }
}

export interface AutomationPersistenceData {
  id: string
  nome: string
  ativo: boolean
  triggerTipo: TriggerTipo
  triggerConfig: TriggerConfig
  condicoes: Array<{
    campo: ConditionCampo
    operador: ConditionOperador
    valor: string | string[]
  }>
  acoes: Array<{
    tipo: ActionTipo
    config: Record<string, unknown>
  }>
  createdAt: Date
  updatedAt: Date
}

export function createAutomationPersistence(overrides: Partial<AutomationPersistenceData> = {}): AutomationPersistenceData {
  const now = new Date()
  return {
    id: overrides.id ?? uuidv4(),
    nome: overrides.nome ?? 'Automação de Teste',
    ativo: overrides.ativo ?? false,
    triggerTipo: overrides.triggerTipo ?? 'novo_contato' as TriggerTipo,
    triggerConfig: overrides.triggerConfig ?? {},
    condicoes: overrides.condicoes ?? [],
    acoes: overrides.acoes ?? [{ tipo: 'enviar_mensagem' as ActionTipo, config: { mensagem: 'Olá!' } }],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}

// ==================== Fábricas de Contato ====================

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

// ==================== Fábricas de Execução ====================

export interface ExecutionActionData {
  tipo: string
  executadaAt: Date
  sucesso: boolean
  erro?: string
}

export interface ExecutionData {
  id: string
  automacaoId: string
  contatoId: string
  status: 'executando' | 'sucesso' | 'falha' | 'aguardando'
  acoesExecutadas: ExecutionActionData[]
  erro?: string
  proximaAcaoEm?: Date
  createdAt: Date
}

export function createExecutionData(overrides: Partial<ExecutionData> = {}): ExecutionData {
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

// ==================== Construtores de Mocks ====================

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
    getUnreadAlertsCount: vi.fn().mockResolvedValue(0),
    markAlertAsRead: vi.fn().mockResolvedValue(undefined),
    getAlerts: vi.fn().mockResolvedValue([]),
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
