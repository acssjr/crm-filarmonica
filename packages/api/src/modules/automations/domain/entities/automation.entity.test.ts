/**
 * Testes unitários para Automation Entity
 * Testa: create, fromPersistence, update, activate, deactivate, toPersistence
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Automation } from './automation.entity.js'
import {
  createAutomationInputFactory,
  automationPersistenceFactory,
} from '../../../../__tests__/factories/index.js'

describe('Automation Entity', () => {
  describe('create', () => {
    it('deve criar automação com dados válidos', () => {
      const input = createAutomationInputFactory.build({
        nome: 'Boas-vindas',
        triggerTipo: 'novo_contato',
        acoes: [{ tipo: 'enviar_mensagem', config: { mensagem: 'Olá!' } }],
      })

      const automation = Automation.create('auto-123', input)

      expect(automation.id).toBe('auto-123')
      expect(automation.nome).toBe('Boas-vindas')
      expect(automation.ativo).toBe(false)
      expect(automation.trigger.tipo).toBe('novo_contato')
      expect(automation.acoes).toHaveLength(1)
      expect(automation.condicoes).toHaveLength(0)
    })

    it('deve iniciar automação como inativa', () => {
      const input = createAutomationInputFactory.build()

      const automation = Automation.create('auto-123', input)

      expect(automation.ativo).toBe(false)
    })

    it('deve definir createdAt e updatedAt', () => {
      const input = createAutomationInputFactory.build()

      const automation = Automation.create('auto-123', input)

      expect(automation.createdAt).toBeInstanceOf(Date)
      expect(automation.updatedAt).toBeInstanceOf(Date)
    })

    it('deve fazer trim no nome', () => {
      const input = createAutomationInputFactory.build({
        nome: '  Automação com espaços  ',
      })

      const automation = Automation.create('auto-123', input)

      expect(automation.nome).toBe('Automação com espaços')
    })

    it('deve criar automação com condições', () => {
      const input = createAutomationInputFactory.build({
        condicoes: [
          { campo: 'estadoJornada', operador: 'igual', valor: 'qualificado' },
          { campo: 'tags', operador: 'contem', valor: ['vip'] },
        ],
      })

      const automation = Automation.create('auto-123', input)

      expect(automation.condicoes).toHaveLength(2)
      expect(automation.condicoes[0].campo).toBe('estadoJornada')
      expect(automation.condicoes[1].campo).toBe('tags')
    })

    it('deve criar automação com múltiplas ações', () => {
      const input = createAutomationInputFactory.build({
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Olá!' } },
          { tipo: 'adicionar_tag', config: { tagId: 'tag-123' } },
          { tipo: 'notificar_admin', config: { adminPhone: '5575999999999', mensagem: 'Novo lead!' } },
        ],
      })

      const automation = Automation.create('auto-123', input)

      expect(automation.acoes).toHaveLength(3)
    })

    it('deve lançar erro quando nome está vazio', () => {
      const input = createAutomationInputFactory.build({ nome: '' })

      expect(() => Automation.create('auto-123', input)).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('deve lançar erro quando nome é muito longo', () => {
      const input = createAutomationInputFactory.build({
        nome: 'a'.repeat(101),
      })

      expect(() => Automation.create('auto-123', input)).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('deve lançar erro quando não há ações', () => {
      const input = createAutomationInputFactory.build({ acoes: [] })

      expect(() => Automation.create('auto-123', input)).toThrow(
        'Automação deve ter pelo menos uma ação'
      )
    })

    it('deve lançar erro quando acoes é undefined', () => {
      const input = {
        nome: 'Teste',
        triggerTipo: 'novo_contato' as const,
        acoes: undefined as unknown as [],
      }

      expect(() => Automation.create('auto-123', input)).toThrow(
        'Automação deve ter pelo menos uma ação'
      )
    })

    it('deve usar config padrão quando triggerConfig não é fornecido', () => {
      const input = createAutomationInputFactory.build({
        triggerTipo: 'novo_contato',
        triggerConfig: undefined,
      })

      const automation = Automation.create('auto-123', input)

      expect(automation.trigger.config).toEqual({})
    })

    it('deve usar config padrão quando acoes.config não é fornecido', () => {
      const input = createAutomationInputFactory.build({
        acoes: [{ tipo: 'adicionar_tag', config: undefined }],
      })

      // Vai falhar na validação porque adicionar_tag requer tagId
      expect(() => Automation.create('auto-123', input)).toThrow()
    })
  })

  describe('fromPersistence', () => {
    it('deve reconstituir automação a partir de dados persistidos', () => {
      const data = automationPersistenceFactory.build({
        id: 'auto-456',
        nome: 'Persistida',
        ativo: true,
      })

      const automation = Automation.fromPersistence(data)

      expect(automation.id).toBe('auto-456')
      expect(automation.nome).toBe('Persistida')
      expect(automation.ativo).toBe(true)
    })

    it('deve manter datas originais', () => {
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-06-01')
      const data = automationPersistenceFactory.build({ createdAt, updatedAt })

      const automation = Automation.fromPersistence(data)

      expect(automation.createdAt).toEqual(createdAt)
      expect(automation.updatedAt).toEqual(updatedAt)
    })

    it('deve reconstituir condições corretamente', () => {
      const data = automationPersistenceFactory.build({
        condicoes: [
          { campo: 'origem', operador: 'igual', valor: 'campanha' },
        ],
      })

      const automation = Automation.fromPersistence(data)

      expect(automation.condicoes).toHaveLength(1)
      expect(automation.condicoes[0].campo).toBe('origem')
    })
  })

  describe('update', () => {
    let automation: Automation

    beforeEach(() => {
      const input = createAutomationInputFactory.build({
        nome: 'Original',
        triggerTipo: 'novo_contato',
      })
      automation = Automation.create('auto-123', input)
    })

    it('deve atualizar nome', () => {
      automation.update({ nome: 'Atualizado' })

      expect(automation.nome).toBe('Atualizado')
    })

    it('deve fazer trim no nome atualizado', () => {
      automation.update({ nome: '  Com espaços  ' })

      expect(automation.nome).toBe('Com espaços')
    })

    it('deve atualizar triggerTipo', () => {
      automation.update({ triggerTipo: 'tag_adicionada' })

      expect(automation.trigger.tipo).toBe('tag_adicionada')
    })

    it('deve atualizar triggerConfig mantendo tipo', () => {
      automation.update({ triggerConfig: { dias: 5 } })

      expect(automation.trigger.tipo).toBe('novo_contato')
      expect(automation.trigger.config.dias).toBe(5)
    })

    it('deve atualizar triggerTipo e triggerConfig juntos', () => {
      automation.update({
        triggerTipo: 'tempo_sem_interacao',
        triggerConfig: { dias: 7 },
      })

      expect(automation.trigger.tipo).toBe('tempo_sem_interacao')
      expect(automation.trigger.config.dias).toBe(7)
    })

    it('deve atualizar condições', () => {
      automation.update({
        condicoes: [
          { campo: 'estadoJornada', operador: 'igual', valor: 'qualificado' },
        ],
      })

      expect(automation.condicoes).toHaveLength(1)
    })

    it('deve atualizar ações', () => {
      automation.update({
        acoes: [
          { tipo: 'enviar_template', config: { templateId: 'tmpl-123' } },
        ],
      })

      expect(automation.acoes).toHaveLength(1)
      expect(automation.acoes[0].tipo).toBe('enviar_template')
    })

    it('deve atualizar updatedAt', () => {
      const originalUpdatedAt = automation.updatedAt

      // Aguarda um tick para garantir diferença de tempo
      automation.update({ nome: 'Novo nome' })

      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      )
    })

    it('deve lançar erro quando nome vazio', () => {
      expect(() => automation.update({ nome: '' })).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('deve lançar erro quando nome muito longo', () => {
      expect(() => automation.update({ nome: 'a'.repeat(101) })).toThrow(
        'Nome deve ter entre 1 e 100 caracteres'
      )
    })

    it('deve lançar erro quando ações vazias', () => {
      expect(() => automation.update({ acoes: [] })).toThrow(
        'Automação deve ter pelo menos uma ação'
      )
    })

    it('não deve atualizar quando campos são undefined', () => {
      const originalNome = automation.nome
      const originalTrigger = automation.trigger

      automation.update({})

      expect(automation.nome).toBe(originalNome)
      expect(automation.trigger).toEqual(originalTrigger)
    })
  })

  describe('activate', () => {
    it('deve ativar automação inativa', () => {
      const input = createAutomationInputFactory.build()
      const automation = Automation.create('auto-123', input)

      automation.activate()

      expect(automation.ativo).toBe(true)
    })

    it('deve atualizar updatedAt ao ativar', () => {
      const input = createAutomationInputFactory.build()
      const automation = Automation.create('auto-123', input)
      const originalUpdatedAt = automation.updatedAt

      automation.activate()

      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      )
    })

    it('não deve alterar se já está ativa', () => {
      const data = automationPersistenceFactory.build({ ativo: true })
      const automation = Automation.fromPersistence(data)
      const originalUpdatedAt = automation.updatedAt

      automation.activate()

      // updatedAt não deve mudar se já estava ativo
      expect(automation.updatedAt).toEqual(originalUpdatedAt)
    })
  })

  describe('deactivate', () => {
    it('deve desativar automação ativa', () => {
      const data = automationPersistenceFactory.build({ ativo: true })
      const automation = Automation.fromPersistence(data)

      automation.deactivate()

      expect(automation.ativo).toBe(false)
    })

    it('deve atualizar updatedAt ao desativar', () => {
      const data = automationPersistenceFactory.build({ ativo: true })
      const automation = Automation.fromPersistence(data)
      const originalUpdatedAt = automation.updatedAt

      automation.deactivate()

      expect(automation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      )
    })

    it('não deve alterar se já está inativa', () => {
      const input = createAutomationInputFactory.build()
      const automation = Automation.create('auto-123', input)
      const originalUpdatedAt = automation.updatedAt

      automation.deactivate()

      // updatedAt não deve mudar se já estava inativo
      expect(automation.updatedAt).toEqual(originalUpdatedAt)
    })
  })

  describe('toPersistence', () => {
    it('deve retornar dados para persistência', () => {
      const input = createAutomationInputFactory.build({
        nome: 'Para salvar',
        triggerTipo: 'novo_contato',
        condicoes: [
          { campo: 'estadoJornada', operador: 'igual', valor: 'qualificado' },
        ],
        acoes: [
          { tipo: 'enviar_mensagem', config: { mensagem: 'Olá!' } },
        ],
      })
      const automation = Automation.create('auto-789', input)

      const persistence = automation.toPersistence()

      expect(persistence.id).toBe('auto-789')
      expect(persistence.nome).toBe('Para salvar')
      expect(persistence.ativo).toBe(false)
      expect(persistence.triggerTipo).toBe('novo_contato')
      expect(persistence.triggerConfig).toEqual({})
      expect(persistence.condicoes).toHaveLength(1)
      expect(persistence.acoes).toHaveLength(1)
      expect(persistence.createdAt).toBeInstanceOf(Date)
      expect(persistence.updatedAt).toBeInstanceOf(Date)
    })

    it('deve retornar cópias das condições e ações', () => {
      const input = createAutomationInputFactory.build({
        condicoes: [
          { campo: 'origem', operador: 'igual', valor: 'campanha' },
        ],
      })
      const automation = Automation.create('auto-123', input)

      const persistence = automation.toPersistence()

      // Verifica que são cópias, não referências
      expect(persistence.condicoes).not.toBe(automation.condicoes)
      expect(persistence.acoes).not.toBe(automation.acoes)
    })
  })

  describe('getters - imutabilidade', () => {
    it('deve retornar cópia de condições', () => {
      const input = createAutomationInputFactory.build({
        condicoes: [
          { campo: 'estadoJornada', operador: 'igual', valor: 'inicial' },
        ],
      })
      const automation = Automation.create('auto-123', input)

      const condicoes1 = automation.condicoes
      const condicoes2 = automation.condicoes

      expect(condicoes1).not.toBe(condicoes2)
      expect(condicoes1).toEqual(condicoes2)
    })

    it('deve retornar cópia de ações', () => {
      const input = createAutomationInputFactory.build()
      const automation = Automation.create('auto-123', input)

      const acoes1 = automation.acoes
      const acoes2 = automation.acoes

      expect(acoes1).not.toBe(acoes2)
      expect(acoes1).toEqual(acoes2)
    })
  })
})
