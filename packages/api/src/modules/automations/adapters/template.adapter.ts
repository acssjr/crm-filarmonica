/**
 * Template Adapter
 * Concrete implementation of TemplatePort
 */

import { TemplatePort, TemplateData } from '../domain/ports/template.port.js'
import { findTemplateById } from '../../templates/template.repository.js'
import { templateService } from '../../templates/template.service.js'

export class TemplateAdapter implements TemplatePort {
  async findById(id: string): Promise<TemplateData | null> {
    const template = await findTemplateById(id)
    if (!template) return null

    return {
      id: template.id,
      nome: template.nome,
      conteudo: template.conteudo,
    }
  }

  async renderForContact(conteudo: string, contatoId: string): Promise<string> {
    return templateService.renderForContact(conteudo, contatoId)
  }
}

export const templateAdapter = new TemplateAdapter()
