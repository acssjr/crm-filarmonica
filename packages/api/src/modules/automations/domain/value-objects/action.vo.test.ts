/**
 * Testes unitarios para Action Value Object
 * Testa criacao, validacao e funcoes auxiliares de acoes
 */

import { describe, it, expect } from 'vitest'
import {
  createAction,
  validateAction,
  isDelayAction,
  getDelayDays,
  type ActionTipo,
  type ActionConfig,
  type Action,
} from './action.vo.js'

describe('Action Value Object', () => {
  // ==================== createAction ====================
  describe('createAction', () => {
    // Testa criacao de cada tipo de acao
    it('should create enviar_mensagem action with mensagem', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Ola!' })

      expect(action.tipo).toBe('enviar_mensagem')
      expect(action.config.mensagem).toBe('Ola!')
    })

    it('should create enviar_template action with templateId', () => {
      const action = createAction('enviar_template', { templateId: 'template-123' })

      expect(action.tipo).toBe('enviar_template')
      expect(action.config.templateId).toBe('template-123')
    })

    it('should create adicionar_tag action with tagId', () => {
      const action = createAction('adicionar_tag', { tagId: 'tag-vip' })

      expect(action.tipo).toBe('adicionar_tag')
      expect(action.config.tagId).toBe('tag-vip')
    })

    it('should create remover_tag action with tagId', () => {
      const action = createAction('remover_tag', { tagId: 'tag-churned' })

      expect(action.tipo).toBe('remover_tag')
      expect(action.config.tagId).toBe('tag-churned')
    })

    it('should create mudar_jornada action with estado', () => {
      const action = createAction('mudar_jornada', { estado: 'matriculado' })

      expect(action.tipo).toBe('mudar_jornada')
      expect(action.config.estado).toBe('matriculado')
    })

    it('should create notificar_admin action with adminPhone and mensagem', () => {
      const action = createAction('notificar_admin', {
        adminPhone: '+5575999998888',
        mensagem: 'Novo contato VIP!',
      })

      expect(action.tipo).toBe('notificar_admin')
      expect(action.config.adminPhone).toBe('+5575999998888')
      expect(action.config.mensagem).toBe('Novo contato VIP!')
    })

    it('should create aguardar action with dias', () => {
      const action = createAction('aguardar', { dias: 3 })

      expect(action.tipo).toBe('aguardar')
      expect(action.config.dias).toBe(3)
    })

    // Testa que a acao e imutavel (frozen)
    it('should create an immutable (frozen) action object', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Test' })

      expect(Object.isFrozen(action)).toBe(true)
    })

    // Testa config padrao quando nao fornecida (deve falhar validacao)
    it('should use empty config when not provided (may fail validation)', () => {
      // Para tipos que nao requerem config, isso funcionaria
      // Mas todos os tipos atuais requerem algo na config
      expect(() => createAction('enviar_mensagem')).toThrow()
    })
  })

  // ==================== validateAction ====================
  describe('validateAction', () => {
    // Testes para enviar_mensagem
    describe('enviar_mensagem validation', () => {
      it('should not throw when mensagem is provided', () => {
        expect(() => validateAction('enviar_mensagem', { mensagem: 'Ola!' })).not.toThrow()
      })

      it('should throw when mensagem is missing', () => {
        expect(() => validateAction('enviar_mensagem', {})).toThrow(
          'Ação enviar_mensagem requer mensagem'
        )
      })

      it('should throw when mensagem is empty string', () => {
        expect(() => validateAction('enviar_mensagem', { mensagem: '' })).toThrow(
          'Ação enviar_mensagem requer mensagem'
        )
      })
    })

    // Testes para enviar_template
    describe('enviar_template validation', () => {
      it('should not throw when templateId is provided', () => {
        expect(() => validateAction('enviar_template', { templateId: 'tpl-1' })).not.toThrow()
      })

      it('should throw when templateId is missing', () => {
        expect(() => validateAction('enviar_template', {})).toThrow(
          'Ação enviar_template requer templateId'
        )
      })

      it('should throw when templateId is empty string', () => {
        expect(() => validateAction('enviar_template', { templateId: '' })).toThrow(
          'Ação enviar_template requer templateId'
        )
      })
    })

    // Testes para adicionar_tag
    describe('adicionar_tag validation', () => {
      it('should not throw when tagId is provided', () => {
        expect(() => validateAction('adicionar_tag', { tagId: 'tag-1' })).not.toThrow()
      })

      it('should throw when tagId is missing', () => {
        expect(() => validateAction('adicionar_tag', {})).toThrow(
          'Ação adicionar_tag requer tagId'
        )
      })

      it('should throw when tagId is empty string', () => {
        expect(() => validateAction('adicionar_tag', { tagId: '' })).toThrow(
          'Ação adicionar_tag requer tagId'
        )
      })
    })

    // Testes para remover_tag
    describe('remover_tag validation', () => {
      it('should not throw when tagId is provided', () => {
        expect(() => validateAction('remover_tag', { tagId: 'tag-1' })).not.toThrow()
      })

      it('should throw when tagId is missing', () => {
        expect(() => validateAction('remover_tag', {})).toThrow(
          'Ação remover_tag requer tagId'
        )
      })

      it('should throw when tagId is empty string', () => {
        expect(() => validateAction('remover_tag', { tagId: '' })).toThrow(
          'Ação remover_tag requer tagId'
        )
      })
    })

    // Testes para mudar_jornada
    describe('mudar_jornada validation', () => {
      it('should not throw when estado is provided', () => {
        expect(() => validateAction('mudar_jornada', { estado: 'matriculado' })).not.toThrow()
      })

      it('should throw when estado is missing', () => {
        expect(() => validateAction('mudar_jornada', {})).toThrow(
          'Ação mudar_jornada requer estado'
        )
      })

      it('should throw when estado is empty string', () => {
        expect(() => validateAction('mudar_jornada', { estado: '' })).toThrow(
          'Ação mudar_jornada requer estado'
        )
      })
    })

    // Testes para notificar_admin
    describe('notificar_admin validation', () => {
      it('should not throw when adminPhone and mensagem are provided', () => {
        expect(() =>
          validateAction('notificar_admin', {
            adminPhone: '+5575999998888',
            mensagem: 'Alerta!',
          })
        ).not.toThrow()
      })

      it('should throw when adminPhone is missing', () => {
        expect(() => validateAction('notificar_admin', { mensagem: 'Test' })).toThrow(
          'Ação notificar_admin requer adminPhone'
        )
      })

      it('should throw when mensagem is missing', () => {
        expect(() => validateAction('notificar_admin', { adminPhone: '+5575999998888' })).toThrow(
          'Ação notificar_admin requer mensagem'
        )
      })

      it('should throw when adminPhone is empty string', () => {
        expect(() =>
          validateAction('notificar_admin', { adminPhone: '', mensagem: 'Test' })
        ).toThrow('Ação notificar_admin requer adminPhone')
      })

      it('should throw when mensagem is empty string', () => {
        expect(() =>
          validateAction('notificar_admin', { adminPhone: '+5575999998888', mensagem: '' })
        ).toThrow('Ação notificar_admin requer mensagem')
      })

      it('should throw adminPhone error first when both are missing', () => {
        expect(() => validateAction('notificar_admin', {})).toThrow(
          'Ação notificar_admin requer adminPhone'
        )
      })
    })

    // Testes para aguardar
    describe('aguardar validation', () => {
      it('should not throw when dias >= 1', () => {
        expect(() => validateAction('aguardar', { dias: 1 })).not.toThrow()
        expect(() => validateAction('aguardar', { dias: 7 })).not.toThrow()
        expect(() => validateAction('aguardar', { dias: 365 })).not.toThrow()
      })

      it('should throw when dias is missing', () => {
        expect(() => validateAction('aguardar', {})).toThrow('Ação aguardar requer dias >= 1')
      })

      it('should throw when dias is 0', () => {
        expect(() => validateAction('aguardar', { dias: 0 })).toThrow(
          'Ação aguardar requer dias >= 1'
        )
      })

      it('should throw when dias is negative', () => {
        expect(() => validateAction('aguardar', { dias: -1 })).toThrow(
          'Ação aguardar requer dias >= 1'
        )
        expect(() => validateAction('aguardar', { dias: -10 })).toThrow(
          'Ação aguardar requer dias >= 1'
        )
      })
    })
  })

  // ==================== isDelayAction ====================
  describe('isDelayAction', () => {
    it('should return true for aguardar action', () => {
      const action = createAction('aguardar', { dias: 5 })

      expect(isDelayAction(action)).toBe(true)
    })

    it('should return false for enviar_mensagem action', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Test' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('should return false for enviar_template action', () => {
      const action = createAction('enviar_template', { templateId: 'tpl-1' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('should return false for adicionar_tag action', () => {
      const action = createAction('adicionar_tag', { tagId: 'tag-1' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('should return false for remover_tag action', () => {
      const action = createAction('remover_tag', { tagId: 'tag-1' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('should return false for mudar_jornada action', () => {
      const action = createAction('mudar_jornada', { estado: 'matriculado' })

      expect(isDelayAction(action)).toBe(false)
    })

    it('should return false for notificar_admin action', () => {
      const action = createAction('notificar_admin', {
        adminPhone: '+5575999998888',
        mensagem: 'Alert',
      })

      expect(isDelayAction(action)).toBe(false)
    })
  })

  // ==================== getDelayDays ====================
  describe('getDelayDays', () => {
    it('should return the number of days for aguardar action', () => {
      const action = createAction('aguardar', { dias: 7 })

      expect(getDelayDays(action)).toBe(7)
    })

    it('should return 1 for minimum valid aguardar action', () => {
      const action = createAction('aguardar', { dias: 1 })

      expect(getDelayDays(action)).toBe(1)
    })

    it('should return 0 for non-aguardar action', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Test' })

      expect(getDelayDays(action)).toBe(0)
    })

    it('should return 0 for all non-delay action types', () => {
      const actions = [
        createAction('enviar_mensagem', { mensagem: 'Test' }),
        createAction('enviar_template', { templateId: 'tpl-1' }),
        createAction('adicionar_tag', { tagId: 'tag-1' }),
        createAction('remover_tag', { tagId: 'tag-1' }),
        createAction('mudar_jornada', { estado: 'estado-1' }),
        createAction('notificar_admin', { adminPhone: '+5575999998888', mensagem: 'Test' }),
      ]

      actions.forEach(action => {
        expect(getDelayDays(action)).toBe(0)
      })
    })

    it('should return 0 if aguardar action somehow has undefined dias', () => {
      // Simulando caso edge onde dias e undefined (forcando tipo)
      const action = { tipo: 'aguardar', config: {} } as Action

      expect(getDelayDays(action)).toBe(0)
    })
  })

  // ==================== Edge Cases ====================
  describe('edge cases', () => {
    it('should handle action with multiple config properties', () => {
      // Mesmo que so um seja usado, outros podem estar presentes
      const action = createAction('enviar_mensagem', {
        mensagem: 'Ola!',
        templateId: 'ignored',
        tagId: 'also-ignored',
      })

      expect(action.config.mensagem).toBe('Ola!')
      expect(action.config.templateId).toBe('ignored')
    })

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(5000)
      const action = createAction('enviar_mensagem', { mensagem: longMessage })

      expect(action.config.mensagem).toBe(longMessage)
    })

    it('should handle special characters in mensagem', () => {
      const specialMessage = 'Ola! Como voce esta? \n\t Emojis: 🎵🎶'
      const action = createAction('enviar_mensagem', { mensagem: specialMessage })

      expect(action.config.mensagem).toBe(specialMessage)
    })

    it('should handle large dias value', () => {
      const action = createAction('aguardar', { dias: 365 * 10 })

      expect(action.config.dias).toBe(3650)
      expect(getDelayDays(action)).toBe(3650)
    })

    it('should preserve all config properties after freeze', () => {
      const config: ActionConfig = {
        mensagem: 'Test',
        templateId: 'tpl-1',
        tagId: 'tag-1',
        estado: 'estado-1',
        adminPhone: '+5575999998888',
        dias: 5,
      }
      const action = createAction('enviar_mensagem', config)

      expect(action.config).toEqual(config)
    })

    it('should freeze the action object itself', () => {
      const action = createAction('enviar_mensagem', { mensagem: 'Test' })

      // A acao em si deve estar congelada
      expect(Object.isFrozen(action)).toBe(true)

      // Tentar modificar deve falhar silenciosamente ou lancar erro em strict mode
      expect(() => {
        // @ts-expect-error - testando imutabilidade
        action.tipo = 'outra_acao'
      }).toThrow()
    })
  })
})
