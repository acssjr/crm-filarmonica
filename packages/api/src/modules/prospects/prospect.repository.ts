import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { interessados, contatos, type Interessado, type NewInteressado } from '../../db/schema.js'

export async function findInteressadoByContactId(contatoId: string): Promise<Interessado | null> {
  const result = await db
    .select()
    .from(interessados)
    .where(eq(interessados.contatoId, contatoId))
    .limit(1)

  return result[0] || null
}

export async function findInteressadoById(id: string): Promise<Interessado | null> {
  const result = await db
    .select()
    .from(interessados)
    .where(eq(interessados.id, id))
    .limit(1)

  return result[0] || null
}

export async function createInteressado(data: NewInteressado): Promise<Interessado> {
  const result = await db
    .insert(interessados)
    .values(data)
    .returning()

  return result[0]
}

export async function updateInteressado(
  id: string,
  data: Partial<NewInteressado>
): Promise<Interessado | null> {
  const result = await db
    .update(interessados)
    .set(data)
    .where(eq(interessados.id, id))
    .returning()

  return result[0] || null
}

export interface ListProspectsParams {
  compativel?: boolean
  instrumento?: string
}

export async function listProspects(params: ListProspectsParams = {}) {
  const conditions = []

  if (params.compativel !== undefined) {
    conditions.push(eq(interessados.compativel, params.compativel))
  }

  if (params.instrumento) {
    conditions.push(eq(interessados.instrumentoDesejado, params.instrumento))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const result = await db
    .select({
      interessado: interessados,
      contato: contatos,
    })
    .from(interessados)
    .innerJoin(contatos, eq(interessados.contatoId, contatos.id))
    .where(whereClause)
    .orderBy(desc(interessados.createdAt))

  return result.map((row) => ({
    ...row.interessado,
    contato: row.contato,
  }))
}

export async function getProspectWithContact(id: string) {
  const result = await db
    .select({
      interessado: interessados,
      contato: contatos,
    })
    .from(interessados)
    .innerJoin(contatos, eq(interessados.contatoId, contatos.id))
    .where(eq(interessados.id, id))
    .limit(1)

  if (!result[0]) return null

  return {
    ...result[0].interessado,
    contato: result[0].contato,
  }
}
