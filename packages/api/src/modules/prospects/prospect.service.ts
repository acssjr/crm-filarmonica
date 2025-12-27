import { db } from '../../db/index.js'
import { interessados, contatos, type Interessado, type NewInteressado } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

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

    const prospect: NewInteressado = {
      contatoId: contactId,
      nome: contact.nome || 'Não informado',
      idade: 0, // Will be updated during journey if collected
      instrumentoDesejado: data.instrumento || 'Não informado',
      instrumentoSugerido: null,
      experienciaMusical: data.experiencia || null,
      expectativas: data.notas || null,
      disponibilidadeHorario: data.diasDisponiveis ? data.diasDisponiveis.length > 0 : false,
      compativel: true,
    }

    const [created] = await db.insert(interessados).values(prospect).returning()

    return created
  }

  /**
   * Update prospect compatibility
   */
  async updateCompatibility(
    prospectId: string,
    compativel: boolean
  ): Promise<Interessado | null> {
    const [updated] = await db
      .update(interessados)
      .set({ compativel })
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
