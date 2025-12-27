/**
 * Contact Adapter
 * Concrete implementation of ContactPort
 */

import { eq, sql, and, lte } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { contatos, interessados, contatoTags, tags, mensagens, conversas, estadoJornadaEnum } from '../../../db/schema.js'

// Valid journey states from the enum
const VALID_JOURNEY_STATES = new Set(estadoJornadaEnum.enumValues)
import { ContactPort, ContactDetails } from '../domain/ports/contact.port.js'
import { ContactData } from '../domain/value-objects/condition.vo.js'

export class ContactAdapter implements ContactPort {
  async findById(id: string): Promise<ContactDetails | null> {
    const rows = await db.select().from(contatos).where(eq(contatos.id, id)).limit(1)
    if (!rows[0]) return null

    const contact = rows[0]

    // Get tags
    const tagRows = await db
      .select({ tagId: contatoTags.tagId })
      .from(contatoTags)
      .where(eq(contatoTags.contatoId, id))

    const tagIds = tagRows.map(r => r.tagId)

    // Get interessado data
    const interessadoRows = await db
      .select()
      .from(interessados)
      .where(eq(interessados.contatoId, id))
      .limit(1)

    const interessado = interessadoRows[0]

    return {
      id: contact.id,
      telefone: contact.telefone,
      nome: contact.nome || undefined,
      estadoJornada: contact.estadoJornada,
      origem: contact.origem,
      tags: tagIds,
      interessado: interessado
        ? {
            idade: interessado.idade,
            instrumentoDesejado: interessado.instrumentoDesejado,
          }
        : undefined,
    }
  }

  async getContactData(id: string): Promise<ContactData | null> {
    const contact = await this.findById(id)
    if (!contact) return null

    return {
      tags: contact.tags,
      estadoJornada: contact.estadoJornada,
      origem: contact.origem,
      idade: contact.interessado?.idade,
      instrumentoDesejado: contact.interessado?.instrumentoDesejado,
    }
  }

  async addTag(
    contatoId: string,
    tagId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if tag exists
      const tagRows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
      if (!tagRows[0]) {
        return { success: false, error: 'Tag não encontrada' }
      }

      // Check if already has tag
      const existing = await db
        .select()
        .from(contatoTags)
        .where(and(eq(contatoTags.contatoId, contatoId), eq(contatoTags.tagId, tagId)))
        .limit(1)

      if (existing[0]) {
        return { success: true } // Already has tag
      }

      await db.insert(contatoTags).values({ contatoId, tagId })
      return { success: true }
    } catch (error) {
      console.error('[ContactAdapter] Failed to add tag:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async removeTag(
    contatoId: string,
    tagId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db
        .delete(contatoTags)
        .where(and(eq(contatoTags.contatoId, contatoId), eq(contatoTags.tagId, tagId)))
      return { success: true }
    } catch (error) {
      console.error('[ContactAdapter] Failed to remove tag:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async updateJourneyState(
    contatoId: string,
    estado: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate estado against the enum values
      if (!VALID_JOURNEY_STATES.has(estado as typeof estadoJornadaEnum.enumValues[number])) {
        return {
          success: false,
          error: `Estado de jornada inválido: ${estado}. Valores válidos: ${[...VALID_JOURNEY_STATES].join(', ')}`,
        }
      }

      await db
        .update(contatos)
        .set({
          estadoJornada: estado as typeof estadoJornadaEnum.enumValues[number],
          updatedAt: new Date(),
        })
        .where(eq(contatos.id, contatoId))
      return { success: true }
    } catch (error) {
      console.error('[ContactAdapter] Failed to update journey state:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async findContactsWithoutInteraction(
    days: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<string[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Find contacts whose last message is older than cutoff (with pagination)
    const result = await db
      .select({
        contatoId: conversas.contatoId,
        lastMessage: sql<Date>`max(${mensagens.createdAt})`,
      })
      .from(conversas)
      .innerJoin(mensagens, eq(mensagens.conversaId, conversas.id))
      .where(eq(conversas.status, 'ativa'))
      .groupBy(conversas.contatoId)
      .having(lte(sql`max(${mensagens.createdAt})`, cutoffDate))
      .limit(limit)
      .offset(offset)

    return result.map(r => r.contatoId)
  }
}

export const contactAdapter = new ContactAdapter()
