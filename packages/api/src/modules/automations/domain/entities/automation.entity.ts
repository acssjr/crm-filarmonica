/**
 * Automation Entity
 * Aggregate root for the automation domain
 */

import { Trigger, TriggerTipo, TriggerConfig, createTrigger } from '../value-objects/trigger.vo.js'
import { Condition, ConditionCampo, ConditionOperador, createCondition } from '../value-objects/condition.vo.js'
import { Action, ActionTipo, ActionConfig, createAction } from '../value-objects/action.vo.js'

export interface AutomationProps {
  id: string
  nome: string
  ativo: boolean
  trigger: Trigger
  condicoes: Condition[]
  acoes: Action[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateAutomationInput {
  nome: string
  triggerTipo: TriggerTipo
  triggerConfig?: TriggerConfig
  condicoes?: Array<{
    campo: ConditionCampo
    operador: ConditionOperador
    valor: string | string[]
  }>
  acoes: Array<{
    tipo: ActionTipo
    config?: ActionConfig
  }>
}

export interface UpdateAutomationInput {
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
    config?: ActionConfig
  }>
}

export class Automation {
  private constructor(private props: AutomationProps) {}

  get id(): string {
    return this.props.id
  }

  get nome(): string {
    return this.props.nome
  }

  get ativo(): boolean {
    return this.props.ativo
  }

  get trigger(): Trigger {
    return this.props.trigger
  }

  get condicoes(): Condition[] {
    return [...this.props.condicoes]
  }

  get acoes(): Action[] {
    return [...this.props.acoes]
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(id: string, input: CreateAutomationInput): Automation {
    if (!input.nome || input.nome.length > 100) {
      throw new Error('Nome deve ter entre 1 e 100 caracteres')
    }

    if (!input.acoes || input.acoes.length === 0) {
      throw new Error('Automação deve ter pelo menos uma ação')
    }

    const trigger = createTrigger(input.triggerTipo, input.triggerConfig || {})
    const condicoes = (input.condicoes || []).map(c =>
      createCondition(c.campo, c.operador, c.valor)
    )
    const acoes = input.acoes.map(a => createAction(a.tipo, a.config || {}))

    const now = new Date()
    return new Automation({
      id,
      nome: input.nome.trim(),
      ativo: false,
      trigger,
      condicoes,
      acoes,
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(data: {
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
      config: ActionConfig
    }>
    createdAt: Date
    updatedAt: Date
  }): Automation {
    const trigger = createTrigger(data.triggerTipo, data.triggerConfig)
    const condicoes = data.condicoes.map(c =>
      createCondition(c.campo, c.operador, c.valor)
    )
    const acoes = data.acoes.map(a => createAction(a.tipo, a.config))

    return new Automation({
      id: data.id,
      nome: data.nome,
      ativo: data.ativo,
      trigger,
      condicoes,
      acoes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  update(input: UpdateAutomationInput): void {
    if (input.nome !== undefined) {
      if (!input.nome || input.nome.length > 100) {
        throw new Error('Nome deve ter entre 1 e 100 caracteres')
      }
      this.props.nome = input.nome.trim()
    }

    if (input.triggerTipo !== undefined) {
      this.props.trigger = createTrigger(
        input.triggerTipo,
        input.triggerConfig || this.props.trigger.config
      )
    } else if (input.triggerConfig !== undefined) {
      this.props.trigger = createTrigger(
        this.props.trigger.tipo,
        input.triggerConfig
      )
    }

    if (input.condicoes !== undefined) {
      this.props.condicoes = input.condicoes.map(c =>
        createCondition(c.campo, c.operador, c.valor)
      )
    }

    if (input.acoes !== undefined) {
      if (input.acoes.length === 0) {
        throw new Error('Automação deve ter pelo menos uma ação')
      }
      this.props.acoes = input.acoes.map(a => createAction(a.tipo, a.config || {}))
    }

    this.props.updatedAt = new Date()
  }

  activate(): void {
    if (this.props.ativo) return
    this.props.ativo = true
    this.props.updatedAt = new Date()
  }

  deactivate(): void {
    if (!this.props.ativo) return
    this.props.ativo = false
    this.props.updatedAt = new Date()
  }

  toPersistence(): {
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
      config: ActionConfig
    }>
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.props.id,
      nome: this.props.nome,
      ativo: this.props.ativo,
      triggerTipo: this.props.trigger.tipo,
      triggerConfig: this.props.trigger.config,
      condicoes: this.props.condicoes.map(c => ({
        campo: c.campo,
        operador: c.operador,
        valor: c.valor,
      })),
      acoes: this.props.acoes.map(a => ({
        tipo: a.tipo,
        config: a.config,
      })),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }
}
