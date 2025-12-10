import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core'

// Enums
export const origemEnum = pgEnum('origem', ['organico', 'campanha', 'indicacao'])
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
export const canalEnum = pgEnum('canal', ['whatsapp'])
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
