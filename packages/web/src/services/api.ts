const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

type Params = Record<string, string | number | boolean | undefined>

interface RequestOptions extends RequestInit {
  params?: Params
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(response.status, error.message || 'Request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// ============ Types ============

// Base types
export interface Contato {
  id: string
  telefone: string
  nome: string | null
  tipo: string
  origem: string
  origemCampanha: string | null
  canal: string
  estadoJornada: string
  createdAt: string
  updatedAt: string
}

export interface Interessado {
  id: string
  contatoId: string
  nome: string
  idade: number
  instrumentoDesejado: string
  instrumentoSugerido: string | null
  experienciaMusical: string | null
  expectativas: string | null
  disponibilidadeHorario: boolean
  compativel: boolean
  createdAt: string
}

export interface Conversa {
  id: string
  contatoId: string
  canal: string
  status: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface Mensagem {
  id: string
  conversaId: string
  direcao: string
  conteudo: string
  tipo: string
  enviadoPor: string | null
  whatsappId: string | null
  statusEnvio: string
  createdAt: string
}

// Extended types
export interface ContatoComInteressado extends Contato {
  interessado?: Interessado
}

export interface ConversaComContato extends Conversa {
  contato: Contato
  ultimaMensagem?: Mensagem
}

export interface ConversaComMensagens extends Conversa {
  contato: Contato
  mensagens: Mensagem[]
}

export interface InteressadoComContato extends Interessado {
  contato: Contato
}

// ============ Auth ============

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    nome: string
    email: string
  }
}

export interface MeResponse {
  user: {
    id: string
    nome: string
    email: string
  }
}

export const auth = {
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  me: () => request<MeResponse>('/auth/me'),
}

// ============ Dashboard ============

export interface DashboardStats {
  totalContatos: number
  conversasAtivas: number
  novosHoje: number
  interessadosQualificados: number
  porOrigem: { origem: string; count: number }[]
  porEstadoJornada: { estado: string; count: number }[]
}

export const dashboard = {
  stats: () => request<DashboardStats>('/dashboard/stats'),
}

// ============ Contacts ============

export interface ContactsParams {
  page?: number
  limit?: number
  origem?: string
  estadoJornada?: string
  search?: string
}

export interface ContactsResponse {
  data: Contato[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContactDetailResponse {
  contato: ContatoComInteressado
}

export const contacts = {
  list: (params?: ContactsParams) =>
    request<ContactsResponse>('/contacts', { params: params as Params }),

  get: (id: string) => request<ContactDetailResponse>(`/contacts/${id}`),

  update: (id: string, data: Partial<Contato>) =>
    request<ContactDetailResponse>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// ============ Conversations ============

export interface ConversationsParams {
  page?: number
  limit?: number
  status?: string
}

export interface ConversationsResponse {
  data: ConversaComContato[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ConversationDetailResponse {
  conversa: ConversaComMensagens
}

export const conversations = {
  list: (params?: ConversationsParams) =>
    request<ConversationsResponse>('/conversations', { params: params as Params }),

  get: (id: string) => request<ConversationDetailResponse>(`/conversations/${id}`),

  getByContact: (contactId: string) =>
    request<{ data: Conversa[] }>(`/contacts/${contactId}/conversations`),
}

// ============ Messages ============

export interface MessagesParams {
  page?: number
  limit?: number
}

export interface MessagesResponse {
  data: Mensagem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SendMessageRequest {
  conteudo: string
}

export const messages = {
  list: (conversationId: string, params?: MessagesParams) =>
    request<MessagesResponse>(`/conversations/${conversationId}/messages`, {
      params: params as Params,
    }),

  send: (conversationId: string, data: SendMessageRequest) =>
    request<{ mensagem: Mensagem }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ============ Prospects ============

export interface ProspectsParams {
  page?: number
  limit?: number
  compativel?: boolean
}

export interface ProspectsResponse {
  data: InteressadoComContato[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProspectDetailResponse {
  interessado: InteressadoComContato
}

export const prospects = {
  list: (params?: ProspectsParams) =>
    request<ProspectsResponse>('/prospects', { params: params as Params }),

  get: (id: string) => request<ProspectDetailResponse>(`/prospects/${id}`),
}

export { ApiError }
