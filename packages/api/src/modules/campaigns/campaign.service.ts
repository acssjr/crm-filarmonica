import {
  findAllCampaigns,
  findCampaignById,
  findScheduledCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  findContactsByFilters,
  findRecipientsByCampaign,
  findRecipientsByCampaignWithContacts,
  findPendingRecipients,
  createRecipients,
  updateRecipientStatus,
  deleteRecipientsByCampaign,
  countRecipientsByStatus,
  findExecutionsByCampaign,
  createExecution,
  updateExecution,
  type CampaignFilters,
} from './campaign.repository.js'
import { findTemplateById } from '../templates/template.repository.js'
import type { Campanha, NewCampanha, CampanhaDestinatario, Contato } from '../../db/schema.js'

// ==================== CAMPAIGN CRUD ====================

export interface CreateCampaignInput {
  nome: string
  templateId: string
  filtros?: CampaignFilters
  agendadaPara?: Date
  recorrencia?: 'nenhuma' | 'diario' | 'semanal' | 'mensal'
  recorrenciaFim?: Date
}

export interface UpdateCampaignInput {
  nome?: string
  templateId?: string
  filtros?: CampaignFilters
  agendadaPara?: Date
  recorrencia?: 'nenhuma' | 'diario' | 'semanal' | 'mensal'
  recorrenciaFim?: Date
}

export async function getAllCampaigns(): Promise<Campanha[]> {
  return findAllCampaigns()
}

export async function getCampaignById(id: string): Promise<Campanha | null> {
  return findCampaignById(id)
}

export async function getCampaignWithDetails(id: string): Promise<{
  campanha: Campanha
  recipientStats: Record<string, number>
  totalRecipients: number
  executions: any[]
} | null> {
  const campanha = await findCampaignById(id)
  if (!campanha) return null

  const [recipientStats, executions] = await Promise.all([
    countRecipientsByStatus(id),
    findExecutionsByCampaign(id),
  ])

  const totalRecipients = Object.values(recipientStats).reduce((sum, count) => sum + count, 0)

  return {
    campanha,
    recipientStats,
    totalRecipients,
    executions,
  }
}

export async function createNewCampaign(input: CreateCampaignInput): Promise<{ campanha?: Campanha; error?: string }> {
  // Validate name
  const nome = input.nome.trim()
  if (!nome || nome.length > 100) {
    return { error: 'Nome deve ter entre 1 e 100 caracteres' }
  }

  // Validate template
  const template = await findTemplateById(input.templateId)
  if (!template) {
    return { error: 'Template nao encontrado' }
  }

  // Validate recorrencia
  const recorrencia = input.recorrencia || 'nenhuma'
  if (!['nenhuma', 'diario', 'semanal', 'mensal'].includes(recorrencia)) {
    return { error: 'Recorrencia invalida' }
  }

  const campanha = await createCampaign({
    nome,
    templateId: input.templateId,
    filtros: input.filtros || null,
    status: 'rascunho',
    agendadaPara: input.agendadaPara || null,
    recorrencia,
    recorrenciaFim: input.recorrenciaFim || null,
  })

  return { campanha }
}

export async function updateExistingCampaign(id: string, input: UpdateCampaignInput): Promise<{ campanha?: Campanha; error?: string }> {
  const existing = await findCampaignById(id)
  if (!existing) {
    return { error: 'Campanha nao encontrada' }
  }

  // Only allow updates to draft campaigns
  if (existing.status !== 'rascunho') {
    return { error: 'Somente campanhas em rascunho podem ser editadas' }
  }

  const updates: Partial<NewCampanha> = {}

  if (input.nome !== undefined) {
    const nome = input.nome.trim()
    if (!nome || nome.length > 100) {
      return { error: 'Nome deve ter entre 1 e 100 caracteres' }
    }
    updates.nome = nome
  }

  if (input.templateId !== undefined) {
    const template = await findTemplateById(input.templateId)
    if (!template) {
      return { error: 'Template nao encontrado' }
    }
    updates.templateId = input.templateId
  }

  if (input.filtros !== undefined) {
    updates.filtros = input.filtros
  }

  if (input.agendadaPara !== undefined) {
    updates.agendadaPara = input.agendadaPara
  }

  if (input.recorrencia !== undefined) {
    updates.recorrencia = input.recorrencia
  }

  if (input.recorrenciaFim !== undefined) {
    updates.recorrenciaFim = input.recorrenciaFim
  }

  if (Object.keys(updates).length === 0) {
    return { campanha: existing }
  }

  const campanha = await updateCampaign(id, updates)
  return { campanha: campanha || undefined }
}

