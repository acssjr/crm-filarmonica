import type {
  Origem,
  TipoContato,
  EstadoJornada,
  Canal,
  StatusConversa,
  DirecaoMensagem,
  TipoMensagem,
  StatusEnvio,
} from './enums.js'

// Administrador
export interface Administrador {
  id: string
  nome: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// Contato
export interface Contato {
  id: string
  telefone: string
  nome: string | null
  tipo: TipoContato
  origem: Origem
  origemCampanha: string | null
  canal: Canal
  estadoJornada: EstadoJornada
  createdAt: Date
  updatedAt: Date
}

// Interessado (Prospect)
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
  createdAt: Date
}

// Conversa
export interface Conversa {
  id: string
  contatoId: string
  canal: Canal
  status: StatusConversa
  createdAt: Date
  updatedAt: Date
  closedAt: Date | null
}

// Mensagem
export interface Mensagem {
  id: string
  conversaId: string
  direcao: DirecaoMensagem
  conteudo: string
  tipo: TipoMensagem
  enviadoPor: string | null
  whatsappId: string | null
  statusEnvio: StatusEnvio
  createdAt: Date
}

// Evento
export interface Evento {
  id: string
  contatoId: string | null
  tipo: string
  dados: Record<string, unknown> | null
  createdAt: Date
}

// Extended types with relations
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
