/**
 * Testes unitários para Condition Value Object
 * Testa: createCondition, validateCondition, evaluateCondition, evaluateAllConditions
 */

import { describe, it, expect } from 'vitest'
import {
  createCondition,
  validateCondition,
  evaluateCondition,
  evaluateAllConditions,
  type ContactData,
} from './condition.vo.js'
import { contactDataFactory } from '../../../../__tests__/factories/index.js'

describe('Condition Value Object', () => {
  describe('createCondition', () => {
    it('deve criar condition para estadoJornada com operador igual', () => {
      const condition = createCondition('estadoJornada', 'igual', 'qualificado')

      expect(condition.campo).toBe('estadoJornada')
      expect(condition.operador).toBe('igual')
      expect(condition.valor).toBe('qualificado')
      expect(Object.isFrozen(condition)).toBe(true)
    })

    it('deve criar condition para tags com operador contem', () => {
      const condition = createCondition('tags', 'contem', ['vip', 'ativo'])

      expect(condition.campo).toBe('tags')
      expect(condition.operador).toBe('contem')
      expect(condition.valor).toEqual(['vip', 'ativo'])
    })

    it('deve criar condition para origem com operador diferente', () => {
      const condition = createCondition('origem', 'diferente', 'campanha')

      expect(condition.campo).toBe('origem')
      expect(condition.operador).toBe('diferente')
      expect(condition.valor).toBe('campanha')
    })
  })

  describe('validateCondition - casos de erro', () => {
    it('deve lançar erro quando tags usa operador igual', () => {
      expect(() => validateCondition('tags', 'igual')).toThrow(
        'Campo tags só suporta operadores contem/nao_contem'
      )
    })

    it('deve lançar erro quando tags usa operador diferente', () => {
      expect(() => validateCondition('tags', 'diferente')).toThrow(
        'Campo tags só suporta operadores contem/nao_contem'
      )
    })

    it('deve lançar erro quando estadoJornada usa operador contem', () => {
      expect(() => validateCondition('estadoJornada', 'contem')).toThrow(
        'Campo estadoJornada só suporta operadores igual/diferente'
      )
    })

    it('deve lançar erro quando origem usa operador nao_contem', () => {
      expect(() => validateCondition('origem', 'nao_contem')).toThrow(
        'Campo origem só suporta operadores igual/diferente'
      )
    })

    it('deve lançar erro quando idade usa operador contem', () => {
      expect(() => validateCondition('idade', 'contem')).toThrow(
        'Campo idade só suporta operadores igual/diferente'
      )
    })

    it('deve lançar erro quando instrumentoDesejado usa operador nao_contem', () => {
      expect(() => validateCondition('instrumentoDesejado', 'nao_contem')).toThrow(
        'Campo instrumentoDesejado só suporta operadores igual/diferente'
      )
    })

    it('não deve lançar erro para tags com operador contem', () => {
      expect(() => validateCondition('tags', 'contem')).not.toThrow()
    })

    it('não deve lançar erro para tags com operador nao_contem', () => {
      expect(() => validateCondition('tags', 'nao_contem')).not.toThrow()
    })

    it('não deve lançar erro para estadoJornada com operador igual', () => {
      expect(() => validateCondition('estadoJornada', 'igual')).not.toThrow()
    })
  })

  describe('evaluateCondition - campo tags', () => {
    it('deve retornar true quando contato contém a tag (operador contem)', () => {
      const condition = createCondition('tags', 'contem', 'vip')
      const contact = contactDataFactory.build({ tags: ['vip', 'ativo'] })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar true quando contato contém uma das tags (array)', () => {
      const condition = createCondition('tags', 'contem', ['premium', 'vip'])
      const contact = contactDataFactory.build({ tags: ['vip', 'ativo'] })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando contato não contém a tag', () => {
      const condition = createCondition('tags', 'contem', 'premium')
      const contact = contactDataFactory.build({ tags: ['vip', 'ativo'] })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar true quando contato não contém a tag (operador nao_contem)', () => {
      const condition = createCondition('tags', 'nao_contem', 'spam')
      const contact = contactDataFactory.build({ tags: ['vip', 'ativo'] })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando contato contém a tag (operador nao_contem)', () => {
      const condition = createCondition('tags', 'nao_contem', 'vip')
      const contact = contactDataFactory.build({ tags: ['vip', 'ativo'] })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve tratar contato sem tags como array vazio', () => {
      const condition = createCondition('tags', 'contem', 'vip')
      const contact: ContactData = { estadoJornada: 'inicial' }

      expect(evaluateCondition(condition, contact)).toBe(false)
    })
  })

  describe('evaluateCondition - campo estadoJornada', () => {
    it('deve retornar true quando estadoJornada é igual', () => {
      const condition = createCondition('estadoJornada', 'igual', 'qualificado')
      const contact = contactDataFactory.build({ estadoJornada: 'qualificado' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando estadoJornada não é igual', () => {
      const condition = createCondition('estadoJornada', 'igual', 'qualificado')
      const contact = contactDataFactory.build({ estadoJornada: 'inicial' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar true quando estadoJornada é diferente', () => {
      const condition = createCondition('estadoJornada', 'diferente', 'incompativel')
      const contact = contactDataFactory.build({ estadoJornada: 'qualificado' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve tratar estadoJornada undefined como string vazia', () => {
      const condition = createCondition('estadoJornada', 'igual', '')
      const contact: ContactData = {}

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })

  describe('evaluateCondition - campo origem', () => {
    it('deve retornar true quando origem é igual', () => {
      const condition = createCondition('origem', 'igual', 'organico')
      const contact = contactDataFactory.build({ origem: 'organico' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando origem não é igual', () => {
      const condition = createCondition('origem', 'igual', 'campanha')
      const contact = contactDataFactory.build({ origem: 'organico' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar true quando origem é diferente', () => {
      const condition = createCondition('origem', 'diferente', 'campanha')
      const contact = contactDataFactory.build({ origem: 'organico' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })

  describe('evaluateCondition - campo idade', () => {
    it('deve retornar true quando idade é igual (como string)', () => {
      const condition = createCondition('idade', 'igual', '18')
      const contact = contactDataFactory.build({ idade: 18 })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando idade não é igual', () => {
      const condition = createCondition('idade', 'igual', '18')
      const contact = contactDataFactory.build({ idade: 25 })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar true quando idade é diferente', () => {
      const condition = createCondition('idade', 'diferente', '10')
      const contact = contactDataFactory.build({ idade: 25 })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve tratar idade undefined como string vazia', () => {
      const condition = createCondition('idade', 'igual', '')
      const contact: ContactData = {}

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })

  describe('evaluateCondition - campo instrumentoDesejado', () => {
    it('deve retornar true quando instrumentoDesejado é igual', () => {
      const condition = createCondition('instrumentoDesejado', 'igual', 'saxofone')
      const contact = contactDataFactory.build({ instrumentoDesejado: 'saxofone' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })

    it('deve retornar false quando instrumentoDesejado não é igual', () => {
      const condition = createCondition('instrumentoDesejado', 'igual', 'piano')
      const contact = contactDataFactory.build({ instrumentoDesejado: 'saxofone' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar true quando instrumentoDesejado é diferente', () => {
      const condition = createCondition('instrumentoDesejado', 'diferente', 'piano')
      const contact = contactDataFactory.build({ instrumentoDesejado: 'saxofone' })

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })

  describe('evaluateCondition - edge cases', () => {
    it('deve retornar false para operador inválido em tags', () => {
      // Criando manualmente para simular caso edge
      const condition = { campo: 'tags' as const, operador: 'igual' as const, valor: 'vip' }
      const contact = contactDataFactory.build({ tags: ['vip'] })

      // O código retorna false para operador inválido
      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar false para operador inválido em estadoJornada', () => {
      // Criando manualmente para simular caso edge
      const condition = { campo: 'estadoJornada' as const, operador: 'contem' as const, valor: 'q' }
      const contact = contactDataFactory.build({ estadoJornada: 'qualificado' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar false para operador inválido em origem', () => {
      const condition = { campo: 'origem' as const, operador: 'contem' as const, valor: 'organico' }
      const contact = contactDataFactory.build({ origem: 'organico' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar false para operador inválido em idade', () => {
      const condition = { campo: 'idade' as const, operador: 'contem' as const, valor: '18' }
      const contact = contactDataFactory.build({ idade: 18 })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar false para operador inválido em instrumentoDesejado', () => {
      const condition = { campo: 'instrumentoDesejado' as const, operador: 'contem' as const, valor: 'saxofone' }
      const contact = contactDataFactory.build({ instrumentoDesejado: 'saxofone' })

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve retornar false para campo desconhecido', () => {
      // Simular campo desconhecido para testar default case
      const condition = { campo: 'campoInexistente' as 'tags', operador: 'igual' as const, valor: 'teste' }
      const contact = contactDataFactory.build()

      expect(evaluateCondition(condition, contact)).toBe(false)
    })

    it('deve tratar instrumentoDesejado undefined como string vazia', () => {
      const condition = createCondition('instrumentoDesejado', 'igual', '')
      const contact: ContactData = {}

      expect(evaluateCondition(condition, contact)).toBe(true)
    })
  })

  describe('evaluateAllConditions', () => {
    it('deve retornar true quando todas as condições são satisfeitas', () => {
      const conditions = [
        createCondition('estadoJornada', 'igual', 'qualificado'),
        createCondition('origem', 'igual', 'organico'),
      ]
      const contact = contactDataFactory.build({
        estadoJornada: 'qualificado',
        origem: 'organico',
      })

      expect(evaluateAllConditions(conditions, contact)).toBe(true)
    })

    it('deve retornar false quando uma condição não é satisfeita', () => {
      const conditions = [
        createCondition('estadoJornada', 'igual', 'qualificado'),
        createCondition('origem', 'igual', 'campanha'),
      ]
      const contact = contactDataFactory.build({
        estadoJornada: 'qualificado',
        origem: 'organico',
      })

      expect(evaluateAllConditions(conditions, contact)).toBe(false)
    })

    it('deve retornar true quando array de condições está vazio', () => {
      const contact = contactDataFactory.build()

      expect(evaluateAllConditions([], contact)).toBe(true)
    })

    it('deve retornar false quando nenhuma condição é satisfeita', () => {
      const conditions = [
        createCondition('estadoJornada', 'igual', 'incompativel'),
        createCondition('origem', 'igual', 'campanha'),
      ]
      const contact = contactDataFactory.build({
        estadoJornada: 'qualificado',
        origem: 'organico',
      })

      expect(evaluateAllConditions(conditions, contact)).toBe(false)
    })
  })

  describe('imutabilidade', () => {
    it('deve retornar objeto congelado (frozen)', () => {
      const condition = createCondition('estadoJornada', 'igual', 'qualificado')

      expect(Object.isFrozen(condition)).toBe(true)
    })
  })
})
