/**
 * Testes unitários para Trigger Value Object
 * Testa criação, validação e matching de triggers
 */

import { describe, it, expect } from 'vitest'
import {
  createTrigger,
  validateTrigger,
  matchesTrigger,
  type TriggerTipo,
  type TriggerConfig,
  type TriggerEvent,
} from './trigger.vo.js'

describe('Trigger Value Object', () => {
  // ==================== createTrigger ====================
  describe('createTrigger', () => {
    // Testa criacao basica de trigger para cada tipo
    it('should create trigger for novo_contato type', () => {
      const trigger = createTrigger('novo_contato', {})

      expect(trigger.tipo).toBe('novo_contato')
      expect(trigger.config).toEqual({})
    })

    it('should create trigger for tag_adicionada type with tagId', () => {
      const config: TriggerConfig = { tagId: 'tag-123' }
      const trigger = createTrigger('tag_adicionada', config)

      expect(trigger.tipo).toBe('tag_adicionada')
      expect(trigger.config.tagId).toBe('tag-123')
    })

    it('should create trigger for tag_removida type with tagId', () => {
      const config: TriggerConfig = { tagId: 'tag-456' }
      const trigger = createTrigger('tag_removida', config)

      expect(trigger.tipo).toBe('tag_removida')
      expect(trigger.config.tagId).toBe('tag-456')
    })

    it('should create trigger for jornada_mudou type with estado', () => {
      const config: TriggerConfig = { estado: 'matriculado' }
      const trigger = createTrigger('jornada_mudou', config)

      expect(trigger.tipo).toBe('jornada_mudou')
      expect(trigger.config.estado).toBe('matriculado')
    })

    it('should create trigger for tempo_sem_interacao type with dias', () => {
      const config: TriggerConfig = { dias: 7 }
      const trigger = createTrigger('tempo_sem_interacao', config)

      expect(trigger.tipo).toBe('tempo_sem_interacao')
      expect(trigger.config.dias).toBe(7)
    })

    it('should create trigger for mensagem_recebida type with palavraChave', () => {
      const config: TriggerConfig = { palavraChave: 'matricula' }
      const trigger = createTrigger('mensagem_recebida', config)

      expect(trigger.tipo).toBe('mensagem_recebida')
      expect(trigger.config.palavraChave).toBe('matricula')
    })

    // Testa que o trigger e imutavel (frozen)
    it('should create an immutable (frozen) trigger object', () => {
      const trigger = createTrigger('novo_contato', {})

      expect(Object.isFrozen(trigger)).toBe(true)
    })

    // Testa config padrao quando nao fornecida
    it('should use empty config when not provided', () => {
      const trigger = createTrigger('novo_contato')

      expect(trigger.config).toEqual({})
    })
  })

  // ==================== validateTrigger ====================
  describe('validateTrigger', () => {
    // Testa validacao de tempo_sem_interacao com dias validos
    it('should not throw for tempo_sem_interacao with dias >= 1', () => {
      expect(() => validateTrigger('tempo_sem_interacao', { dias: 1 })).not.toThrow()
      expect(() => validateTrigger('tempo_sem_interacao', { dias: 30 })).not.toThrow()
      expect(() => validateTrigger('tempo_sem_interacao', { dias: 365 })).not.toThrow()
    })

    // Testa erro quando tempo_sem_interacao sem dias
    it('should throw for tempo_sem_interacao without dias', () => {
      expect(() => validateTrigger('tempo_sem_interacao', {})).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
    })

    // Testa erro quando tempo_sem_interacao com dias < 1
    it('should throw for tempo_sem_interacao with dias < 1', () => {
      expect(() => validateTrigger('tempo_sem_interacao', { dias: 0 })).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
      expect(() => validateTrigger('tempo_sem_interacao', { dias: -1 })).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
    })

    // Testa que outros tipos nao tem validacao especifica
    it('should not throw for other trigger types with any config', () => {
      const types: TriggerTipo[] = [
        'novo_contato',
        'tag_adicionada',
        'tag_removida',
        'jornada_mudou',
        'mensagem_recebida',
      ]

      types.forEach(tipo => {
        expect(() => validateTrigger(tipo, {})).not.toThrow()
        expect(() => validateTrigger(tipo, { tagId: 'abc' })).not.toThrow()
        expect(() => validateTrigger(tipo, { estado: 'xyz' })).not.toThrow()
      })
    })
  })

  // ==================== matchesTrigger ====================
  describe('matchesTrigger', () => {
    // Testa que tipos diferentes nao fazem match
    describe('type matching', () => {
      it('should return false when trigger type does not match event type', () => {
        const trigger = createTrigger('novo_contato', {})
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contact-123',
          data: { tagId: 'tag-1' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should return true when trigger type matches event type for simple triggers', () => {
        const trigger = createTrigger('novo_contato', {})
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contact-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })
    })

    // Testes para tag_adicionada
    describe('tag_adicionada trigger', () => {
      it('should match when no tagId specified in trigger', () => {
        const trigger = createTrigger('tag_adicionada', {})
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contact-123',
          data: { tagId: 'any-tag' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should match when tagId matches', () => {
        const trigger = createTrigger('tag_adicionada', { tagId: 'vip' })
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contact-123',
          data: { tagId: 'vip' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should not match when tagId does not match', () => {
        const trigger = createTrigger('tag_adicionada', { tagId: 'vip' })
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contact-123',
          data: { tagId: 'regular' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should not match when event has no data', () => {
        const trigger = createTrigger('tag_adicionada', { tagId: 'vip' })
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contact-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    // Testes para tag_removida
    describe('tag_removida trigger', () => {
      it('should match when no tagId specified in trigger', () => {
        const trigger = createTrigger('tag_removida', {})
        const event: TriggerEvent = {
          tipo: 'tag_removida',
          contatoId: 'contact-123',
          data: { tagId: 'any-tag' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should match when tagId matches', () => {
        const trigger = createTrigger('tag_removida', { tagId: 'churned' })
        const event: TriggerEvent = {
          tipo: 'tag_removida',
          contatoId: 'contact-123',
          data: { tagId: 'churned' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should not match when tagId does not match', () => {
        const trigger = createTrigger('tag_removida', { tagId: 'churned' })
        const event: TriggerEvent = {
          tipo: 'tag_removida',
          contatoId: 'contact-123',
          data: { tagId: 'active' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    // Testes para jornada_mudou
    describe('jornada_mudou trigger', () => {
      it('should match when no estado specified in trigger', () => {
        const trigger = createTrigger('jornada_mudou', {})
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contact-123',
          data: { estado: 'any-state' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should match when estado matches', () => {
        const trigger = createTrigger('jornada_mudou', { estado: 'matriculado' })
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contact-123',
          data: { estado: 'matriculado' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should not match when estado does not match', () => {
        const trigger = createTrigger('jornada_mudou', { estado: 'matriculado' })
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contact-123',
          data: { estado: 'desistente' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should not match when event has no data', () => {
        const trigger = createTrigger('jornada_mudou', { estado: 'matriculado' })
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contact-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    // Testes para mensagem_recebida
    describe('mensagem_recebida trigger', () => {
      it('should match when no palavraChave specified in trigger', () => {
        const trigger = createTrigger('mensagem_recebida', {})
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: { mensagem: 'qualquer mensagem' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should match when keyword is found in message (case insensitive)', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'matricula' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: { mensagem: 'Gostaria de saber sobre MATRICULA' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should match keyword in the middle of message', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'curso' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: { mensagem: 'Quero saber sobre o curso de musica' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('should not match when keyword is not found in message', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'cancelar' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: { mensagem: 'Ola, quero informacoes' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should handle empty message gracefully', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'test' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: { mensagem: '' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should handle undefined message gracefully', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'test' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
          data: {},
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('should handle missing data gracefully', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'test' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contact-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    // Testes para tempo_sem_interacao
    describe('tempo_sem_interacao trigger', () => {
      it('should match when type matches (validation happens elsewhere)', () => {
        const trigger = createTrigger('tempo_sem_interacao', { dias: 7 })
        const event: TriggerEvent = {
          tipo: 'tempo_sem_interacao',
          contatoId: 'contact-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })
    })
  })

  // ==================== Edge Cases ====================
  describe('edge cases', () => {
    it('should handle trigger with all config options', () => {
      const config: TriggerConfig = {
        tagId: 'tag-1',
        estado: 'matriculado',
        dias: 5,
        palavraChave: 'matricula',
      }
      const trigger = createTrigger('novo_contato', config)

      expect(trigger.config).toEqual(config)
    })

    it('should freeze the trigger object itself', () => {
      const trigger = createTrigger('tag_adicionada', { tagId: 'test' })

      // O trigger em si deve estar congelado
      expect(Object.isFrozen(trigger)).toBe(true)

      // Tentar modificar deve falhar
      expect(() => {
        // @ts-expect-error - testando imutabilidade
        trigger.tipo = 'novo_contato'
      }).toThrow()
    })
  })
})
