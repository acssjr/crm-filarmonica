import {
  findAllCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  deleteCategory,
  findTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  findAllTemplatesWithCategory,
  findTemplateWithCategory,
  seedDefaultCategories,
  type TemplateWithCategory,
} from './template.repository.js'
import type { Template, NewTemplate, TemplateCategoria } from '../../db/schema.js'
import { findContactById } from '../contacts/contact.repository.js'
import { findInteressadoByContactId } from '../prospects/prospect.repository.js'

// Template variable definitions
const TEMPLATE_VARIABLES = [
  { key: 'nome', label: 'Nome do contato', example: 'João Silva' },
  { key: 'telefone', label: 'Telefone', example: '75999001234' },
  { key: 'instrumento', label: 'Instrumento desejado', example: 'Saxofone' },
  { key: 'idade', label: 'Idade', example: '25' },
  { key: 'experiencia', label: 'Experiência musical', example: '2 anos de violão' },
  { key: 'disponibilidade', label: 'Disponibilidade de horário', example: 'Sim' },
  { key: 'data_cadastro', label: 'Data de cadastro', example: '26/12/2025' },
] as const

type VariableKey = typeof TEMPLATE_VARIABLES[number]['key']

// ==================== CATEGORIES ====================

export async function getAllCategories(): Promise<TemplateCategoria[]> {
  return findAllCategories()
}

export async function getCategoryById(id: string): Promise<TemplateCategoria | null> {
  return findCategoryById(id)
}

export async function createNewCategory(nome: string): Promise<{ category?: TemplateCategoria; error?: string }> {
  const trimmedName = nome.trim()
  if (!trimmedName || trimmedName.length > 50) {
    return { error: 'Nome deve ter entre 1 e 50 caracteres' }
  }

  const existing = await findCategoryByName(trimmedName)
  if (existing) {
    return { error: 'Ja existe uma categoria com este nome' }
  }

  const category = await createCategory({ nome: trimmedName, isSistema: false })
  return { category }
}

export async function deleteExistingCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const existing = await findCategoryById(id)
  if (!existing) {
    return { success: false, error: 'Categoria nao encontrada' }
  }

  if (existing.isSistema) {
    return { success: false, error: 'Nao e possivel excluir categorias do sistema' }
  }

  const success = await deleteCategory(id)
  return { success }
}

// ==================== TEMPLATES ====================

export interface CreateTemplateInput {
  nome: string
  conteudo: string
  categoriaId?: string
  tipo?: 'interno' | 'hsm'
  hsmNome?: string
}

export interface UpdateTemplateInput {
  nome?: string
  conteudo?: string
  categoriaId?: string | null
  tipo?: 'interno' | 'hsm'
  hsmNome?: string
  hsmStatus?: 'pendente' | 'aprovado' | 'rejeitado'
}

export async function getAllTemplates(categoriaId?: string): Promise<TemplateWithCategory[]> {
  return findAllTemplatesWithCategory(categoriaId)
}

export async function getTemplateById(id: string): Promise<TemplateWithCategory | null> {
  return findTemplateWithCategory(id)
}

export async function createNewTemplate(input: CreateTemplateInput): Promise<{ template?: Template; error?: string }> {
  // Validate name
  const nome = input.nome.trim()
  if (!nome || nome.length > 100) {
    return { error: 'Nome deve ter entre 1 e 100 caracteres' }
  }

  // Validate content
  const conteudo = input.conteudo.trim()
  if (!conteudo) {
    return { error: 'Conteudo e obrigatorio' }
  }

  // Validate category if provided
  if (input.categoriaId) {
    const category = await findCategoryById(input.categoriaId)
    if (!category) {
      return { error: 'Categoria nao encontrada' }
    }
  }

  // Validate tipo
  const tipo = input.tipo || 'interno'
  if (tipo !== 'interno' && tipo !== 'hsm') {
    return { error: 'Tipo deve ser "interno" ou "hsm"' }
  }

  const template = await createTemplate({
    nome,
    conteudo,
    categoriaId: input.categoriaId || null,
    tipo,
    hsmNome: tipo === 'hsm' ? input.hsmNome : null,
    hsmStatus: tipo === 'hsm' ? 'pendente' : null,
  })

  return { template }
}

