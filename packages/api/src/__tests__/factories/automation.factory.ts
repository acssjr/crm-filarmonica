/**
 * Factory para Automation e value objects relacionados
 */

import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/pt_BR'
import type { TriggerTipo, TriggerConfig } from '../../modules/automations/domain/value-objects/trigger.vo.js'
import type { ActionTipo, ActionConfig } from '../../modules/automations/domain/value-objects/action.vo.js'
import type { ConditionCampo, ConditionOperador } from '../../modules/automations/domain/value-objects/condition.vo.js'
import type { CreateAutomationInput } from '../../modules/automations/domain/entities/automation.entity.js'

// Factory para input de criação de automação
export const createAutomationInputFactory = Factory.define<CreateAutomationInput>(
  ({ sequence }) => ({
    nome: `Automação ${sequence}`,
    triggerTipo: 'novo_contato' as TriggerTipo,
    triggerConfig: {},
    condicoes: [],
    acoes: [
      {
        tipo: 'enviar_mensagem' as ActionTipo,
        config: { mensagem: faker.lorem.sentence() },
      },
    ],
  })
)

// Factory para dados de persistência de automação
interface AutomationPersistence {
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
}

export const automationPersistenceFactory = Factory.define<AutomationPersistence>(
  ({ sequence }) => ({
    id: faker.string.uuid(),
    nome: `Automação ${sequence}`,
    ativo: false,
    triggerTipo: 'novo_contato' as TriggerTipo,
    triggerConfig: {},
    condicoes: [],
    acoes: [
      {
        tipo: 'enviar_mensagem' as ActionTipo,
        config: { mensagem: faker.lorem.sentence() },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  })
)

// Factory para Action
interface ActionInput {
  tipo: ActionTipo
  config: ActionConfig
}

export const actionInputFactory = Factory.define<ActionInput>(() => ({
  tipo: 'enviar_mensagem' as ActionTipo,
  config: { mensagem: faker.lorem.sentence() },
}))

// Factory para Condition
interface ConditionInput {
  campo: ConditionCampo
  operador: ConditionOperador
  valor: string | string[]
}

export const conditionInputFactory = Factory.define<ConditionInput>(() => ({
  campo: 'estadoJornada' as ConditionCampo,
  operador: 'igual' as ConditionOperador,
  valor: 'qualificado',
}))
