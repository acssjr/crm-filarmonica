/**
 * Trigger Value Object
 * Represents the event that starts an automation
 */

export type TriggerTipo =
  | 'novo_contato'
  | 'tag_adicionada'
  | 'tag_removida'
  | 'jornada_mudou'
  | 'tempo_sem_interacao'
  | 'mensagem_recebida'

export interface TriggerConfig {
  tagId?: string
  estado?: string
  dias?: number
  palavraChave?: string
}

export interface Trigger {
  readonly tipo: TriggerTipo
  readonly config: TriggerConfig
}

export function createTrigger(tipo: TriggerTipo, config: TriggerConfig = {}): Trigger {
  validateTrigger(tipo, config)
  return Object.freeze({ tipo, config })
}

export function validateTrigger(tipo: TriggerTipo, config: TriggerConfig): void {
  if (tipo === 'tempo_sem_interacao' && (!config.dias || config.dias < 1)) {
    throw new Error('Trigger tempo_sem_interacao requer dias >= 1')
  }
}

export function matchesTrigger(trigger: Trigger, event: TriggerEvent): boolean {
  if (trigger.tipo !== event.tipo) {
    return false
  }

  switch (trigger.tipo) {
    case 'tag_adicionada':
    case 'tag_removida':
      // If tagId specified, must match
      if (trigger.config.tagId && trigger.config.tagId !== event.data?.tagId) {
        return false
      }
      break

    case 'jornada_mudou':
      // If estado specified, must match
      if (trigger.config.estado && trigger.config.estado !== event.data?.estado) {
        return false
      }
      break

    case 'mensagem_recebida':
      // If keyword specified, must be present in message
      if (trigger.config.palavraChave) {
        const mensagem = String(event.data?.mensagem || '').toLowerCase()
        const keyword = trigger.config.palavraChave.toLowerCase()
        if (!mensagem.includes(keyword)) {
          return false
        }
      }
      break
  }

  return true
}

export interface TriggerEvent {
  tipo: TriggerTipo
  contatoId: string
  data?: Record<string, unknown>
}
