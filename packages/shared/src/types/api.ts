import type { Administrador, Contato, Conversa, Mensagem, Interessado } from './entities.js'
import type { EstadoJornada, Origem, TipoContato } from './enums.js'

// Auth
export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  admin: Administrador
  expiresAt: string
}

// Dashboard
export interface DashboardStats {
  totalContatos: number
  conversasAtivas: number
  novosContatosHoje: number
  contatosPorOrigem: Record<string, number>
  contatosPorEstado: Record<string, number>
}

// Pagination
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// Contacts
export interface ContactListParams {
  page?: number
  limit?: number
  search?: string
  origem?: Origem
  estadoJornada?: EstadoJornada
}

export interface ContactUpdate {
  nome?: string
  tipo?: TipoContato
  estadoJornada?: EstadoJornada
}

export interface ContactDetail extends Contato {
  interessado?: Interessado
  ultimaConversa?: Conversa
}

// Conversations
export interface ConversationWithContact extends Conversa {
  contato: Contato
  ultimaMensagem?: Mensagem
}

export interface ConversationDetail extends Conversa {
  contato: Contato
  mensagens: Mensagem[]
}

// Messages
export interface SendMessageRequest {
  conteudo: string
}

export interface ListMessagesParams {
  before?: string
  limit?: number
}

// Prospects
export interface ProspectListParams {
  compativel?: boolean
  instrumento?: string
}

export interface ProspectWithContact extends Interessado {
  contato: Contato
}

export interface ProspectDetail extends Interessado {
  contato: ContactDetail
}

// Error
export interface ApiError {
  error: string
  message: string
  statusCode: number
}
