/**
 * Automation Repository Port
 * Interface for automation persistence
 */

import { Automation } from '../entities/automation.entity.js'
import { TriggerTipo } from '../value-objects/trigger.vo.js'

export interface AutomationExecution {
  id: string
  automacaoId: string
  contatoId: string
  status: 'executando' | 'sucesso' | 'falha' | 'aguardando'
  acoesExecutadas: Array<{
    tipo: string
    executadaAt: Date
    sucesso: boolean
    erro?: string
  }>
  erro?: string
  proximaAcaoEm?: Date
  createdAt: Date
}

export interface CreateExecutionInput {
  automacaoId: string
  contatoId: string
}

export interface UpdateExecutionInput {
  status?: 'executando' | 'sucesso' | 'falha' | 'aguardando'
  acoesExecutadas?: Array<{
    tipo: string
    executadaAt: Date
    sucesso: boolean
    erro?: string
  }>
  erro?: string
  proximaAcaoEm?: Date
}

export interface AutomationRepositoryPort {
  // Automation CRUD
  findAll(): Promise<Automation[]>
  findById(id: string): Promise<Automation | null>
  findActive(): Promise<Automation[]>
  findByTrigger(trigger: TriggerTipo): Promise<Automation[]>
  save(automation: Automation): Promise<void>
  delete(id: string): Promise<boolean>

  // Execution management
  findExecutionById(id: string): Promise<AutomationExecution | null>
  findExecutionsByAutomation(automacaoId: string): Promise<AutomationExecution[]>
  findPendingExecutions(): Promise<AutomationExecution[]>
  createExecution(input: CreateExecutionInput): Promise<AutomationExecution>
  updateExecution(id: string, input: UpdateExecutionInput): Promise<AutomationExecution | null>

  /**
   * Check if automation was executed for contact recently (deduplication)
   * @param automacaoId Automation ID
   * @param contatoId Contact ID
   * @param windowMinutes Time window in minutes (default: 60)
   * @returns true if there's a recent execution
   */
  hasRecentExecution(automacaoId: string, contatoId: string, windowMinutes?: number): Promise<boolean>
}
