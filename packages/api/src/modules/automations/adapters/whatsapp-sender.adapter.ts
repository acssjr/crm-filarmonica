/**
 * WhatsApp Sender Adapter
 * Concrete implementation of MessageSenderPort using WhatsApp API
 */

import { sendWhatsAppMessage } from '../../../lib/whatsapp-client.js'
import { MessageSenderPort } from '../domain/ports/message-sender.port.js'
import { findTemplateById } from '../../templates/template.repository.js'

/**
 * Sanitize and validate phone number for WhatsApp API
 * - Removes all non-numeric characters
 * - Validates minimum length (10 digits for Brazilian numbers)
 * - Returns null if invalid
 */
function sanitizePhoneNumber(telefone: string): string | null {
  // Remove all non-numeric characters
  const cleaned = telefone.replace(/\D/g, '')

  // Brazilian phone: country code (55) + DDD (2 digits) + number (8-9 digits) = 12-13 digits
  // Minimum: 10 digits (local number with DDD)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null
  }

  return cleaned
}

export class WhatsAppSenderAdapter implements MessageSenderPort {
  async sendMessage(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }> {
    try {
      const phoneNumber = sanitizePhoneNumber(telefone)
      if (!phoneNumber) {
        return { success: false, error: `Número de telefone inválido: ${telefone}` }
      }

      await sendWhatsAppMessage(phoneNumber, mensagem)
      return { success: true }
    } catch (error) {
      console.error('[WhatsAppSender] Failed to send message:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async sendTemplate(
    telefone: string,
    templateId: string,
    variables?: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const phoneNumber = sanitizePhoneNumber(telefone)
      if (!phoneNumber) {
        return { success: false, error: `Número de telefone inválido: ${telefone}` }
      }

      const template = await findTemplateById(templateId)
      if (!template) {
        return { success: false, error: 'Template não encontrado' }
      }

      // Render template with variables
      let content = template.conteudo
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }
      }

      await sendWhatsAppMessage(phoneNumber, content)
      return { success: true }
    } catch (error) {
      console.error('[WhatsAppSender] Failed to send template:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

export const whatsappSenderAdapter = new WhatsAppSenderAdapter()
