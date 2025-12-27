import {
  findContactByPhone,
  findContactById,
  createContact,
  updateContact,
  listContacts,
  type ListContactsParams,
  type PaginatedContacts,
} from './contact.repository.js'
import type { Contato, NewContato } from '../../db/schema.js'

export interface FindOrCreateResult {
  contact: Contato
  isNew: boolean
}

export async function findOrCreateContact(
  telefone: string,
  origem: 'organico' | 'campanha' | 'indicacao' = 'organico',
  origemCampanha?: string
): Promise<FindOrCreateResult> {
  // Normalize phone number (remove non-digits, ensure country code)
  const normalizedPhone = normalizePhoneNumber(telefone)

  // Try to find existing contact
  const existing = await findContactByPhone(normalizedPhone)

  if (existing) {
    // Update last interaction time
    await updateContact(existing.id, { updatedAt: new Date() })
    return { contact: existing, isNew: false }
  }

  // Create new contact
  const newContact = await createContact({
    telefone: normalizedPhone,
    origem,
    origemCampanha: origem === 'campanha' ? origemCampanha : null,
    canal: 'whatsapp',
    tipo: 'desconhecido',
    estadoJornada: 'inicial',
  })

  return { contact: newContact, isNew: true }
}

export async function getContactById(id: string): Promise<Contato | null> {
  return findContactById(id)
}

export async function updateContactDetails(
  id: string,
  data: Partial<Pick<NewContato, 'nome' | 'tipo' | 'estadoJornada'>>
): Promise<Contato | null> {
  return updateContact(id, data)
}

export async function updateContactJourneyState(
  id: string,
  estadoJornada: Contato['estadoJornada']
): Promise<Contato | null> {
  return updateContact(id, { estadoJornada })
}

export async function getContacts(params: ListContactsParams): Promise<PaginatedContacts> {
  return listContacts(params)
}

// Helper function to normalize phone numbers to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '')

  // If starts with 0, remove it (common in Brazilian numbers)
  if (digits.startsWith('0')) {
    digits = digits.substring(1)
  }

  // If doesn't have country code (less than 12 digits for Brazil), add +55
  if (digits.length <= 11) {
    digits = '55' + digits
  }

  return '+' + digits
}

// Parse campaign code from WhatsApp message text
export function parseCampaignCode(text?: string): string | undefined {
  if (!text) return undefined

  // Look for campaign patterns like CAMP01, PROMO2024, etc.
  const match = text.match(/^([A-Z]{2,10}\d{1,4})$/i)
  return match ? match[1].toUpperCase() : undefined
}

// Service object for consistent API across modules
export const contactService = {
  findOrCreate: findOrCreateContact,
  getById: getContactById,
  update: updateContactDetails,
  updateJourneyState: updateContactJourneyState,
  getAll: getContacts,
  parseCampaignCode,
}
