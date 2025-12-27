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

// Canal de comunicacao (prepared for omnichannel)
export const Canal = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  MESSENGER: 'messenger',
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

// ==================== TAGS ====================

// Cores de tags
export const TagCor = {
  GRAY: 'gray',
  RED: 'red',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
  PURPLE: 'purple',
  PINK: 'pink',
} as const

export type TagCor = (typeof TagCor)[keyof typeof TagCor]

// ==================== TEMPLATES ====================

// Tipo de template
export const TemplateTipo = {
  INTERNO: 'interno',
  HSM: 'hsm',
} as const

export type TemplateTipo = (typeof TemplateTipo)[keyof typeof TemplateTipo]

// Status do HSM
export const HsmStatus = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
} as const

export type HsmStatus = (typeof HsmStatus)[keyof typeof HsmStatus]

// ==================== CAMPANHAS ====================

// Status da campanha
export const CampanhaStatus = {
  RASCUNHO: 'rascunho',
  AGENDADA: 'agendada',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
} as const

export type CampanhaStatus = (typeof CampanhaStatus)[keyof typeof CampanhaStatus]

// Recorrência da campanha
export const CampanhaRecorrencia = {
  NENHUMA: 'nenhuma',
  DIARIO: 'diario',
  SEMANAL: 'semanal',
  MENSAL: 'mensal',
} as const

export type CampanhaRecorrencia = (typeof CampanhaRecorrencia)[keyof typeof CampanhaRecorrencia]

// Status do destinatário
export const DestinatarioStatus = {
  PENDENTE: 'pendente',
  ENVIADA: 'enviada',
  ENTREGUE: 'entregue',
  LIDA: 'lida',
  RESPONDIDA: 'respondida',
  FALHOU: 'falhou',
} as const

export type DestinatarioStatus = (typeof DestinatarioStatus)[keyof typeof DestinatarioStatus]
