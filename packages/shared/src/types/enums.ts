// Origem do contato
export const Origem = {
  ORGANICO: 'organico',
  CAMPANHA: 'campanha',
  INDICACAO: 'indicacao',
} as const

export type Origem = (typeof Origem)[keyof typeof Origem]

// Tipo do contato
export const TipoContato = {
  DESCONHECIDO: 'desconhecido',
  RESPONSAVEL: 'responsavel',
  INTERESSADO_DIRETO: 'interessado_direto',
} as const

export type TipoContato = (typeof TipoContato)[keyof typeof TipoContato]

// Estado da jornada do contato
export const EstadoJornada = {
  INICIAL: 'inicial',
  BOAS_VINDAS: 'boas_vindas',
  COLETANDO_NOME: 'coletando_nome',
  COLETANDO_IDADE: 'coletando_idade',
  COLETANDO_INSTRUMENTO: 'coletando_instrumento',
  VERIFICANDO_SAXOFONE: 'verificando_saxofone',
  COLETANDO_EXPERIENCIA: 'coletando_experiencia',
  COLETANDO_DISPONIBILIDADE: 'coletando_disponibilidade',
  INCOMPATIVEL: 'incompativel',
  QUALIFICADO: 'qualificado',
  ATENDIMENTO_HUMANO: 'atendimento_humano',
} as const

export type EstadoJornada = (typeof EstadoJornada)[keyof typeof EstadoJornada]

// Canal de comunicacao
export const Canal = {
  WHATSAPP: 'whatsapp',
} as const

export type Canal = (typeof Canal)[keyof typeof Canal]

// Status da conversa
export const StatusConversa = {
  ATIVA: 'ativa',
  ENCERRADA: 'encerrada',
} as const

export type StatusConversa = (typeof StatusConversa)[keyof typeof StatusConversa]

// Direcao da mensagem
export const DirecaoMensagem = {
  ENTRADA: 'entrada',
  SAIDA: 'saida',
} as const

export type DirecaoMensagem = (typeof DirecaoMensagem)[keyof typeof DirecaoMensagem]

// Tipo da mensagem
export const TipoMensagem = {
  TEXTO: 'texto',
  AUTOMATICA: 'automatica',
  MANUAL: 'manual',
} as const

export type TipoMensagem = (typeof TipoMensagem)[keyof typeof TipoMensagem]

// Status de envio da mensagem
export const StatusEnvio = {
  PENDENTE: 'pendente',
  ENVIADA: 'enviada',
  ENTREGUE: 'entregue',
  LIDA: 'lida',
  FALHOU: 'falhou',
} as const

export type StatusEnvio = (typeof StatusEnvio)[keyof typeof StatusEnvio]

// Tipos de eventos
export const TipoEvento = {
  PRIMEIRO_CONTATO: 'primeiro_contato',
  MENSAGEM_RECEBIDA: 'mensagem_recebida',
  MENSAGEM_ENVIADA: 'mensagem_enviada',
  INTENCAO_DETECTADA: 'intencao_detectada',
  JORNADA_ATUALIZADA: 'jornada_atualizada',
  FICHA_GERADA: 'ficha_gerada',
  HORARIO_INCOMPATIVEL: 'horario_incompativel',
  ATENDIMENTO_HUMANO: 'atendimento_humano',
} as const

export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento]
