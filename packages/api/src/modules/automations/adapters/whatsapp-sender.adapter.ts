/**
 * WhatsApp Sender Adapter
 * Concrete implementation of MessageSenderPort using WhatsApp API
 */

import { sendWhatsAppMessage } from '../../../lib/whatsapp-client.js'
import { MessageSenderPort } from '../domain/ports/message-sender.port.js'
import { findTemplateById } from '../../templates/template.repository.js'

export class WhatsAppSenderAdapter implements MessageSenderPort {
  async sendMessage(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove + from phone number
      const phoneNumber = telefone.replace('+', '')
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

      // Remove + from phone number
      const phoneNumber = telefone.replace('+', '')
      await sendWhatsAppMessage(phoneNumber, content)
      return { success: true }
    } catch (error) {
      console.error('[WhatsAppSender] Failed to send template:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

export const whatsappSenderAdapter = new WhatsAppSenderAdapter()
