/**
 * WhatsApp Sender Adapter Tests
 * Tests for phone number sanitization and message sending
 */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest'
import { WhatsAppSenderAdapter } from './whatsapp-sender.adapter.js'

// Mock the WhatsApp client
vi.mock('../../../lib/whatsapp-client.js', () => ({
  sendWhatsAppMessage: vi.fn(),
}))

// Mock the template repository
vi.mock('../../templates/template.repository.js', () => ({
  findTemplateById: vi.fn(),
}))

import { sendWhatsAppMessage } from '../../../lib/whatsapp-client.js'
import { findTemplateById } from '../../templates/template.repository.js'

describe('WhatsAppSenderAdapter', () => {
  let adapter: WhatsAppSenderAdapter
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new WhatsAppSenderAdapter()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(sendWhatsAppMessage as Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('sendMessage', () => {
    describe('phone number sanitization', () => {
      it('should accept valid Brazilian phone number with country code', async () => {
        const result = await adapter.sendMessage('+5575988123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept phone number without + prefix', async () => {
        const result = await adapter.sendMessage('5575988123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should remove all non-numeric characters', async () => {
        const result = await adapter.sendMessage('+55 (75) 98812-3456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept phone with spaces', async () => {
        const result = await adapter.sendMessage('55 75 98812 3456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept phone with dashes', async () => {
        const result = await adapter.sendMessage('55-75-98812-3456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept phone with parentheses', async () => {
        const result = await adapter.sendMessage('55(75)988123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept 10-digit local number with DDD', async () => {
        const result = await adapter.sendMessage('7588123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('7588123456', 'Hello!')
      })

      it('should accept 11-digit mobile number with DDD', async () => {
        const result = await adapter.sendMessage('75988123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('75988123456', 'Hello!')
      })

      it('should accept 12-digit number with country code', async () => {
        const result = await adapter.sendMessage('557588123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('557588123456', 'Hello!')
      })

      it('should accept 13-digit mobile with country code', async () => {
        const result = await adapter.sendMessage('5575988123456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })

      it('should accept up to 15-digit international numbers', async () => {
        const result = await adapter.sendMessage('123456789012345', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('123456789012345', 'Hello!')
      })

      it('should reject phone number with less than 10 digits', async () => {
        const result = await adapter.sendMessage('123456789', 'Hello!')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should reject phone number with more than 15 digits', async () => {
        const result = await adapter.sendMessage('1234567890123456', 'Hello!')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should reject empty phone number', async () => {
        const result = await adapter.sendMessage('', 'Hello!')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should reject phone number with only non-numeric characters', async () => {
        const result = await adapter.sendMessage('++----()', 'Hello!')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should reject phone number with letters', async () => {
        const result = await adapter.sendMessage('55abc123456', 'Hello!')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should handle mixed valid and invalid characters', async () => {
        // 55 75 9 8812 3456 = 13 digits after cleaning, valid
        const result = await adapter.sendMessage('+55 (75) 9 8812-3456', 'Hello!')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Hello!')
      })
    })

    describe('message sending', () => {
      it('should send message successfully', async () => {
        const result = await adapter.sendMessage('5575988123456', 'Test message')

        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Test message')
      })

      it('should handle WhatsApp API errors', async () => {
        ;(sendWhatsAppMessage as Mock).mockRejectedValue(new Error('API rate limit exceeded'))

        const result = await adapter.sendMessage('5575988123456', 'Test message')

        expect(result.success).toBe(false)
        expect(result.error).toBe('API rate limit exceeded')
      })

      it('should log errors to console', async () => {
        const error = new Error('Network error')
        ;(sendWhatsAppMessage as Mock).mockRejectedValue(error)

        await adapter.sendMessage('5575988123456', 'Test message')

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[WhatsAppSender] Failed to send message'),
          error
        )
      })

      it('should send multiline messages', async () => {
        const message = 'Line 1\nLine 2\nLine 3'

        const result = await adapter.sendMessage('5575988123456', message)

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', message)
      })

      it('should send messages with emojis', async () => {
        const message = 'Hello! Welcome to Filarmonica.'

        const result = await adapter.sendMessage('5575988123456', message)

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', message)
      })

      it('should send messages with special characters', async () => {
        const message = 'Preco: R$ 100,00 - 50% desconto!'

        const result = await adapter.sendMessage('5575988123456', message)

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', message)
      })
    })
  })

  describe('sendTemplate', () => {
    beforeEach(() => {
      ;(findTemplateById as Mock).mockResolvedValue({
        id: 'template-123',
        nome: 'Welcome Template',
        conteudo: 'Ola {{nome}}, bem-vindo a Filarmonica!',
      })
    })

    describe('template handling', () => {
      it('should find and send template', async () => {
        const result = await adapter.sendTemplate('5575988123456', 'template-123')

        expect(result.success).toBe(true)
        expect(findTemplateById).toHaveBeenCalledWith('template-123')
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Ola {{nome}}, bem-vindo a Filarmonica!'
        )
      })

      it('should return error when template not found', async () => {
        ;(findTemplateById as Mock).mockResolvedValue(null)

        const result = await adapter.sendTemplate('5575988123456', 'non-existent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Template não encontrado')
        expect(sendWhatsAppMessage).not.toHaveBeenCalled()
      })

      it('should replace single variable', async () => {
        const result = await adapter.sendTemplate('5575988123456', 'template-123', {
          nome: 'Joao',
        })

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Ola Joao, bem-vindo a Filarmonica!'
        )
      })

      it('should replace multiple variables', async () => {
        ;(findTemplateById as Mock).mockResolvedValue({
          id: 'template-456',
          nome: 'Complete Template',
          conteudo: '{{nome}}, voce se inscreveu para {{instrumento}}. Sua idade: {{idade}} anos.',
        })

        const result = await adapter.sendTemplate('5575988123456', 'template-456', {
          nome: 'Maria',
          instrumento: 'Violino',
          idade: '25',
        })

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Maria, voce se inscreveu para Violino. Sua idade: 25 anos.'
        )
      })

      it('should replace same variable appearing multiple times', async () => {
        ;(findTemplateById as Mock).mockResolvedValue({
          id: 'template-789',
          nome: 'Repeat Template',
          conteudo: 'Oi {{nome}}! {{nome}}, voce e especial, {{nome}}!',
        })

        const result = await adapter.sendTemplate('5575988123456', 'template-789', {
          nome: 'Pedro',
        })

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Oi Pedro! Pedro, voce e especial, Pedro!'
        )
      })

      it('should leave unreplaced variables as-is when not provided', async () => {
        const result = await adapter.sendTemplate('5575988123456', 'template-123')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Ola {{nome}}, bem-vindo a Filarmonica!'
        )
      })

      it('should handle template without variables', async () => {
        ;(findTemplateById as Mock).mockResolvedValue({
          id: 'template-simple',
          nome: 'Simple Template',
          conteudo: 'Obrigado por entrar em contato!',
        })

        const result = await adapter.sendTemplate('5575988123456', 'template-simple')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Obrigado por entrar em contato!'
        )
      })

      it('should handle extra variables that are not in template', async () => {
        const result = await adapter.sendTemplate('5575988123456', 'template-123', {
          nome: 'Ana',
          extraVar: 'should be ignored',
        })

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          'Ola Ana, bem-vindo a Filarmonica!'
        )
      })
    })

    describe('phone sanitization in templates', () => {
      it('should sanitize phone number for template sending', async () => {
        const result = await adapter.sendTemplate('+55 (75) 98812-3456', 'template-123', {
          nome: 'Carlos',
        })

        expect(result.success).toBe(true)
        expect(sendWhatsAppMessage).toHaveBeenCalledWith(
          '5575988123456',
          expect.any(String)
        )
      })

      it('should reject invalid phone for template sending', async () => {
        const result = await adapter.sendTemplate('123', 'template-123')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Número de telefone inválido')
        expect(findTemplateById).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should handle template repository errors', async () => {
        ;(findTemplateById as Mock).mockRejectedValue(new Error('Database connection failed'))

        const result = await adapter.sendTemplate('5575988123456', 'template-123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Database connection failed')
      })

      it('should handle WhatsApp API errors for templates', async () => {
        ;(sendWhatsAppMessage as Mock).mockRejectedValue(new Error('Message too long'))

        const result = await adapter.sendTemplate('5575988123456', 'template-123', {
          nome: 'Test',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Message too long')
      })

      it('should log errors for template sending', async () => {
        const error = new Error('Template rendering failed')
        ;(sendWhatsAppMessage as Mock).mockRejectedValue(error)

        await adapter.sendTemplate('5575988123456', 'template-123')

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[WhatsAppSender] Failed to send template'),
          error
        )
      })
    })
  })

  describe('edge cases', () => {
    it('should handle undefined variables object', async () => {
      const result = await adapter.sendTemplate('5575988123456', 'template-123', undefined)

      expect(result.success).toBe(true)
    })

    it('should handle empty variables object', async () => {
      const result = await adapter.sendTemplate('5575988123456', 'template-123', {})

      expect(result.success).toBe(true)
    })

    it('should handle variable values with special regex characters', async () => {
      ;(findTemplateById as Mock).mockResolvedValue({
        id: 'template-special',
        nome: 'Special Template',
        conteudo: 'Valor: {{valor}}',
      })

      const result = await adapter.sendTemplate('5575988123456', 'template-special', {
        valor: '$100.00 (promo)',
      })

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith(
        '5575988123456',
        'Valor: $100.00 (promo)'
      )
    })

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(4096) // WhatsApp limit

      const result = await adapter.sendMessage('5575988123456', longMessage)

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', longMessage)
    })

    it('should handle empty message', async () => {
      const result = await adapter.sendMessage('5575988123456', '')

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', '')
    })
  })
})
