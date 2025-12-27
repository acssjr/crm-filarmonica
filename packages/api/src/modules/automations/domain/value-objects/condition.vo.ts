/**
 * Condition Value Object
 * Represents a filter condition that must be satisfied for an automation to execute
 */

export type ConditionCampo =
  | 'tags'
  | 'estadoJornada'
  | 'origem'
  | 'idade'
  | 'instrumentoDesejado'

export type ConditionOperador =
  | 'igual'
  | 'diferente'
  | 'contem'
  | 'nao_contem'

export interface Condition {
  readonly campo: ConditionCampo
  readonly operador: ConditionOperador
  readonly valor: string | string[]
}

export function createCondition(
  campo: ConditionCampo,
  operador: ConditionOperador,
  valor: string | string[]
): Condition {
  validateCondition(campo, operador)
  return Object.freeze({ campo, operador, valor })
}

export function validateCondition(campo: ConditionCampo, operador: ConditionOperador): void {
  // Tags only support contem/nao_contem
  if (campo === 'tags' && !['contem', 'nao_contem'].includes(operador)) {
    throw new Error('Campo tags só suporta operadores contem/nao_contem')
  }

  // Other fields only support igual/diferente
  if (campo !== 'tags' && !['igual', 'diferente'].includes(operador)) {
    throw new Error(`Campo ${campo} só suporta operadores igual/diferente`)
  }
}

export interface ContactData {
  tags?: string[]
  estadoJornada?: string
  origem?: string
  idade?: number
  instrumentoDesejado?: string
}

export function evaluateCondition(condition: Condition, contact: ContactData): boolean {
  const { campo, operador, valor } = condition

  switch (campo) {
    case 'tags': {
      const contactTags = contact.tags || []
      const targetTags = Array.isArray(valor) ? valor : [valor]

      if (operador === 'contem') {
        return targetTags.some(tag => contactTags.includes(tag))
      }
      if (operador === 'nao_contem') {
        return !targetTags.some(tag => contactTags.includes(tag))
      }
      return false
    }

    case 'estadoJornada': {
      const contactValue = contact.estadoJornada || ''
      if (operador === 'igual') return contactValue === valor
      if (operador === 'diferente') return contactValue !== valor
      return false
    }

    case 'origem': {
      const contactValue = contact.origem || ''
      if (operador === 'igual') return contactValue === valor
      if (operador === 'diferente') return contactValue !== valor
      return false
    }

    case 'idade': {
      const contactValue = contact.idade?.toString() || ''
      if (operador === 'igual') return contactValue === valor
      if (operador === 'diferente') return contactValue !== valor
      return false
    }

    case 'instrumentoDesejado': {
      const contactValue = contact.instrumentoDesejado || ''
      if (operador === 'igual') return contactValue === valor
      if (operador === 'diferente') return contactValue !== valor
      return false
    }

    default:
      return false
  }
}

export function evaluateAllConditions(conditions: Condition[], contact: ContactData): boolean {
  if (conditions.length === 0) return true
  return conditions.every(condition => evaluateCondition(condition, contact))
}
