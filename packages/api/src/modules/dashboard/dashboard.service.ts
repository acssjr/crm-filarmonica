import {
  getTotalContacts,
  countNewContactsToday,
  countContactsByOrigem,
  countContactsByEstado,
} from '../contacts/contact.repository.js'
import { countActiveConversations } from '../conversations/conversation.repository.js'

export interface DashboardStats {
  totalContatos: number
  conversasAtivas: number
  novosContatosHoje: number
  contatosPorOrigem: Record<string, number>
  contatosPorEstado: Record<string, number>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalContatos,
    conversasAtivas,
    novosContatosHoje,
    contatosPorOrigem,
    contatosPorEstado,
  ] = await Promise.all([
    getTotalContacts(),
    countActiveConversations(),
    countNewContactsToday(),
    countContactsByOrigem(),
    countContactsByEstado(),
  ])

  return {
    totalContatos,
    conversasAtivas,
    novosContatosHoje,
    contatosPorOrigem,
    contatosPorEstado,
  }
}
