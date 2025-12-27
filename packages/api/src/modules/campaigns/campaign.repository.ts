import { eq, sql, desc, and, inArray, lte } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  campanhas,
  campanhaDestinatarios,
  campanhaExecucoes,
  contatos,
  contatoTags,
  interessados,
  type Campanha,
  type NewCampanha,
  type CampanhaDestinatario,
  type NewCampanhaDestinatario,
  type CampanhaExecucao,
  type NewCampanhaExecucao,
  type Contato,
} from '../../db/schema.js'

// ==================== CAMPAIGNS ====================

export async function findAllCampaigns(): Promise<Campanha[]> {
  return db.select().from(campanhas).orderBy(desc(campanhas.createdAt))
}

export async function findCampaignById(id: string): Promise<Campanha | null> {
  const result = await db.select().from(campanhas).where(eq(campanhas.id, id)).limit(1)
  return result[0] || null
}

export async function findCampaignsByStatus(status: Campanha['status']): Promise<Campanha[]> {
  return db.select().from(campanhas).where(eq(campanhas.status, status)).orderBy(desc(campanhas.createdAt))
}

export async function findScheduledCampaigns(): Promise<Campanha[]> {
  const now = new Date()
  return db
    .select()
    .from(campanhas)
    .where(
      and(
        eq(campanhas.status, 'agendada'),
        lte(campanhas.agendadaPara, now)
      )
    )
    .orderBy(campanhas.agendadaPara)
}

export async function createCampaign(data: NewCampanha): Promise<Campanha> {
  const result = await db.insert(campanhas).values(data).returning()
  return result[0]
}

export async function updateCampaign(id: string, data: Partial<NewCampanha>): Promise<Campanha | null> {
  const result = await db
    .update(campanhas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(campanhas.id, id))
    .returning()
  return result[0] || null
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const result = await db.delete(campanhas).where(eq(campanhas.id, id)).returning()
  return result.length > 0
}

// ==================== CAMPAIGN FILTERS ====================

export interface CampaignFilters {
  origem?: string[]
  estadoJornada?: string[]
  tags?: string[]
  instrumento?: string[]
  canal?: string[]
}

export async function findContactsByFilters(filters: CampaignFilters): Promise<Contato[]> {
  const conditions = []

  // Filter by origem
  if (filters.origem && filters.origem.length > 0) {
    conditions.push(inArray(contatos.origem, filters.origem as any[]))
  }

  // Filter by estadoJornada
  if (filters.estadoJornada && filters.estadoJornada.length > 0) {
    conditions.push(inArray(contatos.estadoJornada, filters.estadoJornada as any[]))
  }

  // Filter by canal
  if (filters.canal && filters.canal.length > 0) {
    conditions.push(inArray(contatos.canal, filters.canal as any[]))
  }

  // Get contacts matching basic filters
  let result: Contato[]
  if (conditions.length > 0) {
    result = await db.select().from(contatos).where(and(...conditions))
  } else {
    result = await db.select().from(contatos)
  }

  // Filter by tags (need to check junction table)
  if (filters.tags && filters.tags.length > 0) {
    const contactsWithTags = await db
      .selectDistinct({ contatoId: contatoTags.contatoId })
      .from(contatoTags)
      .where(inArray(contatoTags.tagId, filters.tags))

    const tagContactIds = new Set(contactsWithTags.map(c => c.contatoId))
    result = result.filter(c => tagContactIds.has(c.id))
  }

  // Filter by instrumento (need to check interessados table)
  if (filters.instrumento && filters.instrumento.length > 0) {
    const interessadosWithInstrument = await db
      .select({ contatoId: interessados.contatoId })
      .from(interessados)
      .where(inArray(interessados.instrumentoDesejado, filters.instrumento))

    const instrumentContactIds = new Set(interessadosWithInstrument.map(i => i.contatoId))
    result = result.filter(c => instrumentContactIds.has(c.id))
  }

  return result
}

// ==================== RECIPIENTS ====================

