/**
 * Testes unitários para Action Value Object
 * Testa: createAction, validateAction, isDelayAction, getDelayDays
 */

import { describe, it, expect } from 'vitest'
import {
  createAction,
  validateAction,
  isDelayAction,
  getDelayDays,
  type ActionTipo,
  type ActionConfig,
} from './action.vo.js'

describe('Action Value Object', () => {
  describe('createAction', () => {
    it('deve criar action enviar_mensagem com mensagem válida', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Olá!' })

      expect(action.tipo).toBe('enviar_mensagem')
      expect(action.config.mensagem).toBe('Olá!')
      expect(Object.isFrozen(action)).toBe(true)
    })

    it('deve criar action enviar_template com templateId válido', () => {
      const action = createAction('enviar_template', { templateId: 'tmpl-123' })

      expect(action.tipo).toBe('enviar_template')
      expect(action.config.templateId).toBe('tmpl-123')
    })

    it('deve criar action adicionar_tag com tagId válido', () => {
      const action = createAction('adicionar_tag', { tagId: 'tag-456' })

      expect(action.tipo).toBe('adicionar_tag')
      expect(action.config.tagId).toBe('tag-456')
    })

    it('deve criar action remover_tag com tagId válido', () => {
      const action = createAction('remover_tag', { tagId: 'tag-789' })

      expect(action.tipo).toBe('remover_tag')
      expect(action.config.tagId).toBe('tag-789')
    })

    it('deve criar action mudar_jornada com estado válido', () => {
      const action = createAction('mudar_jornada', { estado: 'qualificado' })

      expect(action.tipo).toBe('mudar_jornada')
      expect(action.config.estado).toBe('qualificado')
    })

    it('deve criar action notificar_admin com adminPhone e mensagem', () => {
      const action = createAction('notificar_admin', {
        adminPhone: '5575999999999',
        mensagem: 'Novo lead!',
      })

      expect(action.tipo).toBe('notificar_admin')
      expect(action.config.adminPhone).toBe('5575999999999')
      expect(action.config.mensagem).toBe('Novo lead!')
    })

    it('deve criar action aguardar com dias válido', () => {
      const action = createAction('aguardar', { dias: 3 })

      expect(action.tipo).toBe('aguardar')
      expect(action.config.dias).toBe(3)
    })
  })

  describe('validateAction - casos de erro', () => {
    it('deve lançar erro quando enviar_mensagem não tem mensagem', () => {
      expect(() => validateAction('enviar_mensagem', {})).toThrow(
        'Ação enviar_mensagem requer mensagem'
      )
    })

    it('deve lançar erro quando enviar_template não tem templateId', () => {
      expect(() => validateAction('enviar_template', {})).toThrow(
        'Ação enviar_template requer templateId'
      )
    })

    it('deve lançar erro quando adicionar_tag não tem tagId', () => {
      expect(() => validateAction('adicionar_tag', {})).toThrow(
        'Ação adicionar_tag requer tagId'
      )
    })

    it('deve lançar erro quando remover_tag não tem tagId', () => {
      expect(() => validateAction('remover_tag', {})).toThrow(
        'Ação remover_tag requer tagId'
      )
    })

    it('deve lançar erro quando mudar_jornada não tem estado', () => {
      expect(() => validateAction('mudar_jornada', {})).toThrow(
        'Ação mudar_jornada requer estado'
      )
    })

    it('deve lançar erro quando notificar_admin não tem adminPhone', () => {
      expect(() => validateAction('notificar_admin', { mensagem: 'Teste' })).toThrow(
        'Ação notificar_admin requer adminPhone'
      )
    })

    it('deve lançar erro quando notificar_admin não tem mensagem', () => {
      expect(() =>
        validateAction('notificar_admin', { adminPhone: '5575999999999' })
      ).toThrow('Ação notificar_admin requer mensagem')
    })

    it('deve lançar erro quando aguardar não tem dias', () => {
      expect(() => validateAction('aguardar', {})).toThrow(
        'Ação aguardar requer dias >= 1'
      )
    })

    it('deve lançar erro quando aguardar tem dias menor que 1', () => {
      expect(() => validateAction('aguardar', { dias: 0 })).toThrow(
        'Ação aguardar requer dias >= 1'
      )
    })

    it('deve lançar erro quando aguardar tem dias negativo', () => {
      expect(() => validateAction('aguardar', { dias: -1 })).toThrow(
        'Ação aguardar requer dias >= 1'
      )
    })
  })

  describe('isDelayAction', () => {
    it('deve retornar true para action aguardar', () => {
      const action = createAction('aguardar', { dias: 1 })

      expect(isDelayAction(action)).toBe(true)
    })

    it('deve retornar false para action enviar_mensagem', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Olá!' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('deve retornar false para action enviar_template', () => {
      const action = createAction('enviar_template', { templateId: 'tmpl-123' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('deve retornar false para action adicionar_tag', () => {
      const action = createAction('adicionar_tag', { tagId: 'tag-123' })

      expect(isDelayAction(action)).toBe(false)
    })
  })

  describe('getDelayDays', () => {
    it('deve retornar dias para action aguardar', () => {
      const action = createAction('aguardar', { dias: 5 })

      expect(getDelayDays(action)).toBe(5)
    })

    it('deve retornar 0 para action que não é aguardar', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Olá!' })

      expect(getDelayDays(action)).toBe(0)
    })

    it('deve retornar 0 quando action aguardar não tem dias definido', () => {
      // Criando manualmente para simular caso edge
      const action = { tipo: 'aguardar' as ActionTipo, config: {} as ActionConfig }

      expect(getDelayDays(action)).toBe(0)
    })
  })

  describe('imutabilidade', () => {
    it('deve retornar objeto congelado (frozen)', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Olá!' })

      expect(Object.isFrozen(action)).toBe(true)
    })

    it('não deve permitir modificação do tipo', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Olá!' })

      expect(() => {
        // @ts-expect-error - tentando modificar propriedade readonly
        action.tipo = 'aguardar'
      }).toThrow()
    })
  })
})
