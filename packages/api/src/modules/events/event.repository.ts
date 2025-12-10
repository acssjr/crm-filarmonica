import { eq, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { eventos, type Evento, type NewEvento } from '../../db/schema.js'

export async function createEvent(data: NewEvento): Promise<Evento> {
  const result = await db
    .insert(eventos)
    .values(data)
    .returning()

  return result[0]
}

export async function listEventsByContact(
  contatoId: string,
  limit = 50
): Promise<Evento[]> {
  return db
    .select()
    .from(eventos)
    .where(eq(eventos.contatoId, contatoId))
    .orderBy(desc(eventos.createdAt))
    .limit(limit)
}

export async function listRecentEvents(limit = 100): Promise<Evento[]> {
  return db
    .select()
    .from(eventos)
    .orderBy(desc(eventos.createdAt))
    .limit(limit)
}
