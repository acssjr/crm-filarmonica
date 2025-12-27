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

// ============ Tags ============

export interface Tag {
  id: string
  nome: string
  cor: 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  createdAt: string
}

export interface CreateTagRequest {
  nome: string
  cor?: Tag['cor']
}

export const tags = {
  list: () => request<Tag[]>('/tags'),

  get: (id: string) => request<Tag>(`/tags/${id}`),

  create: (data: CreateTagRequest) =>
    request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateTagRequest>) =>
    request<Tag>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/tags/${id}`, { method: 'DELETE' }),

  getContactTags: (contactId: string) =>
    request<Tag[]>(`/contacts/${contactId}/tags`),

  updateContactTags: (contactId: string, tagIds: string[]) =>
    request<Tag[]>(`/contacts/${contactId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tagIds }),
    }),
}

// ============ Templates ============

export interface TemplateCategoria {
  id: string
  nome: string
  isSistema: boolean
  createdAt: string
}

export interface Template {
  id: string
  categoriaId: string | null
  nome: string
  conteudo: string
  tipo: 'interno' | 'hsm'
  hsmNome: string | null
  hsmStatus: 'pendente' | 'aprovado' | 'rejeitado' | null
  createdAt: string
  updatedAt: string
  categoria: TemplateCategoria | null
}

export interface TemplateVariable {
  key: string
  label: string
  example: string
}

export interface CreateTemplateRequest {
  nome: string
  conteudo: string
  categoriaId?: string
  tipo?: 'interno' | 'hsm'
  hsmNome?: string
}

export const templates = {
  list: (categoriaId?: string) =>
    request<Template[]>('/templates', { params: { categoriaId } }),

  get: (id: string) => request<Template>(`/templates/${id}`),

  create: (data: CreateTemplateRequest) =>
    request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateTemplateRequest>) =>
    request<Template>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/templates/${id}`, { method: 'DELETE' }),

  preview: (id: string) =>
    request<{ original: string; preview: string }>(`/templates/${id}/preview`, {
      method: 'POST',
    }),

  previewContent: (conteudo: string) =>
    request<{ original: string; preview: string }>('/templates/preview', {
      method: 'POST',
      body: JSON.stringify({ conteudo }),
    }),

  test: (id: string, telefone: string) =>
    request<{ success: boolean; message: string; preview: string }>(`/templates/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ telefone }),
    }),

  getVariables: () => request<TemplateVariable[]>('/templates/variables'),

  listCategorias: () => request<TemplateCategoria[]>('/template-categorias'),

  createCategoria: (nome: string) =>
    request<TemplateCategoria>('/template-categorias', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    }),

  deleteCategoria: (id: string) =>
    request<void>(`/template-categorias/${id}`, { method: 'DELETE' }),
}

// ============ Campanhas ============

export interface CampaignFilters {
  origem?: string[]
  estadoJornada?: string[]
  tags?: string[]
  instrumento?: string[]
  canal?: string[]
}

export interface Campanha {
  id: string
  nome: string
  templateId: string
  filtros: CampaignFilters | null
  status: 'rascunho' | 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'
  agendadaPara: string | null
  recorrencia: 'nenhuma' | 'diario' | 'semanal' | 'mensal'
  recorrenciaFim: string | null
  createdAt: string
  updatedAt: string
}

export interface CampanhaDestinatario {
  id: string
  campanhaId: string
  contatoId: string
  status: 'pendente' | 'enviada' | 'entregue' | 'lida' | 'respondida' | 'falhou'
  erro: string | null
  enviadaAt: string | null
  entregueAt: string | null
  lidaAt: string | null
  respondidaAt: string | null
  contato: Contato
}

export interface CampanhaDetails {
  campanha: Campanha
  recipientStats: Record<string, number>
  totalRecipients: number
  executions: any[]
}

export interface CreateCampanhaRequest {
  nome: string
  templateId: string
  filtros?: CampaignFilters
  agendadaPara?: string
  recorrencia?: Campanha['recorrencia']
  recorrenciaFim?: string
}

export const campanhas = {
  list: () => request<Campanha[]>('/campanhas'),

  get: (id: string) => request<CampanhaDetails>(`/campanhas/${id}`),

  create: (data: CreateCampanhaRequest) =>
    request<Campanha>('/campanhas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateCampanhaRequest>) =>
    request<Campanha>(`/campanhas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/campanhas/${id}`, { method: 'DELETE' }),

  previewRecipients: (filtros: CampaignFilters) =>
    request<{ total: number; contacts: Contato[] }>('/campanhas/preview-recipients', {
      method: 'POST',
      body: JSON.stringify({ filtros }),
    }),

  getDestinatarios: (id: string) =>
    request<CampanhaDestinatario[]>(`/campanhas/${id}/destinatarios`),

  addDestinatarios: (id: string, options: { contatoIds?: string[]; fromFilters?: boolean }) =>
    request<{ added: number }>(`/campanhas/${id}/destinatarios`, {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  agendar: (id: string, agendadaPara: string) =>
    request<Campanha>(`/campanhas/${id}/agendar`, {
      method: 'POST',
      body: JSON.stringify({ agendadaPara }),
    }),

  cancelar: (id: string) =>
    request<Campanha>(`/campanhas/${id}/cancelar`, { method: 'POST' }),
}

// ============ Relatórios ============

export interface ContactsReport {
  total: number
  novosNoPeriodo: number
  porOrigem: { origem: string; count: number }[]
  porCanal: { canal: string; count: number }[]
  porDia: { data: string; count: number }[]
  crescimento: number
}

export interface ConversationsReport {
  total: number
  ativas: number
  encerradas: number
  mensagensPorDia: { data: string; entrada: number; saida: number }[]
  tempoMedioRespostaMinutos: number
}

export interface FunnelReport {
  etapas: { estado: string; count: number; percentual: number }[]
  taxaConversao: number
}

export interface CampaignsReport {
  total: number
  porStatus: { status: string; count: number }[]
  metricas: {
    totalEnviadas: number
    totalEntregues: number
    totalLidas: number
    totalRespondidas: number
    totalFalhas: number
    taxaEntrega: number
    taxaLeitura: number
    taxaResposta: number
  }
}

export interface InstrumentsReport {
  distribuicao: { instrumento: string; count: number; percentual: number }[]
  compativeis: number
  incompativeis: number
  taxaCompatibilidade: number
}

export interface ReportParams {
  inicio?: string
  fim?: string
  periodo?: '7d' | '30d' | '90d' | '365d'
}

export const relatorios = {
  contatos: (params?: ReportParams) =>
    request<ContactsReport>('/relatorios/contatos', { params: params as Params }),

  conversas: (params?: ReportParams) =>
    request<ConversationsReport>('/relatorios/conversas', { params: params as Params }),

  funil: () => request<FunnelReport>('/relatorios/funil'),

  campanhas: (params?: ReportParams) =>
    request<CampaignsReport>('/relatorios/campanhas', { params: params as Params }),

  instrumentos: () => request<InstrumentsReport>('/relatorios/instrumentos'),

  exportCsv: (tipo: 'contatos' | 'funil' | 'instrumentos', params?: ReportParams) => {
    const searchParams = new URLSearchParams()
    if (params?.inicio) searchParams.append('inicio', params.inicio)
    if (params?.fim) searchParams.append('fim', params.fim)
    if (params?.periodo) searchParams.append('periodo', params.periodo)
    const query = searchParams.toString()
    window.open(`${API_BASE_URL}/relatorios/${tipo}/export${query ? '?' + query : ''}`, '_blank')
  },
}

export { ApiError }
