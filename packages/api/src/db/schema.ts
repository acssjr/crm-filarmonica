import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, jsonb, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core'

// Enums
export const origemEnum = pgEnum('origem', ['organico', 'campanha', 'indicacao'])

// Tag color enum
export const tagCorEnum = pgEnum('tag_cor', ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])

// Template enums
export const templateTipoEnum = pgEnum('template_tipo', ['interno', 'hsm'])
export const hsmStatusEnum = pgEnum('hsm_status', ['pendente', 'aprovado', 'rejeitado'])

// Campaign enums
export const campanhaStatusEnum = pgEnum('campanha_status', ['rascunho', 'agendada', 'em_andamento', 'concluida', 'cancelada'])
export const campanhaRecorrenciaEnum = pgEnum('campanha_recorrencia', ['nenhuma', 'diario', 'semanal', 'mensal'])
export const destinatarioStatusEnum = pgEnum('destinatario_status', ['pendente', 'enviada', 'entregue', 'lida', 'respondida', 'falhou'])
export const tipoContatoEnum = pgEnum('tipo_contato', ['desconhecido', 'responsavel', 'interessado_direto'])
export const estadoJornadaEnum = pgEnum('estado_jornada', [
  'inicial',
  'boas_vindas',
  'coletando_nome',
  'coletando_idade',
  'coletando_instrumento',
  'verificando_saxofone',
  'coletando_experiencia',
  'coletando_disponibilidade',
  'incompativel',
  'qualificado',
  'atendimento_humano',
])
export const canalEnum = pgEnum('canal', ['whatsapp', 'instagram', 'messenger'])
export const statusConversaEnum = pgEnum('status_conversa', ['ativa', 'encerrada'])
export const direcaoMensagemEnum = pgEnum('direcao_mensagem', ['entrada', 'saida'])
export const tipoMensagemEnum = pgEnum('tipo_mensagem', ['texto', 'automatica', 'manual'])
export const statusEnvioEnum = pgEnum('status_envio', ['pendente', 'enviada', 'entregue', 'lida', 'falhou'])

// Administrador
export const administradores = pgTable('administradores', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Contato
export const contatos = pgTable('contatos', {
  id: uuid('id').primaryKey().defaultRandom(),
  telefone: varchar('telefone', { length: 20 }).notNull().unique(),
  nome: varchar('nome', { length: 200 }),
  tipo: tipoContatoEnum('tipo').notNull().default('desconhecido'),
  origem: origemEnum('origem').notNull().default('organico'),
  origemCampanha: varchar('origem_campanha', { length: 50 }),
  canal: canalEnum('canal').notNull().default('whatsapp'),
  estadoJornada: estadoJornadaEnum('estado_jornada').notNull().default('inicial'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('idx_contato_telefone').on(table.telefone),
  index('idx_contato_estado').on(table.estadoJornada),
  index('idx_contato_origem').on(table.origem),
  index('idx_contato_created').on(table.createdAt),
])

// Interessado
export const interessados = pgTable('interessados', {
  id: uuid('id').primaryKey().defaultRandom(),
  contatoId: uuid('contato_id').notNull().references(() => contatos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  idade: integer('idade').notNull(),
  instrumentoDesejado: varchar('instrumento_desejado', { length: 100 }).notNull(),
  instrumentoSugerido: varchar('instrumento_sugerido', { length: 100 }),
  experienciaMusical: text('experiencia_musical'),
  expectativas: text('expectativas'),
  disponibilidadeHorario: boolean('disponibilidade_horario').notNull(),
  compativel: boolean('compativel').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_interessado_contato').on(table.contatoId),
  index('idx_interessado_instrumento').on(table.instrumentoDesejado),
])

// Conversa
export const conversas = pgTable('conversas', {
  id: uuid('id').primaryKey().defaultRandom(),
  contatoId: uuid('contato_id').notNull().references(() => contatos.id),
  canal: canalEnum('canal').notNull(),
  status: statusConversaEnum('status').notNull().default('ativa'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => [
  index('idx_conversa_contato').on(table.contatoId),
  index('idx_conversa_status').on(table.status),
  index('idx_conversa_updated').on(table.updatedAt),
])

// Mensagem
export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').notNull().references(() => conversas.id),
  direcao: direcaoMensagemEnum('direcao').notNull(),
  conteudo: text('conteudo').notNull(),
  tipo: tipoMensagemEnum('tipo').notNull(),
  enviadoPor: uuid('enviado_por').references(() => administradores.id),
  whatsappId: varchar('whatsapp_id', { length: 100 }),
  statusEnvio: statusEnvioEnum('status_envio').notNull().default('enviada'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_mensagem_conversa').on(table.conversaId, table.createdAt),
  uniqueIndex('idx_mensagem_whatsapp').on(table.whatsappId),
])

// Evento
export const eventos = pgTable('eventos', {
  id: uuid('id').primaryKey().defaultRandom(),
  contatoId: uuid('contato_id').references(() => contatos.id),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  dados: jsonb('dados'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_evento_contato').on(table.contatoId),
  index('idx_evento_tipo').on(table.tipo),
  index('idx_evento_created').on(table.createdAt),
])

// ==================== TAGS ====================

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 50 }).notNull().unique(),
  cor: tagCorEnum('cor').notNull().default('gray'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Contato-Tags (many-to-many)
export const contatoTags = pgTable('contato_tags', {
  contatoId: uuid('contato_id').notNull().references(() => contatos.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.contatoId, table.tagId] }),
  index('idx_contato_tags_contato').on(table.contatoId),
  index('idx_contato_tags_tag').on(table.tagId),
])

// ==================== TEMPLATES ====================

// Template Categories
export const templateCategorias = pgTable('template_categorias', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 50 }).notNull().unique(),
  isSistema: boolean('is_sistema').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Templates
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoriaId: uuid('categoria_id').references(() => templateCategorias.id, { onDelete: 'set null' }),
  nome: varchar('nome', { length: 100 }).notNull(),
  conteudo: text('conteudo').notNull(),
  tipo: templateTipoEnum('tipo').notNull().default('interno'),
  hsmNome: varchar('hsm_nome', { length: 100 }),
  hsmStatus: hsmStatusEnum('hsm_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_templates_categoria').on(table.categoriaId),
  index('idx_templates_tipo').on(table.tipo),
])

