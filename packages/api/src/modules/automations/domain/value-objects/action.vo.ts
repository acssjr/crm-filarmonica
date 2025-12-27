/**
 * Action Value Object
 * Represents an action to be executed by an automation
 */

export type ActionTipo =
  | 'enviar_mensagem'
  | 'enviar_template'
  | 'adicionar_tag'
  | 'remover_tag'
  | 'mudar_jornada'
  | 'notificar_admin'
  | 'aguardar'

export interface ActionConfig {
  mensagem?: string
  templateId?: string
  tagId?: string
  estado?: string
  adminPhone?: string
  dias?: number
}

export interface Action {
  readonly tipo: ActionTipo
  readonly config: ActionConfig
}

export function createAction(tipo: ActionTipo, config: ActionConfig = {}): Action {
  validateAction(tipo, config)
  return Object.freeze({ tipo, config })
}

export function validateAction(tipo: ActionTipo, config: ActionConfig): void {
  switch (tipo) {
    case 'enviar_mensagem':
      if (!config.mensagem) {
        throw new Error('Ação enviar_mensagem requer mensagem')
      }
      break

    case 'enviar_template':
      if (!config.templateId) {
        throw new Error('Ação enviar_template requer templateId')
      }
      break

    case 'adicionar_tag':
    case 'remover_tag':
      if (!config.tagId) {
        throw new Error(`Ação ${tipo} requer tagId`)
      }
      break

    case 'mudar_jornada':
      if (!config.estado) {
        throw new Error('Ação mudar_jornada requer estado')
      }
      break

    case 'notificar_admin':
      if (!config.adminPhone) {
        throw new Error('Ação notificar_admin requer adminPhone')
      }
      if (!config.mensagem) {
        throw new Error('Ação notificar_admin requer mensagem')
      }
      break

    case 'aguardar':
      if (!config.dias || config.dias < 1) {
        throw new Error('Ação aguardar requer dias >= 1')
      }
      break
  }
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

export function isDelayAction(action: Action): boolean {
  return action.tipo === 'aguardar'
}

export function getDelayDays(action: Action): number {
  if (action.tipo !== 'aguardar') return 0
  return action.config.dias || 0
}
