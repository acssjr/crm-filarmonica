/**
 * Template Port
 * Interface for template operations
 */

export interface TemplateData {
  id: string
  nome: string
  conteudo: string
}

export interface TemplatePort {
  /**
   * Get template by ID
   */
  findById(id: string): Promise<TemplateData | null>

  /**
   * Render template with contact data
   */
  renderForContact(conteudo: string, contatoId: string): Promise<string>
}
