/**
 * Testes unitários para Trigger Value Object
 * Testa: createTrigger, validateTrigger, matchesTrigger
 */

import { describe, it, expect } from 'vitest'
import {
  createTrigger,
  validateTrigger,
  matchesTrigger,
  type TriggerEvent,
} from './trigger.vo.js'

describe('Trigger Value Object', () => {
  describe('createTrigger', () => {
    it('deve criar trigger novo_contato sem config', () => {
      const trigger = createTrigger('novo_contato')

      expect(trigger.tipo).toBe('novo_contato')
      expect(trigger.config).toEqual({})
      expect(Object.isFrozen(trigger)).toBe(true)
    })

    it('deve criar trigger tag_adicionada com tagId', () => {
      const trigger = createTrigger('tag_adicionada', { tagId: 'tag-123' })

      expect(trigger.tipo).toBe('tag_adicionada')
      expect(trigger.config.tagId).toBe('tag-123')
    })

    it('deve criar trigger tag_removida com tagId', () => {
      const trigger = createTrigger('tag_removida', { tagId: 'tag-456' })

      expect(trigger.tipo).toBe('tag_removida')
      expect(trigger.config.tagId).toBe('tag-456')
    })

    it('deve criar trigger jornada_mudou com estado', () => {
      const trigger = createTrigger('jornada_mudou', { estado: 'qualificado' })

      expect(trigger.tipo).toBe('jornada_mudou')
      expect(trigger.config.estado).toBe('qualificado')
    })

    it('deve criar trigger tempo_sem_interacao com dias válido', () => {
      const trigger = createTrigger('tempo_sem_interacao', { dias: 7 })

      expect(trigger.tipo).toBe('tempo_sem_interacao')
      expect(trigger.config.dias).toBe(7)
    })

    it('deve criar trigger mensagem_recebida com palavraChave', () => {
      const trigger = createTrigger('mensagem_recebida', { palavraChave: 'oi' })

      expect(trigger.tipo).toBe('mensagem_recebida')
      expect(trigger.config.palavraChave).toBe('oi')
    })
  })

  describe('validateTrigger - casos de erro', () => {
    it('deve lançar erro quando tempo_sem_interacao não tem dias', () => {
      expect(() => validateTrigger('tempo_sem_interacao', {})).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
    })

    it('deve lançar erro quando tempo_sem_interacao tem dias menor que 1', () => {
      expect(() => validateTrigger('tempo_sem_interacao', { dias: 0 })).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
    })

    it('deve lançar erro quando tempo_sem_interacao tem dias negativo', () => {
      expect(() => validateTrigger('tempo_sem_interacao', { dias: -1 })).toThrow(
        'Trigger tempo_sem_interacao requer dias >= 1'
      )
    })

    it('não deve lançar erro para novo_contato sem config', () => {
      expect(() => validateTrigger('novo_contato', {})).not.toThrow()
    })

    it('não deve lançar erro para tag_adicionada sem tagId', () => {
      // tagId é opcional na validação
      expect(() => validateTrigger('tag_adicionada', {})).not.toThrow()
    })
  })

  describe('matchesTrigger', () => {
    describe('novo_contato', () => {
      it('deve retornar true quando tipo coincide', () => {
        const trigger = createTrigger('novo_contato')
        const event: TriggerEvent = {
          tipo: 'novo_contato',
          contatoId: 'contato-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar false quando tipo não coincide', () => {
        const trigger = createTrigger('novo_contato')
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contato-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    describe('tag_adicionada', () => {
      it('deve retornar true quando tagId coincide', () => {
        const trigger = createTrigger('tag_adicionada', { tagId: 'tag-123' })
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contato-123',
          data: { tagId: 'tag-123' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar false quando tagId não coincide', () => {
        const trigger = createTrigger('tag_adicionada', { tagId: 'tag-123' })
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contato-123',
          data: { tagId: 'tag-456' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('deve retornar true quando trigger não especifica tagId', () => {
        const trigger = createTrigger('tag_adicionada', {})
        const event: TriggerEvent = {
          tipo: 'tag_adicionada',
          contatoId: 'contato-123',
          data: { tagId: 'qualquer-tag' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })
    })

    describe('tag_removida', () => {
      it('deve retornar true quando tagId coincide', () => {
        const trigger = createTrigger('tag_removida', { tagId: 'tag-123' })
        const event: TriggerEvent = {
          tipo: 'tag_removida',
          contatoId: 'contato-123',
          data: { tagId: 'tag-123' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar false quando tagId não coincide', () => {
        const trigger = createTrigger('tag_removida', { tagId: 'tag-123' })
        const event: TriggerEvent = {
          tipo: 'tag_removida',
          contatoId: 'contato-123',
          data: { tagId: 'tag-diferente' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    describe('jornada_mudou', () => {
      it('deve retornar true quando estado coincide', () => {
        const trigger = createTrigger('jornada_mudou', { estado: 'qualificado' })
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contato-123',
          data: { estado: 'qualificado' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar false quando estado não coincide', () => {
        const trigger = createTrigger('jornada_mudou', { estado: 'qualificado' })
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contato-123',
          data: { estado: 'incompativel' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('deve retornar true quando trigger não especifica estado', () => {
        const trigger = createTrigger('jornada_mudou', {})
        const event: TriggerEvent = {
          tipo: 'jornada_mudou',
          contatoId: 'contato-123',
          data: { estado: 'qualquer-estado' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })
    })

    describe('mensagem_recebida', () => {
      it('deve retornar true quando mensagem contém palavraChave', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'oi' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contato-123',
          data: { mensagem: 'Oi, tudo bem?' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar true com case insensitive', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'AJUDA' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contato-123',
          data: { mensagem: 'Preciso de ajuda' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve retornar false quando mensagem não contém palavraChave', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'matricula' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contato-123',
          data: { mensagem: 'Oi, tudo bem?' },
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })

      it('deve retornar true quando trigger não especifica palavraChave', () => {
        const trigger = createTrigger('mensagem_recebida', {})
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contato-123',
          data: { mensagem: 'Qualquer mensagem' },
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })

      it('deve tratar mensagem undefined graciosamente', () => {
        const trigger = createTrigger('mensagem_recebida', { palavraChave: 'teste' })
        const event: TriggerEvent = {
          tipo: 'mensagem_recebida',
          contatoId: 'contato-123',
          data: {},
        }

        expect(matchesTrigger(trigger, event)).toBe(false)
      })
    })

    describe('tempo_sem_interacao', () => {
      it('deve retornar true quando tipo coincide', () => {
        const trigger = createTrigger('tempo_sem_interacao', { dias: 7 })
        const event: TriggerEvent = {
          tipo: 'tempo_sem_interacao',
          contatoId: 'contato-123',
        }

        expect(matchesTrigger(trigger, event)).toBe(true)
      })
    })
  })

  describe('imutabilidade', () => {
    it('deve retornar objeto congelado (frozen)', () => {
      const trigger = createTrigger('novo_contato')

      expect(Object.isFrozen(trigger)).toBe(true)
    })
  })
})
