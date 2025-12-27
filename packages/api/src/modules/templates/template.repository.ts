import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  templates,
  templateCategorias,
  type Template,
  type NewTemplate,
  type TemplateCategoria,
  type NewTemplateCategoria,
} from '../../db/schema.js'

// ==================== CATEGORIES ====================

export async function findAllCategories(): Promise<TemplateCategoria[]> {
  return db.select().from(templateCategorias).orderBy(templateCategorias.nome)
}

export async function findCategoryById(id: string): Promise<TemplateCategoria | null> {
  const result = await db.select().from(templateCategorias).where(eq(templateCategorias.id, id)).limit(1)
  return result[0] || null
}

export async function findCategoryByName(nome: string): Promise<TemplateCategoria | null> {
  const result = await db.select().from(templateCategorias).where(eq(templateCategorias.nome, nome)).limit(1)
  return result[0] || null
}

export async function createCategory(data: NewTemplateCategoria): Promise<TemplateCategoria> {
  const result = await db.insert(templateCategorias).values(data).returning()
  return result[0]
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Only delete if not a system category
  const result = await db
    .delete(templateCategorias)
    .where(and(eq(templateCategorias.id, id), eq(templateCategorias.isSistema, false)))
    .returning()
  return result.length > 0
}

export async function seedDefaultCategories(): Promise<void> {
  const defaults = ['Boas-vindas', 'Lembretes', 'Promocoes', 'Atendimento']

  for (const nome of defaults) {
    const existing = await findCategoryByName(nome)
    if (!existing) {
      await createCategory({ nome, isSistema: true })
    }
  }
}

// ==================== TEMPLATES ====================

export async function findAllTemplates(categoriaId?: string): Promise<Template[]> {
  if (categoriaId) {
    return db.select().from(templates).where(eq(templates.categoriaId, categoriaId)).orderBy(templates.nome)
  }
  return db.select().from(templates).orderBy(templates.nome)
}

export async function findTemplateById(id: string): Promise<Template | null> {
  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1)
  return result[0] || null
}

export async function findTemplateByName(nome: string): Promise<Template | null> {
  const result = await db.select().from(templates).where(eq(templates.nome, nome)).limit(1)
  return result[0] || null
}

export async function createTemplate(data: NewTemplate): Promise<Template> {
  const result = await db.insert(templates).values(data).returning()
  return result[0]
}

export async function updateTemplate(id: string, data: Partial<NewTemplate>): Promise<Template | null> {
  const result = await db
    .update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templates.id, id))
    .returning()
  return result[0] || null
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const result = await db.delete(templates).where(eq(templates.id, id)).returning()
  return result.length > 0
}

export async function countTemplatesByCategory(): Promise<Array<{ categoriaId: string | null; count: number }>> {
  const result = await db
    .select({
      categoriaId: templates.categoriaId,
      count: sql<number>`count(*)`,
    })
    .from(templates)
    .groupBy(templates.categoriaId)

  return result.map(r => ({ ...r, count: Number(r.count) }))
}

// ==================== TEMPLATE WITH CATEGORY ====================

export interface TemplateWithCategory extends Template {
  categoria: TemplateCategoria | null
}

export async function findTemplateWithCategory(id: string): Promise<TemplateWithCategory | null> {
  const result = await db
    .select({
      template: templates,
      categoria: templateCategorias,
    })
    .from(templates)
    .leftJoin(templateCategorias, eq(templates.categoriaId, templateCategorias.id))
    .where(eq(templates.id, id))
    .limit(1)

  if (!result[0]) return null

  return {
    ...result[0].template,
    categoria: result[0].categoria,
  }
}

export async function findAllTemplatesWithCategory(categoriaId?: string): Promise<TemplateWithCategory[]> {
  let query = db
    .select({
      template: templates,
      categoria: templateCategorias,
    })
    .from(templates)
    .leftJoin(templateCategorias, eq(templates.categoriaId, templateCategorias.id))
    .orderBy(templates.nome)

  const result = categoriaId
    ? await db
        .select({
          template: templates,
          categoria: templateCategorias,
        })
        .from(templates)
        .leftJoin(templateCategorias, eq(templates.categoriaId, templateCategorias.id))
        .where(eq(templates.categoriaId, categoriaId))
        .orderBy(templates.nome)
    : await query

  return result.map(r => ({
    ...r.template,
    categoria: r.categoria,
  }))
}
