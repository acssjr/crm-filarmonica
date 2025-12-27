/**
 * Message Sender Port
 * Interface for sending messages to contacts
 */

export interface MessageSenderPort {
  /**
   * Send a plain text message to a contact
   */
  sendMessage(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }>

  /**
   * Send a template message to a contact
   */
  sendTemplate(
    telefone: string,
    templateId: string,
    variables?: Record<string, string>
  ): Promise<{ success: boolean; error?: string }>
}