export async function deleteExistingCampaign(id: string): Promise<{ success: boolean; error?: string }> {
  const existing = await findCampaignById(id)
  if (!existing) {
    return { success: false, error: 'Campanha nao encontrada' }
  }

  // Don't allow deleting running campaigns
  if (existing.status === 'em_andamento') {
    return { success: false, error: 'Nao e possivel excluir campanhas em andamento' }
  }

  const success = await deleteCampaign(id)
  return { success }
}

// ==================== RECIPIENTS ====================

export async function previewCampaignRecipients(filtros: CampaignFilters): Promise<Contato[]> {
  return findContactsByFilters(filtros)
}

export async function getCampaignRecipients(campanhaId: string): Promise<Array<CampanhaDestinatario & { contato: Contato }>> {
  return findRecipientsByCampaignWithContacts(campanhaId)
}

export async function addRecipientsFromFilters(campanhaId: string): Promise<{ count: number; error?: string }> {
  const campanha = await findCampaignById(campanhaId)
  if (!campanha) {
    return { count: 0, error: 'Campanha nao encontrada' }
  }

  if (campanha.status !== 'rascunho') {
    return { count: 0, error: 'Somente campanhas em rascunho podem ter destinatarios adicionados' }
  }

  // Clear existing recipients
  await deleteRecipientsByCampaign(campanhaId)

  // Get contacts from filters
  const filtros = (campanha.filtros as CampaignFilters) || {}
  const contacts = await findContactsByFilters(filtros)

  if (contacts.length === 0) {
    return { count: 0 }
  }

  // Create recipients
  const recipients = contacts.map(c => ({
    campanhaId,
    contatoId: c.id,
    status: 'pendente' as const,
  }))

  await createRecipients(recipients)

  return { count: contacts.length }
}

export async function addManualRecipients(campanhaId: string, contatoIds: string[]): Promise<{ count: number; error?: string }> {
  const campanha = await findCampaignById(campanhaId)
  if (!campanha) {
    return { count: 0, error: 'Campanha nao encontrada' }
  }

  if (campanha.status !== 'rascunho') {
    return { count: 0, error: 'Somente campanhas em rascunho podem ter destinatarios adicionados' }
  }

  // Get existing recipients
  const existing = await findRecipientsByCampaign(campanhaId)
  const existingIds = new Set(existing.map(r => r.contatoId))

  // Filter out already added contacts
  const newIds = contatoIds.filter(id => !existingIds.has(id))

  if (newIds.length === 0) {
    return { count: 0 }
  }

  // Create recipients
  const recipients = newIds.map(contatoId => ({
    campanhaId,
    contatoId,
    status: 'pendente' as const,
  }))

  await createRecipients(recipients)

  return { count: newIds.length }
}

export async function removeRecipient(campanhaId: string, contatoId: string): Promise<{ success: boolean; error?: string }> {
  const campanha = await findCampaignById(campanhaId)
  if (!campanha) {
    return { success: false, error: 'Campanha nao encontrada' }
  }

  if (campanha.status !== 'rascunho') {
    return { success: false, error: 'Somente campanhas em rascunho podem ter destinatarios removidos' }
  }

  // This is a bit hacky but works for now
  const recipients = await findRecipientsByCampaign(campanhaId)
  const recipient = recipients.find(r => r.contatoId === contatoId)

  if (!recipient) {
    return { success: false, error: 'Destinatario nao encontrado' }
  }

  await updateRecipientStatus(recipient.id, 'falhou', 'Removido manualmente')
  return { success: true }
}

// ==================== SCHEDULING ====================