export async function updateExistingTemplate(id: string, input: UpdateTemplateInput): Promise<{ template?: Template; error?: string }> {
  const existing = await findTemplateById(id)
  if (!existing) {
    return { error: 'Template nao encontrado' }
  }

  const updates: Partial<NewTemplate> = {}

  if (input.nome !== undefined) {
    const nome = input.nome.trim()
    if (!nome || nome.length > 100) {
      return { error: 'Nome deve ter entre 1 e 100 caracteres' }
    }
    updates.nome = nome
  }

  if (input.conteudo !== undefined) {
    const conteudo = input.conteudo.trim()
    if (!conteudo) {
      return { error: 'Conteudo e obrigatorio' }
    }
    updates.conteudo = conteudo
  }

  if (input.categoriaId !== undefined) {
    if (input.categoriaId === null) {
      updates.categoriaId = null
    } else {
      const category = await findCategoryById(input.categoriaId)
      if (!category) {
        return { error: 'Categoria nao encontrada' }
      }
      updates.categoriaId = input.categoriaId
    }
  }

  if (input.tipo !== undefined) {
    updates.tipo = input.tipo
  }

  if (input.hsmNome !== undefined) {
    updates.hsmNome = input.hsmNome
  }

  if (input.hsmStatus !== undefined) {
    updates.hsmStatus = input.hsmStatus
  }

  if (Object.keys(updates).length === 0) {
    return { template: existing }
  }

  const template = await updateTemplate(id, updates)
  return { template: template || undefined }
}

export async function deleteExistingTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const existing = await findTemplateById(id)
  if (!existing) {
    return { success: false, error: 'Template nao encontrado' }
  }

  const success = await deleteTemplate(id)
  return { success }
}

// ==================== TEMPLATE RENDERING ====================

export function getAvailableVariables() {
  return TEMPLATE_VARIABLES
}

export function renderTemplatePreview(conteudo: string): string {
  let rendered = conteudo

  for (const variable of TEMPLATE_VARIABLES) {
    const regex = new RegExp(`\\{${variable.key}\\}`, 'g')
    rendered = rendered.replace(regex, variable.example)
  }

  return rendered
}

export async function renderTemplateForContact(conteudo: string, contatoId: string): Promise<string> {
  const contact = await findContactById(contatoId)
  if (!contact) {
    return conteudo
  }

  const interessado = await findInteressadoByContactId(contatoId)

  const values: Record<VariableKey, string> = {
    nome: contact.nome || 'Cliente',
    telefone: contact.telefone.replace('+55', ''),
    instrumento: interessado?.instrumentoDesejado || '',
    idade: interessado?.idade?.toString() || '',
    experiencia: interessado?.experienciaMusical || '',
    disponibilidade: interessado?.disponibilidadeHorario ? 'Sim' : 'Não',
    data_cadastro: new Date(contact.createdAt).toLocaleDateString('pt-BR'),
  }

  let rendered = conteudo

  for (const variable of TEMPLATE_VARIABLES) {
    const regex = new RegExp(`\\{${variable.key}\\}`, 'g')
    rendered = rendered.replace(regex, values[variable.key] || '')
  }

  return rendered
}

// ==================== INITIALIZATION ====================

export async function initializeTemplates(): Promise<void> {
  await seedDefaultCategories()
}

// Export service object
export const templateService = {
  // Categories
  getAllCategories,
  getCategoryById,
  createCategory: createNewCategory,
  deleteCategory: deleteExistingCategory,
  // Templates
  getAll: getAllTemplates,
  getById: getTemplateById,
  create: createNewTemplate,
  update: updateExistingTemplate,
  delete: deleteExistingTemplate,
  // Rendering
  getVariables: getAvailableVariables,
  preview: renderTemplatePreview,
  renderForContact: renderTemplateForContact,
  // Init
  initialize: initializeTemplates,
}
