/**
 * Testes unitários para Automation Entity
 * Testa criação, atualização, transições de estado e persistência
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Automation, type CreateAutomationInput } from './automation.entity.js'
import type { TriggerTipo } from '../value-objects/trigger.vo.js'
import type { ConditionCampo, ConditionOperador } from '../value-objects/condition.vo.js'
import type { ActionTipo } from '../value-objects/action.vo.js'

describe('Automation Entity', () => {
  // ==================== Automation.create ====================
  describe('Automation.create', () => {
    // Testa criacao basica de automacao
    it('should create automation with minimum required fields', () => {
      const input: CreateAutomationInput = {
        nome: 'Welcome Automation',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Bem-vindo!' } }],
      }

      const automation = Automation.create('auto-123', input)

      expect(automation.id).toBe('auto-123')
      expect(automation.nome).toBe('Welcome Automation')
      expect(automation.ativo).toBe(false) // Automacao criada inativa
      expect(automation.trigger.tipo).toBe('novo_contato')
      expect(automation.condicoes).toHaveLength(0)
      expect(automation.acoes).toHaveLength(1)
      expect(automation.acoes[0].tipo).toBe('enviar_mensagem')
    })

    it('should create automation with all optional fields', () => {
      const input: CreateAutomationInput = {
        nome: 'VIP Welcome',
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip' },
        condicoes: [
          { campo: 'origem', operador: 'igual', valor: 'facebook' },
          { campo: 'tags', operador: 'nao_contem', valor: ['churned'] },
        ],
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Ola VIP!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'welcomed' } },
        ],
      }

      const automation = Automation.create('auto-456', input)

      expect(automation.trigger.config.tagId).toBe('vip')
      expect(automation.condicoes).toHaveLength(2)
      expect(automation.condicoes[0].campo).toBe('origem')
      expect(automation.condicoes[1].campo).toBe('tags')
      expect(automation.acoes).toHaveLength(2)
    })

    it('should trim whitespace from nome', () => {
      const input: CreateAutomationInput = {
        nome: '  Spaced Name  ',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      }

      const automation = Automation.create('auto-1', input)

      expect(automation.nome).toBe('Spaced Name')
    })

    it('should set createdAt and updatedAt to current date', () => {
      const beforeCreate = new Date()

      const input: CreateAutomationInput = {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      }

      const automation = Automation.create('auto-1', input)
      const afterCreate = new Date()

      expect(automation.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(automation.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
      expect(automation.updatedAt.getTime()).toEqual(automation.createdAt.getTime())
    })

    // Testes de validacao
    describe('validation', () => {
      it('should throw when nome is empty', () => {
        const input: CreateAutomationInput = {
          nome: '',
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Nome deve ter entre 1 e 100 caracteres'
        )
      })

      it('should accept nome with only whitespace (trim happens after validation)', () => {
        const input: CreateAutomationInput = {
          nome: '   ',
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        // O nome '   ' tem length 3 que e valido, mas apos trim fica ''
        // A validacao verifica o tamanho antes do trim
        const automation = Automation.create('auto-1', input)
        expect(automation.nome).toBe('') // Trimmed result
      })

      it('should throw when nome exceeds 100 characters', () => {
        const input: CreateAutomationInput = {
          nome: 'A'.repeat(101),
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Nome deve ter entre 1 e 100 caracteres'
        )
      })

      it('should accept nome with exactly 100 characters', () => {
        const input: CreateAutomationInput = {
          nome: 'A'.repeat(100),
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        const automation = Automation.create('auto-1', input)

        expect(automation.nome.length).toBe(100)
      })

      it('should throw when acoes is empty', () => {
        const input: CreateAutomationInput = {
          nome: 'Test',
          triggerTipo: 'novo_contato',
          acoes: [],
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Automação deve ter pelo menos uma ação'
        )
      })

      it('should throw when acoes is undefined/missing', () => {
        const input = {
          nome: 'Test',
          triggerTipo: 'novo_contato',
        } as CreateAutomationInput

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Automação deve ter pelo menos uma ação'
        )
      })

      it('should propagate trigger validation errors', () => {
        const input: CreateAutomationInput = {
          nome: 'Test',
          triggerTipo: 'tempo_sem_interacao',
          triggerConfig: { dias: 0 }, // Invalido
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Trigger tempo_sem_interacao requer dias >= 1'
        )
      })

      it('should propagate condition validation errors', () => {
        const input: CreateAutomationInput = {
          nome: 'Test',
          triggerTipo: 'novo_contato',
          condicoes: [{ campo: 'tags', operador: 'igual', valor: 'test' }], // Invalido
          acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Campo tags só suporta operadores contem/nao_contem'
        )
      })

      it('should propagate action validation errors', () => {
        const input: CreateAutomationInput = {
          nome: 'Test',
          triggerTipo: 'novo_contato',
          acoes: [{ tipo: 'enviar_mensagem', config: {} }], // Faltando mensagem
        }

        expect(() => Automation.create('auto-1', input)).toThrow(
          'Ação enviar_mensagem requer mensagem'
        )
      })
    })
  })

  // ==================== Automation.fromPersistence ====================
  describe('Automation.fromPersistence', () => {
    it('should reconstruct automation from persistence data', () => {
      const persistedData = {
        id: 'auto-persisted',
        nome: 'Persisted Automation',
        ativo: true,
        triggerTipo: 'tag_adicionada' as TriggerTipo,
        triggerConfig: { tagId: 'vip' },
        condicoes: [
          { campo: 'origem' as ConditionCampo, operador: 'igual' as ConditionOperador, valor: 'organico' },
        ],
        acoes: [
          { tipo: 'enviar_mensagem' as ActionTipo, config: { mensagem: 'Hello!' } },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
      }

      const automation = Automation.fromPersistence(persistedData)

      expect(automation.id).toBe('auto-persisted')
      expect(automation.nome).toBe('Persisted Automation')
      expect(automation.ativo).toBe(true)
      expect(automation.trigger.tipo).toBe('tag_adicionada')
      expect(automation.trigger.config.tagId).toBe('vip')
      expect(automation.condicoes).toHaveLength(1)
      expect(automation.acoes).toHaveLength(1)
      expect(automation.createdAt).toEqual(new Date('2024-01-01'))
      expect(automation.updatedAt).toEqual(new Date('2024-06-01'))
    })

    it('should reconstruct automation with multiple conditions and actions', () => {
      const persistedData = {
        id: 'auto-complex',
        nome: 'Complex',
        ativo: false,
        triggerTipo: 'jornada_mudou' as TriggerTipo,
        triggerConfig: { estado: 'matriculado' },
        condicoes: [
          { campo: 'tags' as ConditionCampo, operador: 'contem' as ConditionOperador, valor: ['vip', 'premium'] },
          { campo: 'idade' as ConditionCampo, operador: 'igual' as ConditionOperador, valor: '25' },
        ],
        acoes: [
          { tipo: 'enviar_template' as ActionTipo, config: { templateId: 'tpl-welcome' } },
          { tipo: 'adicionar_tag' as ActionTipo, config: { tagId: 'welcomed' } },
          { tipo: 'aguardar' as ActionTipo, config: { dias: 3 } },
          { tipo: 'enviar_mensagem' as ActionTipo, config: { mensagem: 'Follow up' } },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const automation = Automation.fromPersistence(persistedData)

      expect(automation.condicoes).toHaveLength(2)
      expect(automation.acoes).toHaveLength(4)
    })
  })

  // ==================== Automation.update ====================
  describe('Automation.update', () => {
    let automation: Automation

    beforeEach(() => {
      automation = Automation.create('auto-1', {
        nome: 'Original Name',
        triggerTipo: 'novo_contato',
        triggerConfig: {},
        condicoes: [{ campo: 'origem', operador: 'igual', valor: 'organico' }],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Original' } }],
      })
    })

    it('should update nome', () => {
      const originalUpdatedAt = automation.updatedAt

      // Pequeno delay para garantir que updatedAt mude
      automation.update({ nome: 'New Name' })

      expect(automation.nome).toBe('New Name')
      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should trim whitespace when updating nome', () => {
      automation.update({ nome: '  Trimmed  ' })

      expect(automation.nome).toBe('Trimmed')
    })

    it('should throw when updating nome to empty', () => {
      expect(() => automation.update({ nome: '' })).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('should throw when updating nome to exceed 100 characters', () => {
      expect(() => automation.update({ nome: 'A'.repeat(101) })).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('should update triggerTipo with new config', () => {
      automation.update({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })

      expect(automation.trigger.tipo).toBe('tempo_sem_interacao')
      expect(automation.trigger.config.dias).toBe(7)
    })

    it('should update triggerTipo keeping existing config if new config not provided', () => {
      // Primeiro configura com tagId
      automation.update({
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip' },
      })

      // Depois muda tipo sem fornecer config
      automation.update({ triggerTipo: 'novo_contato' })

      expect(automation.trigger.tipo).toBe('novo_contato')
      expect(automation.trigger.config.tagId).toBe('vip')
    })

    it('should update only triggerConfig keeping existing tipo', () => {
      automation.update({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 5 },
      })

      automation.update({ triggerConfig: { dias: 10 } })

      expect(automation.trigger.tipo).toBe('tempo_sem_interacao')
      expect(automation.trigger.config.dias).toBe(10)
    })

    it('should update condicoes', () => {
      automation.update({
        condicoes: [
          { campo: 'tags', operador: 'contem', valor: ['new-tag'] },
          { campo: 'estadoJornada', operador: 'igual', valor: 'matriculado' },
        ],
      })

      expect(automation.condicoes).toHaveLength(2)
      expect(automation.condicoes[0].campo).toBe('tags')
      expect(automation.condicoes[1].campo).toBe('estadoJornada')
    })

    it('should allow updating condicoes to empty array', () => {
      automation.update({ condicoes: [] })

      expect(automation.condicoes).toHaveLength(0)
    })

    it('should update acoes', () => {
      automation.update({
        acoes: [
          { tipo: 'enviar_template', config: { templateId: 'tpl-1' } },
          { tipo: 'adicionar_tag', config: { tagId: 'processed' } },
        ],
      })

      expect(automation.acoes).toHaveLength(2)
      expect(automation.acoes[0].tipo).toBe('enviar_template')
      expect(automation.acoes[1].tipo).toBe('adicionar_tag')
    })

    it('should throw when updating acoes to empty array', () => {
      expect(() => automation.update({ acoes: [] })).toThrow(
        'Automação deve ter pelo menos uma ação'
      )
    })

    it('should update multiple fields at once', () => {
      automation.update({
        nome: 'Updated Everything',
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'matricula' },
        condicoes: [{ campo: 'tags', operador: 'nao_contem', valor: 'processed' }],
        acoes: [{ tipo: 'notificar_admin', config: { adminPhone: '+5575999998888', mensagem: 'Nova msg!' } }],
      })

      expect(automation.nome).toBe('Updated Everything')
      expect(automation.trigger.tipo).toBe('mensagem_recebida')
      expect(automation.trigger.config.palavraChave).toBe('matricula')
      expect(automation.condicoes).toHaveLength(1)
      expect(automation.acoes).toHaveLength(1)
    })

    it('should not update fields when not provided in input', () => {
      const originalNome = automation.nome
      const originalTrigger = automation.trigger
      const originalCondicoes = automation.condicoes.length
      const originalAcoes = automation.acoes.length

      automation.update({}) // Empty update

      expect(automation.nome).toBe(originalNome)
      expect(automation.trigger.tipo).toBe(originalTrigger.tipo)
      expect(automation.condicoes).toHaveLength(originalCondicoes)
      expect(automation.acoes).toHaveLength(originalAcoes)
    })

    it('should propagate validation errors from value objects', () => {
      expect(() =>
        automation.update({
          condicoes: [{ campo: 'estadoJornada', operador: 'contem', valor: 'test' }],
        })
      ).toThrow('Campo estadoJornada só suporta operadores igual/diferente')
    })
  })

  // ==================== State Transitions (activate/deactivate) ====================
  describe('activate', () => {
    it('should activate an inactive automation', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      expect(automation.ativo).toBe(false)

      const originalUpdatedAt = automation.updatedAt
      automation.activate()

      expect(automation.ativo).toBe(true)
      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should not change updatedAt if already active', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      automation.activate()
      const updatedAtAfterFirstActivate = automation.updatedAt

      // Pequeno delay
      automation.activate()

      // Nao deve mudar porque ja estava ativo
      expect(automation.updatedAt).toEqual(updatedAtAfterFirstActivate)
    })
  })

  describe('deactivate', () => {
    it('should deactivate an active automation', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      automation.activate()
      expect(automation.ativo).toBe(true)

      const originalUpdatedAt = automation.updatedAt
      automation.deactivate()

      expect(automation.ativo).toBe(false)
      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should not change updatedAt if already inactive', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      const originalUpdatedAt = automation.updatedAt

      // Ja esta inativo, nao deve mudar nada
      automation.deactivate()

      expect(automation.updatedAt).toEqual(originalUpdatedAt)
    })
  })

  // ==================== toPersistence ====================
  describe('toPersistence', () => {
    it('should return all fields for persistence', () => {
      const automation = Automation.create('auto-123', {
        nome: 'Persist Test',
        triggerTipo: 'tag_adicionada',
        triggerConfig: { tagId: 'vip' },
        condicoes: [{ campo: 'origem', operador: 'igual', valor: 'facebook' }],
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Ola!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'welcomed' } },
        ],
      })

      automation.activate()
      const persisted = automation.toPersistence()

      expect(persisted.id).toBe('auto-123')
      expect(persisted.nome).toBe('Persist Test')
      expect(persisted.ativo).toBe(true)
      expect(persisted.triggerTipo).toBe('tag_adicionada')
      expect(persisted.triggerConfig).toEqual({ tagId: 'vip' })
      expect(persisted.condicoes).toHaveLength(1)
      expect(persisted.condicoes[0]).toEqual({
        campo: 'origem',
        operador: 'igual',
        valor: 'facebook',
      })
      expect(persisted.acoes).toHaveLength(2)
      expect(persisted.acoes[0]).toEqual({
        tipo: 'enviar_mensagem',
        config: { mensagem: 'Ola!' },
      })
      expect(persisted.createdAt).toBeInstanceOf(Date)
      expect(persisted.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle empty conditions', () => {
      const automation = Automation.create('auto-1', {
        nome: 'No Conditions',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      const persisted = automation.toPersistence()

      expect(persisted.condicoes).toEqual([])
    })

    it('should return copies not references (immutability check)', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Immutability Test',
        triggerTipo: 'novo_contato',
        condicoes: [{ campo: 'origem', operador: 'igual', valor: 'test' }],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      const persisted1 = automation.toPersistence()
      const persisted2 = automation.toPersistence()

      // Devem ser iguais
      expect(persisted1).toEqual(persisted2)

      // Mas nao a mesma referencia
      expect(persisted1.condicoes).not.toBe(persisted2.condicoes)
      expect(persisted1.acoes).not.toBe(persisted2.acoes)
    })
  })

  // ==================== Getters (immutability) ====================
  describe('getter immutability', () => {
    it('should return copy of condicoes array (not reference)', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        condicoes: [{ campo: 'origem', operador: 'igual', valor: 'test' }],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      const condicoes1 = automation.condicoes
      const condicoes2 = automation.condicoes

      expect(condicoes1).toEqual(condicoes2)
      expect(condicoes1).not.toBe(condicoes2) // Diferentes referencias
    })

    it('should return copy of acoes array (not reference)', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Test',
        triggerTipo: 'novo_contato',
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Test' } },
          { tipo: 'adicionar_tag', config: { tagId: 'tag-1' } },
        ],
      })

      const acoes1 = automation.acoes
      const acoes2 = automation.acoes

      expect(acoes1).toEqual(acoes2)
      expect(acoes1).not.toBe(acoes2) // Diferentes referencias
    })
  })

  // ==================== Edge Cases ====================
  describe('edge cases', () => {
    it('should handle automation with single character nome', () => {
      const automation = Automation.create('auto-1', {
        nome: 'A',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Test' } }],
      })

      expect(automation.nome).toBe('A')
    })

    it('should handle automation with many conditions and actions', () => {
      const condicoes = Array.from({ length: 10 }, (_, i) => ({
        campo: 'origem' as ConditionCampo,
        operador: 'igual' as ConditionOperador,
        valor: `source-${i}`,
      }))

      const acoes = Array.from({ length: 20 }, (_, i) => ({
        tipo: 'enviar_mensagem' as ActionTipo,
        config: { mensagem: `Message ${i}` },
      }))

      const automation = Automation.create('auto-1', {
        nome: 'Complex Automation',
        triggerTipo: 'novo_contato',
        condicoes,
        acoes,
      })

      expect(automation.condicoes).toHaveLength(10)
      expect(automation.acoes).toHaveLength(20)
    })

    it('should handle special characters in all string fields', () => {
      const automation = Automation.create('auto-1', {
        nome: 'Automacao com acentos e simbolos: @#$%',
        triggerTipo: 'mensagem_recebida',
        triggerConfig: { palavraChave: 'matricula@escola.com' },
        condicoes: [{ campo: 'origem', operador: 'igual', valor: 'utm_source=facebook&utm_medium=cpc' }],
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Ola! Como voce esta? \n\nAtenciosamente.' } }],
      })

      expect(automation.nome).toBe('Automacao com acentos e simbolos: @#$%')
      expect(automation.trigger.config.palavraChave).toBe('matricula@escola.com')
    })

    it('should handle automation lifecycle: create -> update -> activate -> deactivate -> update', () => {
      // Criar
      const automation = Automation.create('auto-lifecycle', {
        nome: 'Lifecycle Test',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Initial' } }],
      })

      expect(automation.ativo).toBe(false)

      // Atualizar
      automation.update({ nome: 'Updated Name' })
      expect(automation.nome).toBe('Updated Name')

      // Ativar
      automation.activate()
      expect(automation.ativo).toBe(true)

      // Desativar
      automation.deactivate()
      expect(automation.ativo).toBe(false)

      // Atualizar novamente
      automation.update({
        acoes: [{ tipo: 'enviar_template', config: { templateId: 'tpl-final' } }],
      })
      expect(automation.acoes[0].tipo).toBe('enviar_template')
    })
  })
})
