import { eq, desc, like, or, sql, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { contatos, type Contato, type NewContato } from '../../db/schema.js'

export async function findContactByPhone(telefone: string): Promise<Contato | null> {
  const result = await db
    .select()
    .from(contatos)
    .where(eq(contatos.telefone, telefone))
    .limit(1)

  return result[0] || null
}

export async function findContactById(id: string): Promise<Contato | null> {
  const result = await db
    .select()
    .from(contatos)
    .where(eq(contatos.id, id))
    .limit(1)

  return result[0] || null
}

export async function createContact(data: NewContato): Promise<Contato> {
  const result = await db
    .insert(contatos)
    .values(data)
    .returning()

  return result[0]
}

export async function updateContact(
  id: string,
  data: Partial<NewContato>
): Promise<Contato | null> {
  const result = await db
    .update(contatos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contatos.id, id))
    .returning()

  return result[0] || null
}

export interface ListContactsParams {
  page?: number
  limit?: number
  search?: string
  origem?: string
  estadoJornada?: string
}

export interface PaginatedContacts {
  data: Contato[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function listContacts(params: ListContactsParams): Promise<PaginatedContacts> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  // Build where conditions
  const conditions = []

  if (params.search) {
    conditions.push(
      or(
        like(contatos.nome, `%${params.search}%`),
        like(contatos.telefone, `%${params.search}%`)
      )
    )
  }

  if (params.origem) {
    conditions.push(eq(contatos.origem, params.origem as 'organico' | 'campanha' | 'indicacao'))
  }

  if (params.estadoJornada) {
    conditions.push(eq(contatos.estadoJornada, params.estadoJornada as Contato['estadoJornada']))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)
    .where(whereClause)

  const total = Number(countResult[0]?.count || 0)

  // Get paginated data
  const data = await db
    .select()
    .from(contatos)
    .where(whereClause)
    .orderBy(desc(contatos.updatedAt))
    .limit(limit)
    .offset(offset)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function countContactsByOrigem(): Promise<Record<string, number>> {
  const result = await db
    .select({
      origem: contatos.origem,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .groupBy(contatos.origem)

  return result.reduce((acc, row) => {
    acc[row.origem] = Number(row.count)
    return acc
  }, {} as Record<string, number>)
}

export async function countContactsByEstado(): Promise<Record<string, number>> {
  const result = await db
    .select({
      estado: contatos.estadoJornada,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .groupBy(contatos.estadoJornada)

  return result.reduce((acc, row) => {
    acc[row.estado] = Number(row.count)
    return acc
  }, {} as Record<string, number>)
}

export async function countNewContactsToday(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)
    .where(sql`${contatos.createdAt} >= ${todayISO}`)

  return Number(result[0]?.count || 0)
}

export async function getTotalContacts(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)

  return Number(result[0]?.count || 0)
}
