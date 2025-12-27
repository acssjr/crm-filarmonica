/**
 * Testes unitários para Condition Value Object
 * Testa criação, validação e avaliação de condições
 */

import { describe, it, expect } from 'vitest'
import {
  createCondition,
  validateCondition,
  evaluateCondition,
  evaluateAllConditions,
  type ConditionCampo,
  type Condition,
  type ContactData,
} from './condition.vo.js'

describe('Condition Value Object', () => {
  // ==================== createCondition ====================
  describe('createCondition', () => {
    // Testa criacao basica de condicao
    it('should create condition with all valid parameters', () => {
      const condition = createCondition('tags', 'contem', 'vip')

      expect(condition.campo).toBe('tags')
      expect(condition.operador).toBe('contem')
      expect(condition.valor).toBe('vip')
    })

    it('should create condition with array value', () => {
      const condition = createCondition('tags', 'contem', ['vip', 'premium'])

      expect(condition.campo).toBe('tags')
      expect(condition.valor).toEqual(['vip', 'premium'])
    })

    // Testa que a condicao e imutavel (frozen)
    it('should create an immutable (frozen) condition object', () => {
      const condition = createCondition('estadoJornada', 'igual', 'matriculado')

      expect(Object.isFrozen(condition)).toBe(true)
    })

    // Testa criacao para todos os campos com operadores validos
    it('should create condition for estadoJornada with igual operator', () => {
      const condition = createCondition('estadoJornada', 'igual', 'inicial')

      expect(condition.campo).toBe('estadoJornada')
      expect(condition.operador).toBe('igual')
    })

    it('should create condition for origem with diferente operator', () => {
      const condition = createCondition('origem', 'diferente', 'organico')

      expect(condition.campo).toBe('origem')
      expect(condition.operador).toBe('diferente')
    })

    it('should create condition for idade with igual operator', () => {
      const condition = createCondition('idade', 'igual', '25')

      expect(condition.campo).toBe('idade')
      expect(condition.operador).toBe('igual')
    })

    it('should create condition for instrumentoDesejado with igual operator', () => {
      const condition = createCondition('instrumentoDesejado', 'igual', 'violao')

      expect(condition.campo).toBe('instrumentoDesejado')
      expect(condition.operador).toBe('igual')
    })
  })

  // ==================== validateCondition ====================
  describe('validateCondition', () => {
    // Testa que tags so aceita contem/nao_contem
    describe('tags field validation', () => {
      it('should not throw for tags with contem operator', () => {
        expect(() => validateCondition('tags', 'contem')).not.toThrow()
      })

      it('should not throw for tags with nao_contem operator', () => {
        expect(() => validateCondition('tags', 'nao_contem')).not.toThrow()
      })

      it('should throw for tags with igual operator', () => {
        expect(() => validateCondition('tags', 'igual')).toThrow(
          'Campo tags só suporta operadores contem/nao_contem'
        )
      })

      it('should throw for tags with diferente operator', () => {
        expect(() => validateCondition('tags', 'diferente')).toThrow(
          'Campo tags só suporta operadores contem/nao_contem'
        )
      })
    })

    // Testa que outros campos so aceitam igual/diferente
    describe('other fields validation', () => {
      const nonTagFields: ConditionCampo[] = [
        'estadoJornada',
        'origem',
        'idade',
        'instrumentoDesejado',
      ]

      nonTagFields.forEach(campo => {
        describe(`${campo} field`, () => {
          it(`should not throw for ${campo} with igual operator`, () => {
            expect(() => validateCondition(campo, 'igual')).not.toThrow()
          })

          it(`should not throw for ${campo} with diferente operator`, () => {
            expect(() => validateCondition(campo, 'diferente')).not.toThrow()
          })

          it(`should throw for ${campo} with contem operator`, () => {
            expect(() => validateCondition(campo, 'contem')).toThrow(
              `Campo ${campo} só suporta operadores igual/diferente`
            )
          })

          it(`should throw for ${campo} with nao_contem operator`, () => {
            expect(() => validateCondition(campo, 'nao_contem')).toThrow(
              `Campo ${campo} só suporta operadores igual/diferente`
            )
          })
        })
      })
    })
  })

  // ==================== evaluateCondition ====================
  describe('evaluateCondition', () => {
    // Testes para campo tags
    describe('tags field evaluation', () => {
      it('should return true when contact has one of the target tags (contem)', () => {
        const condition = createCondition('tags', 'contem', ['vip', 'premium'])
        const contact: ContactData = { tags: ['vip', 'active'] }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return true when contact has the exact tag (contem with string)', () => {
        const condition = createCondition('tags', 'contem', 'vip')
        const contact: ContactData = { tags: ['vip', 'active'] }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when contact has none of the target tags (contem)', () => {
        const condition = createCondition('tags', 'contem', ['vip', 'premium'])
        const contact: ContactData = { tags: ['basic', 'active'] }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true when contact does not have any of the target tags (nao_contem)', () => {
        const condition = createCondition('tags', 'nao_contem', ['churned', 'inactive'])
        const contact: ContactData = { tags: ['vip', 'active'] }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when contact has one of the excluded tags (nao_contem)', () => {
        const condition = createCondition('tags', 'nao_contem', ['churned', 'inactive'])
        const contact: ContactData = { tags: ['churned', 'old'] }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should handle empty contact tags array', () => {
        const condition = createCondition('tags', 'contem', 'vip')
        const contact: ContactData = { tags: [] }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should handle undefined contact tags (treats as empty)', () => {
        const condition = createCondition('tags', 'contem', 'vip')
        const contact: ContactData = {}

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true for nao_contem when contact has no tags', () => {
        const condition = createCondition('tags', 'nao_contem', 'excluded')
        const contact: ContactData = { tags: [] }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })
    })

    // Testes para campo estadoJornada
    describe('estadoJornada field evaluation', () => {
      it('should return true when estadoJornada matches (igual)', () => {
        const condition = createCondition('estadoJornada', 'igual', 'matriculado')
        const contact: ContactData = { estadoJornada: 'matriculado' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when estadoJornada does not match (igual)', () => {
        const condition = createCondition('estadoJornada', 'igual', 'matriculado')
        const contact: ContactData = { estadoJornada: 'inicial' }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true when estadoJornada differs (diferente)', () => {
        const condition = createCondition('estadoJornada', 'diferente', 'desistente')
        const contact: ContactData = { estadoJornada: 'matriculado' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when estadoJornada matches (diferente)', () => {
        const condition = createCondition('estadoJornada', 'diferente', 'desistente')
        const contact: ContactData = { estadoJornada: 'desistente' }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should treat undefined estadoJornada as empty string', () => {
        const condition = createCondition('estadoJornada', 'igual', '')
        const contact: ContactData = {}

        expect(evaluateCondition(condition, contact)).toBe(true)
      })
    })

    // Testes para campo origem
    describe('origem field evaluation', () => {
      it('should return true when origem matches (igual)', () => {
        const condition = createCondition('origem', 'igual', 'facebook')
        const contact: ContactData = { origem: 'facebook' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when origem does not match (igual)', () => {
        const condition = createCondition('origem', 'igual', 'facebook')
        const contact: ContactData = { origem: 'organico' }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true when origem differs (diferente)', () => {
        const condition = createCondition('origem', 'diferente', 'facebook')
        const contact: ContactData = { origem: 'instagram' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should treat undefined origem as empty string', () => {
        const condition = createCondition('origem', 'diferente', 'facebook')
        const contact: ContactData = {}

        expect(evaluateCondition(condition, contact)).toBe(true)
      })
    })

    // Testes para campo idade
    describe('idade field evaluation', () => {
      it('should return true when idade matches (igual)', () => {
        const condition = createCondition('idade', 'igual', '25')
        const contact: ContactData = { idade: 25 }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when idade does not match (igual)', () => {
        const condition = createCondition('idade', 'igual', '25')
        const contact: ContactData = { idade: 30 }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true when idade differs (diferente)', () => {
        const condition = createCondition('idade', 'diferente', '18')
        const contact: ContactData = { idade: 25 }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should treat undefined idade as empty string', () => {
        const condition = createCondition('idade', 'igual', '')
        const contact: ContactData = {}

        expect(evaluateCondition(condition, contact)).toBe(true)
      })
    })

    // Testes para campo instrumentoDesejado
    describe('instrumentoDesejado field evaluation', () => {
      it('should return true when instrumentoDesejado matches (igual)', () => {
        const condition = createCondition('instrumentoDesejado', 'igual', 'violao')
        const contact: ContactData = { instrumentoDesejado: 'violao' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should return false when instrumentoDesejado does not match (igual)', () => {
        const condition = createCondition('instrumentoDesejado', 'igual', 'violao')
        const contact: ContactData = { instrumentoDesejado: 'piano' }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return true when instrumentoDesejado differs (diferente)', () => {
        const condition = createCondition('instrumentoDesejado', 'diferente', 'piano')
        const contact: ContactData = { instrumentoDesejado: 'violao' }

        expect(evaluateCondition(condition, contact)).toBe(true)
      })

      it('should treat undefined instrumentoDesejado as empty string', () => {
        const condition = createCondition('instrumentoDesejado', 'diferente', 'piano')
        const contact: ContactData = {}

        expect(evaluateCondition(condition, contact)).toBe(true)
      })
    })

    // Testes para operadores invalidos (default case)
    describe('default case handling', () => {
      it('should return false for tags with invalid operator internally', () => {
        // Forcando um cenario onde operador e invalido internamente
        // Isso simula o caso default no switch para tags
        const condition = { campo: 'tags', operador: 'igual', valor: 'test' } as Condition
        const contact: ContactData = { tags: ['test'] }

        // O evaluateCondition retorna false para operadores invalidos em tags
        expect(evaluateCondition(condition, contact)).toBe(false)
      })

      it('should return false for non-tags field with contem operator internally', () => {
        // Forcando cenario com operador invalido
        const condition = { campo: 'estadoJornada', operador: 'contem', valor: 'test' } as Condition
        const contact: ContactData = { estadoJornada: 'test' }

        expect(evaluateCondition(condition, contact)).toBe(false)
      })
    })
  })

  // ==================== evaluateAllConditions ====================
  describe('evaluateAllConditions', () => {
    it('should return true when no conditions exist', () => {
      const contact: ContactData = { tags: ['vip'] }

      expect(evaluateAllConditions([], contact)).toBe(true)
    })

    it('should return true when all conditions are satisfied', () => {
      const conditions = [
        createCondition('tags', 'contem', 'vip'),
        createCondition('estadoJornada', 'igual', 'matriculado'),
        createCondition('origem', 'igual', 'facebook'),
      ]
      const contact: ContactData = {
        tags: ['vip', 'active'],
        estadoJornada: 'matriculado',
        origem: 'facebook',
      }

      expect(evaluateAllConditions(conditions, contact)).toBe(true)
    })

    it('should return false when any condition fails', () => {
      const conditions = [
        createCondition('tags', 'contem', 'vip'),
        createCondition('estadoJornada', 'igual', 'matriculado'),
      ]
      const contact: ContactData = {
        tags: ['vip'],
        estadoJornada: 'inicial', // Nao bate com 'matriculado'
      }

      expect(evaluateAllConditions(conditions, contact)).toBe(false)
    })

    it('should return false when first condition fails', () => {
      const conditions = [
        createCondition('tags', 'contem', 'premium'),
        createCondition('estadoJornada', 'igual', 'matriculado'),
      ]
      const contact: ContactData = {
        tags: ['basic'],
        estadoJornada: 'matriculado',
      }

      expect(evaluateAllConditions(conditions, contact)).toBe(false)
    })

    it('should work with single condition', () => {
      const conditions = [createCondition('origem', 'igual', 'organico')]
      const contact: ContactData = { origem: 'organico' }

      expect(evaluateAllConditions(conditions, contact)).toBe(true)
    })

    it('should handle complex condition combinations', () => {
      const conditions = [
        createCondition('tags', 'contem', ['vip', 'premium']),
        createCondition('tags', 'nao_contem', ['churned']),
        createCondition('estadoJornada', 'diferente', 'desistente'),
        createCondition('instrumentoDesejado', 'igual', 'piano'),
      ]
      const contact: ContactData = {
        tags: ['premium', 'active'],
        estadoJornada: 'matriculado',
        instrumentoDesejado: 'piano',
      }

      expect(evaluateAllConditions(conditions, contact)).toBe(true)
    })
  })

  // ==================== Edge Cases ====================
  describe('edge cases', () => {
    it('should handle contact with all fields populated', () => {
      const condition = createCondition('idade', 'igual', '30')
      const contact: ContactData = {
        tags: ['vip'],
        estadoJornada: 'matriculado',
        origem: 'facebook',
        idade: 30,
        instrumentoDesejado: 'violao',
      }

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('should handle contact with no fields (empty object)', () => {
      const conditions = [
        createCondition('tags', 'nao_contem', 'any'),
        createCondition('estadoJornada', 'igual', ''),
      ]
      const contact: ContactData = {}

      expect(evaluateAllConditions(conditions, contact)).toBe(true)
    })

    it('should handle special characters in values', () => {
      const condition = createCondition('tags', 'contem', 'tag-with-special_chars.123')
      const contact: ContactData = { tags: ['tag-with-special_chars.123'] }

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })
})