export async function scheduleCampaign(id: string, agendadaPara: Date): Promise<{ success: boolean; error?: string }> {
  const campanha = await findCampaignById(id)
  if (!campanha) {
    return { success: false, error: 'Campanha nao encontrada' }
  }

  if (campanha.status !== 'rascunho') {
    return { success: false, error: 'Somente campanhas em rascunho podem ser agendadas' }
  }

  // Check if has recipients
  const stats = await countRecipientsByStatus(id)
  const totalRecipients = Object.values(stats).reduce((sum, count) => sum + count, 0)

  if (totalRecipients === 0) {
    return { success: false, error: 'Campanha precisa ter destinatarios' }
  }

  // Validate date is in the future
  if (agendadaPara <= new Date()) {
    return { success: false, error: 'Data de agendamento deve ser no futuro' }
  }

  await updateCampaign(id, {
    status: 'agendada',
    agendadaPara,
  })

  return { success: true }
}

export async function cancelCampaign(id: string): Promise<{ success: boolean; error?: string }> {
  const campanha = await findCampaignById(id)
  if (!campanha) {
    return { success: false, error: 'Campanha nao encontrada' }
  }

  if (campanha.status === 'concluida' || campanha.status === 'cancelada') {
    return { success: false, error: 'Campanha ja foi finalizada' }
  }

  await updateCampaign(id, { status: 'cancelada' })

  return { success: true }
}

// ==================== EXECUTION ====================

export async function startCampaignExecution(id: string): Promise<{ executionId?: string; error?: string }> {
  const campanha = await findCampaignById(id)
  if (!campanha) {
    return { error: 'Campanha nao encontrada' }
  }

  if (campanha.status !== 'agendada') {
    return { error: 'Campanha nao esta agendada' }
  }

  // Update campaign status
  await updateCampaign(id, { status: 'em_andamento' })

  // Create execution record
  const execution = await createExecution({
    campanhaId: id,
    totalEnviadas: 0,
    totalEntregues: 0,
    totalLidas: 0,
    totalRespondidas: 0,
    totalFalhas: 0,
  })

  return { executionId: execution.id }
}

export async function completeCampaignExecution(executionId: string, stats: {
  totalEnviadas: number
  totalEntregues: number
  totalLidas: number
  totalRespondidas: number
  totalFalhas: number
}): Promise<void> {
  await updateExecution(executionId, {
    ...stats,
    concluidaAt: new Date(),
  })
}

export async function finishCampaign(campanhaId: string): Promise<void> {
  const campanha = await findCampaignById(campanhaId)
  if (!campanha) return

  // Check if should schedule next recurrence
  if (campanha.recorrencia !== 'nenhuma') {
    const now = new Date()
    let nextDate: Date | null = null

    switch (campanha.recorrencia) {
      case 'diario':
        nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'semanal':
        nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'mensal':
        nextDate = new Date(now)
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
    }

    // Check if next date is before recurrence end
    if (nextDate && (!campanha.recorrenciaFim || nextDate <= campanha.recorrenciaFim)) {
      // Reset recipients to pending and reschedule
      const recipients = await findRecipientsByCampaign(campanhaId)
      for (const recipient of recipients) {
        if (recipient.status !== 'falhou') {
          await updateRecipientStatus(recipient.id, 'pendente')
        }
      }

      await updateCampaign(campanhaId, {
        status: 'agendada',
        agendadaPara: nextDate,
      })

      return
    }
  }

  // Mark as completed
  await updateCampaign(campanhaId, { status: 'concluida' })
}

// Export service object
export const campaignService = {
  getAll: getAllCampaigns,
  getById: getCampaignById,
  getWithDetails: getCampaignWithDetails,
  create: createNewCampaign,
  update: updateExistingCampaign,
  delete: deleteExistingCampaign,
  previewRecipients: previewCampaignRecipients,
  getRecipients: getCampaignRecipients,
  addRecipientsFromFilters,
  addManualRecipients,
  removeRecipient,
  schedule: scheduleCampaign,
  cancel: cancelCampaign,
  startExecution: startCampaignExecution,
  finishCampaign,
  findScheduledCampaigns,
  findPendingRecipients,
  updateRecipientStatus,
}