// ==================== CAMPANHAS ====================

// Campanhas
export const campanhas = pgTable('campanhas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 100 }).notNull(),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  filtros: jsonb('filtros'),
  status: campanhaStatusEnum('status').notNull().default('rascunho'),
  agendadaPara: timestamp('agendada_para', { withTimezone: true }),
  recorrencia: campanhaRecorrenciaEnum('recorrencia').notNull().default('nenhuma'),
  recorrenciaFim: timestamp('recorrencia_fim', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_campanhas_status').on(table.status),
  index('idx_campanhas_agendada').on(table.agendadaPara),
])

// Campanha Destinatários
export const campanhaDestinatarios = pgTable('campanha_destinatarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  campanhaId: uuid('campanha_id').notNull().references(() => campanhas.id, { onDelete: 'cascade' }),
  contatoId: uuid('contato_id').notNull().references(() => contatos.id),
  status: destinatarioStatusEnum('status').notNull().default('pendente'),
  erro: text('erro'),
  enviadaAt: timestamp('enviada_at', { withTimezone: true }),
  entregueAt: timestamp('entregue_at', { withTimezone: true }),
  lidaAt: timestamp('lida_at', { withTimezone: true }),
  respondidaAt: timestamp('respondida_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('idx_campanha_dest_unique').on(table.campanhaId, table.contatoId),
  index('idx_campanha_dest_campanha').on(table.campanhaId),
  index('idx_campanha_dest_status').on(table.status),
])

// Campanha Execuções (para recorrência)
export const campanhaExecucoes = pgTable('campanha_execucoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  campanhaId: uuid('campanha_id').notNull().references(() => campanhas.id, { onDelete: 'cascade' }),
  iniciadaAt: timestamp('iniciada_at', { withTimezone: true }).notNull().defaultNow(),
  concluidaAt: timestamp('concluida_at', { withTimezone: true }),
  totalEnviadas: integer('total_enviadas').notNull().default(0),
  totalEntregues: integer('total_entregues').notNull().default(0),
  totalLidas: integer('total_lidas').notNull().default(0),
  totalRespondidas: integer('total_respondidas').notNull().default(0),
  totalFalhas: integer('total_falhas').notNull().default(0),
}, (table) => [
  index('idx_campanha_exec_campanha').on(table.campanhaId),
])

// Type exports for Drizzle
export type Administrador = typeof administradores.$inferSelect
export type NewAdministrador = typeof administradores.$inferInsert
export type Contato = typeof contatos.$inferSelect
export type NewContato = typeof contatos.$inferInsert
export type Interessado = typeof interessados.$inferSelect
export type NewInteressado = typeof interessados.$inferInsert
export type Conversa = typeof conversas.$inferSelect
export type NewConversa = typeof conversas.$inferInsert
export type Mensagem = typeof mensagens.$inferSelect
export type NewMensagem = typeof mensagens.$inferInsert
export type Evento = typeof eventos.$inferSelect
export type NewEvento = typeof eventos.$inferInsert

// Tags
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type ContatoTag = typeof contatoTags.$inferSelect
export type NewContatoTag = typeof contatoTags.$inferInsert

// Templates
export type TemplateCategoria = typeof templateCategorias.$inferSelect
export type NewTemplateCategoria = typeof templateCategorias.$inferInsert
export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert

// Campanhas
export type Campanha = typeof campanhas.$inferSelect
export type NewCampanha = typeof campanhas.$inferInsert
export type CampanhaDestinatario = typeof campanhaDestinatarios.$inferSelect
export type NewCampanhaDestinatario = typeof campanhaDestinatarios.$inferInsert
export type CampanhaExecucao = typeof campanhaExecucoes.$inferSelect
export type NewCampanhaExecucao = typeof campanhaExecucoes.$inferInsert
