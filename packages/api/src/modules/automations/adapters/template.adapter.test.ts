/**
 * Template Adapter Tests
 * Tests for template finding and rendering
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { TemplateAdapter } from './template.adapter.js'

// Mock the template repository
vi.mock('../../templates/template.repository.js', () => ({
  findTemplateById: vi.fn(),
}))

// Mock the template service
vi.mock('../../templates/template.service.js', () => ({
  templateService: {
    renderForContact: vi.fn(),
  },
}))

import { findTemplateById } from '../../templates/template.repository.js'
import { templateService } from '../../templates/template.service.js'

describe('TemplateAdapter', () => {
  let adapter: TemplateAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new TemplateAdapter()
  })

  describe('findById', () => {
    it('should return template data when found', async () => {
      const mockTemplate = {
        id: 'template-123',
        nome: 'Welcome Template',
        conteudo: 'Ola {{nome}}, bem-vindo!',
        tipo: 'interno',
        categoriaId: 'cat-1',
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-123')

      expect(result).toEqual({
        id: 'template-123',
        nome: 'Welcome Template',
        conteudo: 'Ola {{nome}}, bem-vindo!',
      })
    })

    it('should return null when template not found', async () => {
      ;(findTemplateById as Mock).mockResolvedValue(null)

      const result = await adapter.findById('non-existent')

      expect(result).toBeNull()
    })

    it('should call repository with correct id', async () => {
      ;(findTemplateById as Mock).mockResolvedValue(null)

      await adapter.findById('my-template-id')

      expect(findTemplateById).toHaveBeenCalledWith('my-template-id')
    })

    it('should only return id, nome, and conteudo', async () => {
      const mockTemplate = {
        id: 'template-456',
        nome: 'HSM Template',
        conteudo: 'Message content',
        tipo: 'hsm',
        categoriaId: 'cat-2',
        hsmNome: 'hsm_template_name',
        hsmStatus: 'aprovado',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-456')

      expect(result).toEqual({
        id: 'template-456',
        nome: 'HSM Template',
        conteudo: 'Message content',
      })
      // Verify extra fields are not included
      expect(result).not.toHaveProperty('tipo')
      expect(result).not.toHaveProperty('categoriaId')
      expect(result).not.toHaveProperty('hsmNome')
      expect(result).not.toHaveProperty('hsmStatus')
      expect(result).not.toHaveProperty('createdAt')
      expect(result).not.toHaveProperty('updatedAt')
    })

    it('should handle template with multiline content', async () => {
      const mockTemplate = {
        id: 'template-multiline',
        nome: 'Multiline Template',
        conteudo: 'Linha 1\nLinha 2\nLinha 3',
        tipo: 'interno',
        categoriaId: null,
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-multiline')

      expect(result?.conteudo).toBe('Linha 1\nLinha 2\nLinha 3')
    })

    it('should handle template with special characters', async () => {
      const mockTemplate = {
        id: 'template-special',
        nome: 'Template com Acentos',
        conteudo: 'Ola {{nome}}! Valor: R$ 100,00 - Preco especial!',
        tipo: 'interno',
        categoriaId: null,
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-special')

      expect(result?.conteudo).toBe('Ola {{nome}}! Valor: R$ 100,00 - Preco especial!')
    })

    it('should handle template with empty content', async () => {
      const mockTemplate = {
        id: 'template-empty',
        nome: 'Empty Template',
        conteudo: '',
        tipo: 'interno',
        categoriaId: null,
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-empty')

      expect(result?.conteudo).toBe('')
    })

    it('should handle template with multiple variables', async () => {
      const mockTemplate = {
        id: 'template-vars',
        nome: 'Template com Variaveis',
        conteudo: '{{nome}}, seu instrumento: {{instrumento}}, idade: {{idade}}',
        tipo: 'interno',
        categoriaId: null,
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)

      const result = await adapter.findById('template-vars')

      expect(result?.conteudo).toContain('{{nome}}')
      expect(result?.conteudo).toContain('{{instrumento}}')
      expect(result?.conteudo).toContain('{{idade}}')
    })
  })

  describe('renderForContact', () => {
    it('should delegate rendering to template service', async () => {
      const conteudo = 'Ola {{nome}}, bem-vindo!'
      const contatoId = 'contact-123'
      const renderedContent = 'Ola Joao, bem-vindo!'

      ;(templateService.renderForContact as Mock).mockResolvedValue(renderedContent)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe(renderedContent)
      expect(templateService.renderForContact).toHaveBeenCalledWith(conteudo, contatoId)
    })

    it('should pass content and contactId correctly', async () => {
      const conteudo = 'Template content here'
      const contatoId = 'my-contact-id'

      ;(templateService.renderForContact as Mock).mockResolvedValue(conteudo)

      await adapter.renderForContact(conteudo, contatoId)

      expect(templateService.renderForContact).toHaveBeenCalledWith(
        'Template content here',
        'my-contact-id'
      )
    })

    it('should return rendered content with replaced variables', async () => {
      const conteudo = '{{nome}} inscrito para {{instrumento}}'
      const contatoId = 'contact-456'
      const rendered = 'Maria inscrito para Violino'

      ;(templateService.renderForContact as Mock).mockResolvedValue(rendered)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('Maria inscrito para Violino')
    })

    it('should handle content without variables', async () => {
      const conteudo = 'Mensagem sem variaveis'
      const contatoId = 'contact-789'

      ;(templateService.renderForContact as Mock).mockResolvedValue(conteudo)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('Mensagem sem variaveis')
    })

    it('should handle empty content', async () => {
      const conteudo = ''
      const contatoId = 'contact-empty'

      ;(templateService.renderForContact as Mock).mockResolvedValue('')

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('')
    })

    it('should handle multiline content', async () => {
      const conteudo = 'Linha 1: {{nome}}\nLinha 2: {{instrumento}}\nLinha 3: Fim'
      const contatoId = 'contact-multiline'
      const rendered = 'Linha 1: Pedro\nLinha 2: Flauta\nLinha 3: Fim'

      ;(templateService.renderForContact as Mock).mockResolvedValue(rendered)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe(rendered)
      expect(result.split('\n')).toHaveLength(3)
    })

    it('should handle content with unresolved variables', async () => {
      const conteudo = '{{nome}} - {{variavel_desconhecida}}'
      const contatoId = 'contact-unknown-var'
      // Service returns content with unresolved variable as empty
      const rendered = 'Joao - '

      ;(templateService.renderForContact as Mock).mockResolvedValue(rendered)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('Joao - ')
    })

    it('should handle special characters in variables', async () => {
      const conteudo = 'Valor: {{valor}}'
      const contatoId = 'contact-special'
      const rendered = 'Valor: R$ 1.500,00'

      ;(templateService.renderForContact as Mock).mockResolvedValue(rendered)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('Valor: R$ 1.500,00')
    })

    it('should handle same variable appearing multiple times', async () => {
      const conteudo = '{{nome}} e legal. {{nome}} e especial. {{nome}} e unico!'
      const contatoId = 'contact-repeat'
      const rendered = 'Ana e legal. Ana e especial. Ana e unico!'

      ;(templateService.renderForContact as Mock).mockResolvedValue(rendered)

      const result = await adapter.renderForContact(conteudo, contatoId)

      expect(result).toBe('Ana e legal. Ana e especial. Ana e unico!')
    })

    it('should propagate errors from template service', async () => {
      const conteudo = 'Content'
      const contatoId = 'contact-error'

      ;(templateService.renderForContact as Mock).mockRejectedValue(
        new Error('Contact not found')
      )

      await expect(adapter.renderForContact(conteudo, contatoId)).rejects.toThrow(
        'Contact not found'
      )
    })
  })

  describe('integration scenarios', () => {
    it('should find template and render for contact', async () => {
      const mockTemplate = {
        id: 'template-integration',
        nome: 'Integration Template',
        conteudo: 'Bem-vindo {{nome}} a Filarmonica!',
        tipo: 'interno',
        categoriaId: null,
        hsmNome: null,
        hsmStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(findTemplateById as Mock).mockResolvedValue(mockTemplate)
      ;(templateService.renderForContact as Mock).mockResolvedValue(
        'Bem-vindo Carlos a Filarmonica!'
      )

      // Find template
      const template = await adapter.findById('template-integration')
      expect(template).toBeDefined()

      // Render for contact
      const rendered = await adapter.renderForContact(template!.conteudo, 'contact-123')
      expect(rendered).toBe('Bem-vindo Carlos a Filarmonica!')
    })

    it('should handle template not found then render fallback', async () => {
      ;(findTemplateById as Mock).mockResolvedValue(null)

      const template = await adapter.findById('non-existent')
      expect(template).toBeNull()

      // Can still render fallback content
      const fallbackContent = 'Mensagem padrao'
      ;(templateService.renderForContact as Mock).mockResolvedValue(fallbackContent)

      const rendered = await adapter.renderForContact(fallbackContent, 'contact-123')
      expect(rendered).toBe('Mensagem padrao')
    })
  })
})