export async function findRecipientsByCampaign(campanhaId: string): Promise<CampanhaDestinatario[]> {
  return db
    .select()
    .from(campanhaDestinatarios)
    .where(eq(campanhaDestinatarios.campanhaId, campanhaId))
    .orderBy(campanhaDestinatarios.status)
}

export async function findRecipientsByCampaignWithContacts(campanhaId: string): Promise<Array<CampanhaDestinatario & { contato: Contato }>> {
  const result = await db
    .select({
      destinatario: campanhaDestinatarios,
      contato: contatos,
    })
    .from(campanhaDestinatarios)
    .innerJoin(contatos, eq(campanhaDestinatarios.contatoId, contatos.id))
    .where(eq(campanhaDestinatarios.campanhaId, campanhaId))

  return result.map(r => ({
    ...r.destinatario,
    contato: r.contato,
  }))
}

export async function findPendingRecipients(campanhaId: string, limit: number = 10): Promise<CampanhaDestinatario[]> {
  return db
    .select()
    .from(campanhaDestinatarios)
    .where(
      and(
        eq(campanhaDestinatarios.campanhaId, campanhaId),
        eq(campanhaDestinatarios.status, 'pendente')
      )
    )
    .limit(limit)
}

export async function createRecipients(recipients: NewCampanhaDestinatario[]): Promise<CampanhaDestinatario[]> {
  if (recipients.length === 0) return []
  const result = await db.insert(campanhaDestinatarios).values(recipients).returning()
  return result
}

export async function updateRecipientStatus(
  id: string,
  status: CampanhaDestinatario['status'],
  erro?: string
): Promise<CampanhaDestinatario | null> {
  const updates: Partial<CampanhaDestinatario> = { status }

  // Set timestamp based on status
  const now = new Date()
  switch (status) {
    case 'enviada':
      updates.enviadaAt = now
      break
    case 'entregue':
      updates.entregueAt = now
      break
    case 'lida':
      updates.lidaAt = now
      break
    case 'respondida':
      updates.respondidaAt = now
      break
    case 'falhou':
      updates.erro = erro
      break
  }

  const result = await db
    .update(campanhaDestinatarios)
    .set(updates)
    .where(eq(campanhaDestinatarios.id, id))
    .returning()

  return result[0] || null
}

export async function deleteRecipientsByCampaign(campanhaId: string): Promise<void> {
  await db.delete(campanhaDestinatarios).where(eq(campanhaDestinatarios.campanhaId, campanhaId))
}

export async function countRecipientsByStatus(campanhaId: string): Promise<Record<string, number>> {
  const result = await db
    .select({
      status: campanhaDestinatarios.status,
      count: sql<number>`count(*)`,
    })
    .from(campanhaDestinatarios)
    .where(eq(campanhaDestinatarios.campanhaId, campanhaId))
    .groupBy(campanhaDestinatarios.status)

  return result.reduce((acc, row) => {
    acc[row.status] = Number(row.count)
    return acc
  }, {} as Record<string, number>)
}

// ==================== EXECUTIONS ====================

export async function findExecutionsByCampaign(campanhaId: string): Promise<CampanhaExecucao[]> {
  return db
    .select()
    .from(campanhaExecucoes)
    .where(eq(campanhaExecucoes.campanhaId, campanhaId))
    .orderBy(desc(campanhaExecucoes.iniciadaAt))
}

export async function createExecution(data: NewCampanhaExecucao): Promise<CampanhaExecucao> {
  const result = await db.insert(campanhaExecucoes).values(data).returning()
  return result[0]
}

export async function updateExecution(id: string, data: Partial<CampanhaExecucao>): Promise<CampanhaExecucao | null> {
  const result = await db
    .update(campanhaExecucoes)
    .set(data)
    .where(eq(campanhaExecucoes.id, id))
    .returning()
  return result[0] || null
}

export async function getLatestExecution(campanhaId: string): Promise<CampanhaExecucao | null> {
  const result = await db
    .select()
    .from(campanhaExecucoes)
    .where(eq(campanhaExecucoes.campanhaId, campanhaId))
    .orderBy(desc(campanhaExecucoes.iniciadaAt))
    .limit(1)

  return result[0] || null
}
