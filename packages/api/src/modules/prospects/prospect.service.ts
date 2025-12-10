import { db } from '../../db/index.js'
import { interessados, contatos } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import type { Interessado, NovoInteressado } from '@crm-filarmonica/shared'

export class ProspectService {
  /**
   * Create a new prospect from collected journey data
   */
  async createFromJourney(
    contactId: string,
    data: {
      instrumento?: string
      experiencia?: string
      diasDisponiveis?: string[]
      notas?: string
    }
  ): Promise<Interessado | null> {
    // Get contact info
    const contact = await db.query.contatos.findFirst({
      where: eq(contatos.id, contactId),
    })

    if (!contact) {
      return null
    }

    const prospect: NovoInteressado = {
      contatoId: contactId,
      nome: contact.nome || 'Não informado',
      telefone: contact.telefone,
      instrumentoDesejado: data.instrumento || null,
      experiencia: data.experiencia || null,
      disponibilidade: data.diasDisponiveis || [],
      status: 'novo',
      notas: data.notas || null,
    }

    const [created] = await db.insert(interessados).values(prospect).returning()

    return created
  }

  /**
   * Update prospect status
   */
  async updateStatus(
    prospectId: string,
    status: Interessado['status'],
    notas?: string
  ): Promise<Interessado | null> {
    const updates: Partial<Interessado> = {
      status,
      atualizadoEm: new Date(),
    }

    if (notas) {
      updates.notas = notas
    }

    const [updated] = await db
      .update(interessados)
      .set(updates)
      .where(eq(interessados.id, prospectId))
      .returning()

    return updated || null
  }

  /**
   * Get prospect by contact ID
   */
  async getByContactId(contactId: string): Promise<Interessado | null> {
    const prospect = await db.query.interessados.findFirst({
      where: eq(interessados.contatoId, contactId),
    })

    return prospect || null
  }

  /**
   * Check if contact already has a prospect record
   */
  async hasProspect(contactId: string): Promise<boolean> {
    const prospect = await this.getByContactId(contactId)
    return prospect !== null
  }
}

export const prospectService = new ProspectService()
