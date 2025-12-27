/**
 * Automation Repository Adapter
 * Concrete implementation of AutomationRepositoryPort using Drizzle
 */

import { eq, and } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { automacoes, automacaoExecucoes } from '../../../db/schema.js'
import { Automation } from '../domain/entities/automation.entity.js'
import { TriggerTipo } from '../domain/value-objects/trigger.vo.js'
import {
  AutomationRepositoryPort,
  AutomationExecution,
  CreateExecutionInput,
  UpdateExecutionInput,
} from '../domain/ports/automation.repository.port.js'

function mapDbToEntity(row: typeof automacoes.$inferSelect): Automation {
  return Automation.fromPersistence({
    id: row.id,
    nome: row.nome,
    ativo: row.ativo,
    triggerTipo: row.triggerTipo as TriggerTipo,
    triggerConfig: (row.triggerConfig || {}) as Record<string, unknown>,
    condicoes: (row.condicoes || []) as Array<{
      campo: 'tags' | 'estadoJornada' | 'origem' | 'idade' | 'instrumentoDesejado'
      operador: 'igual' | 'diferente' | 'contem' | 'nao_contem'
      valor: string | string[]
    }>,
    acoes: (row.acoes || []) as Array<{
      tipo: 'enviar_mensagem' | 'enviar_template' | 'adicionar_tag' | 'remover_tag' | 'mudar_jornada' | 'notificar_admin' | 'aguardar'
      config: Record<string, unknown>
    }>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

function mapExecutionFromDb(row: typeof automacaoExecucoes.$inferSelect): AutomationExecution {
  return {
    id: row.id,
    automacaoId: row.automacaoId,
    contatoId: row.contatoId,
    status: row.status as AutomationExecution['status'],
    acoesExecutadas: (row.acoesExecutadas || []) as AutomationExecution['acoesExecutadas'],
    erro: row.erro || undefined,
    proximaAcaoEm: row.proximaAcaoEm || undefined,
    createdAt: row.createdAt,
  }
}

export class AutomationRepository implements AutomationRepositoryPort {
  async findAll(): Promise<Automation[]> {
    const rows = await db.select().from(automacoes).orderBy(automacoes.createdAt)
    return rows.map(mapDbToEntity)
  }

  async findById(id: string): Promise<Automation | null> {
    const rows = await db.select().from(automacoes).where(eq(automacoes.id, id)).limit(1)
    return rows[0] ? mapDbToEntity(rows[0]) : null
  }

  async findActive(): Promise<Automation[]> {
    const rows = await db.select().from(automacoes).where(eq(automacoes.ativo, true))
    return rows.map(mapDbToEntity)
  }

  async findByTrigger(trigger: TriggerTipo): Promise<Automation[]> {
    const rows = await db
      .select()
      .from(automacoes)
      .where(and(eq(automacoes.ativo, true), eq(automacoes.triggerTipo, trigger)))
    return rows.map(mapDbToEntity)
  }

  async save(automation: Automation): Promise<void> {
    const data = automation.toPersistence()

    const existing = await db
      .select({ id: automacoes.id })
      .from(automacoes)
      .where(eq(automacoes.id, data.id))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(automacoes)
        .set({
          nome: data.nome,
          ativo: data.ativo,
          triggerTipo: data.triggerTipo,
          triggerConfig: data.triggerConfig,
          condicoes: data.condicoes,
          acoes: data.acoes,
          updatedAt: data.updatedAt,
        })
        .where(eq(automacoes.id, data.id))
    } else {
      await db.insert(automacoes).values({
        id: data.id,
        nome: data.nome,
        ativo: data.ativo,
        triggerTipo: data.triggerTipo,
        triggerConfig: data.triggerConfig,
        condicoes: data.condicoes,
        acoes: data.acoes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    }
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    await db.delete(automacoes).where(eq(automacoes.id, id))
    return true
  }

  async findExecutionById(id: string): Promise<AutomationExecution | null> {
    const rows = await db
      .select()
      .from(automacaoExecucoes)
      .where(eq(automacaoExecucoes.id, id))
      .limit(1)
    return rows[0] ? mapExecutionFromDb(rows[0]) : null
  }

  async findExecutionsByAutomation(automacaoId: string): Promise<AutomationExecution[]> {
    const rows = await db
      .select()
      .from(automacaoExecucoes)
      .where(eq(automacaoExecucoes.automacaoId, automacaoId))
      .orderBy(automacaoExecucoes.createdAt)
    return rows.map(mapExecutionFromDb)
  }

  async findPendingExecutions(): Promise<AutomationExecution[]> {
    const now = new Date()
    const rows = await db
      .select()
      .from(automacaoExecucoes)
      .where(eq(automacaoExecucoes.status, 'aguardando'))
    return rows
      .map(mapExecutionFromDb)
      .filter(e => e.proximaAcaoEm && e.proximaAcaoEm <= now)
  }

  async createExecution(input: CreateExecutionInput): Promise<AutomationExecution> {
    const [row] = await db
      .insert(automacaoExecucoes)
      .values({
        automacaoId: input.automacaoId,
        contatoId: input.contatoId,
        status: 'executando',
        acoesExecutadas: [],
      })
      .returning()
    return mapExecutionFromDb(row)
  }

  async updateExecution(id: string, input: UpdateExecutionInput): Promise<AutomationExecution | null> {
    const updates: Partial<typeof automacaoExecucoes.$inferInsert> = {}

    if (input.status !== undefined) updates.status = input.status
    if (input.acoesExecutadas !== undefined) updates.acoesExecutadas = input.acoesExecutadas
    if (input.erro !== undefined) updates.erro = input.erro
    if (input.proximaAcaoEm !== undefined) updates.proximaAcaoEm = input.proximaAcaoEm

    const [row] = await db
      .update(automacaoExecucoes)
      .set(updates)
      .where(eq(automacaoExecucoes.id, id))
      .returning()

    return row ? mapExecutionFromDb(row) : null
  }
}

export const automationRepository = new AutomationRepository()
