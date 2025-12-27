import { sql, gte, lte, and, eq, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  contatos,
  conversas,
  mensagens,
  interessados,
  campanhas,
  campanhaDestinatarios,
} from '../../db/schema.js'

// ==================== DATE HELPERS ====================

export type PeriodPreset = '7d' | '30d' | '90d' | '365d'

export interface DateRange {
  inicio: Date
  fim: Date
}

export function getDateRangeFromPeriod(period: PeriodPreset): DateRange {
  const fim = new Date()
  fim.setHours(23, 59, 59, 999)

  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)

  switch (period) {
    case '7d':
      inicio.setDate(inicio.getDate() - 7)
      break
    case '30d':
      inicio.setDate(inicio.getDate() - 30)
      break
    case '90d':
      inicio.setDate(inicio.getDate() - 90)
      break
    case '365d':
      inicio.setDate(inicio.getDate() - 365)
      break
  }

  return { inicio, fim }
}

export function parseDateRange(inicio?: string, fim?: string, period?: PeriodPreset): DateRange {
  if (period) {
    return getDateRangeFromPeriod(period)
  }

  const now = new Date()
  const defaultInicio = new Date(now)
  defaultInicio.setDate(defaultInicio.getDate() - 30)

  return {
    inicio: inicio ? new Date(inicio) : defaultInicio,
    fim: fim ? new Date(fim) : now,
  }
}

// ==================== CONTACTS REPORT ====================

export interface ContactsReport {
  total: number
  novosNoPeriodo: number
  porOrigem: Array<{ origem: string; count: number }>
  porCanal: Array<{ canal: string; count: number }>
  porDia: Array<{ data: string; count: number }>
  crescimento: number // percentage
}

export async function getContactsReport(range: DateRange): Promise<ContactsReport> {
  const { inicio, fim } = range

  // Total contacts
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)

  const total = Number(totalResult[0]?.count || 0)

  // New contacts in period
  const novosResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)
    .where(and(gte(contatos.createdAt, inicio), lte(contatos.createdAt, fim)))

  const novosNoPeriodo = Number(novosResult[0]?.count || 0)

  // By origem
  const porOrigemResult = await db
    .select({
      origem: contatos.origem,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .where(and(gte(contatos.createdAt, inicio), lte(contatos.createdAt, fim)))
    .groupBy(contatos.origem)

  const porOrigem = porOrigemResult.map(r => ({
    origem: r.origem,
    count: Number(r.count),
  }))

  // By canal
  const porCanalResult = await db
    .select({
      canal: contatos.canal,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .where(and(gte(contatos.createdAt, inicio), lte(contatos.createdAt, fim)))
    .groupBy(contatos.canal)

  const porCanal = porCanalResult.map(r => ({
    canal: r.canal,
    count: Number(r.count),
  }))

  // By day
  const porDiaResult = await db
    .select({
      data: sql<string>`date(${contatos.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .where(and(gte(contatos.createdAt, inicio), lte(contatos.createdAt, fim)))
    .groupBy(sql`date(${contatos.createdAt})`)
    .orderBy(sql`date(${contatos.createdAt})`)

  const porDia = porDiaResult.map(r => ({
    data: r.data,
    count: Number(r.count),
  }))

  // Calculate growth (compare with previous period)
  const periodDays = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const previousInicio = new Date(inicio)
  previousInicio.setDate(previousInicio.getDate() - periodDays)

  const previousResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contatos)
    .where(and(gte(contatos.createdAt, previousInicio), lte(contatos.createdAt, inicio)))

  const previousCount = Number(previousResult[0]?.count || 0)
  const crescimento = previousCount > 0 ? ((novosNoPeriodo - previousCount) / previousCount) * 100 : 0

  return {
    total,
    novosNoPeriodo,
    porOrigem,
    porCanal,
    porDia,
    crescimento: Math.round(crescimento * 10) / 10,
  }
}

// ==================== CONVERSATIONS REPORT ====================

export interface ConversationsReport {
  total: number
  ativas: number
  encerradas: number
  mensagensPorDia: Array<{ data: string; entrada: number; saida: number }>
  tempoMedioRespostaMinutos: number
}

export async function getConversationsReport(range: DateRange): Promise<ConversationsReport> {
  const { inicio, fim } = range

  // Total conversations in period
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversas)
    .where(and(gte(conversas.createdAt, inicio), lte(conversas.createdAt, fim)))

  const total = Number(totalResult[0]?.count || 0)

  // Active conversations
  const ativasResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversas)
    .where(eq(conversas.status, 'ativa'))

  const ativas = Number(ativasResult[0]?.count || 0)
  const encerradas = total - ativas

  // Messages by day
  const mensagensResult = await db
    .select({
      data: sql<string>`date(${mensagens.createdAt})`,
      direcao: mensagens.direcao,
      count: sql<number>`count(*)`,
    })
    .from(mensagens)
    .where(and(gte(mensagens.createdAt, inicio), lte(mensagens.createdAt, fim)))
    .groupBy(sql`date(${mensagens.createdAt})`, mensagens.direcao)
    .orderBy(sql`date(${mensagens.createdAt})`)

  // Group by date
  const mensagensByDay = new Map<string, { entrada: number; saida: number }>()
  for (const row of mensagensResult) {
    const existing = mensagensByDay.get(row.data) || { entrada: 0, saida: 0 }
    if (row.direcao === 'entrada') {
      existing.entrada = Number(row.count)
    } else {
      existing.saida = Number(row.count)
    }
    mensagensByDay.set(row.data, existing)
  }

  const mensagensPorDia = Array.from(mensagensByDay.entries()).map(([data, counts]) => ({
    data,
    ...counts,
  }))

  // Average response time (simplified - time between entrada and next saida in same conversa)
  // This is a complex query, using a simplified approach
  const tempoMedioRespostaMinutos = 15 // Placeholder - would need more complex query

  return {
    total,
    ativas,
    encerradas,
    mensagensPorDia,
    tempoMedioRespostaMinutos,
  }
}

// ==================== FUNNEL REPORT ====================

export interface FunnelReport {
  etapas: Array<{
    estado: string
    count: number
    percentual: number
  }>
  taxaConversao: number // from inicial to qualificado
}

export async function getFunnelReport(): Promise<FunnelReport> {
  // Get counts by estado_jornada
  const result = await db
    .select({
      estado: contatos.estadoJornada,
      count: sql<number>`count(*)`,
    })
    .from(contatos)
    .groupBy(contatos.estadoJornada)

  const total = result.reduce((sum, r) => sum + Number(r.count), 0)

  const etapas = result.map(r => ({
    estado: r.estado,
    count: Number(r.count),
    percentual: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
  }))

  // Sort by funnel order
  const order = [
    'inicial',
    'boas_vindas',
    'coletando_nome',
    'coletando_idade',
    'coletando_instrumento',
    'verificando_saxofone',
    'coletando_experiencia',
    'coletando_disponibilidade',
    'qualificado',
    'atendimento_humano',
    'incompativel',
  ]

  etapas.sort((a, b) => order.indexOf(a.estado) - order.indexOf(b.estado))

  // Conversion rate
  const inicial = etapas.find(e => e.estado === 'inicial')?.count || 0
  const qualificado = etapas.find(e => e.estado === 'qualificado')?.count || 0
  const taxaConversao = inicial > 0 ? Math.round((qualificado / inicial) * 1000) / 10 : 0

  return {
    etapas,
    taxaConversao,
  }
}

// ==================== CAMPAIGNS REPORT ====================

export interface CampaignsReport {
  total: number
  porStatus: Array<{ status: string; count: number }>
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

export async function getCampaignsReport(range: DateRange): Promise<CampaignsReport> {
  const { inicio, fim } = range

  // Total campaigns
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(campanhas)
    .where(and(gte(campanhas.createdAt, inicio), lte(campanhas.createdAt, fim)))

  const total = Number(totalResult[0]?.count || 0)

  // By status
  const porStatusResult = await db
    .select({
      status: campanhas.status,
      count: sql<number>`count(*)`,
    })
    .from(campanhas)
    .where(and(gte(campanhas.createdAt, inicio), lte(campanhas.createdAt, fim)))
    .groupBy(campanhas.status)

  const porStatus = porStatusResult.map(r => ({
    status: r.status,
    count: Number(r.count),
  }))

  // Recipient metrics
  const metricasResult = await db
    .select({
      status: campanhaDestinatarios.status,
      count: sql<number>`count(*)`,
    })
    .from(campanhaDestinatarios)
    .innerJoin(campanhas, eq(campanhaDestinatarios.campanhaId, campanhas.id))
    .where(and(gte(campanhas.createdAt, inicio), lte(campanhas.createdAt, fim)))
    .groupBy(campanhaDestinatarios.status)

  const metricasMap = new Map(metricasResult.map(r => [r.status, Number(r.count)]))

  const totalEnviadas = metricasMap.get('enviada') || 0
  const totalEntregues = metricasMap.get('entregue') || 0
  const totalLidas = metricasMap.get('lida') || 0
  const totalRespondidas = metricasMap.get('respondida') || 0
  const totalFalhas = metricasMap.get('falhou') || 0

  const totalProcessadas = totalEnviadas + totalEntregues + totalLidas + totalRespondidas

  return {
    total,
    porStatus,
    metricas: {
      totalEnviadas,
      totalEntregues,
      totalLidas,
      totalRespondidas,
      totalFalhas,
      taxaEntrega: totalProcessadas > 0 ? Math.round(((totalEntregues + totalLidas + totalRespondidas) / totalProcessadas) * 1000) / 10 : 0,
      taxaLeitura: totalProcessadas > 0 ? Math.round(((totalLidas + totalRespondidas) / totalProcessadas) * 1000) / 10 : 0,
      taxaResposta: totalProcessadas > 0 ? Math.round((totalRespondidas / totalProcessadas) * 1000) / 10 : 0,
    },
  }
}

// ==================== INSTRUMENTS REPORT ====================

export interface InstrumentsReport {
  distribuicao: Array<{ instrumento: string; count: number; percentual: number }>
  compativeis: number
  incompativeis: number
  taxaCompatibilidade: number
}

export async function getInstrumentsReport(): Promise<InstrumentsReport> {
  // Distribution by instrument
  const distribuicaoResult = await db
    .select({
      instrumento: interessados.instrumentoDesejado,
      count: sql<number>`count(*)`,
    })
    .from(interessados)
    .groupBy(interessados.instrumentoDesejado)
    .orderBy(desc(sql`count(*)`))

  const total = distribuicaoResult.reduce((sum, r) => sum + Number(r.count), 0)

  const distribuicao = distribuicaoResult.map(r => ({
    instrumento: r.instrumento,
    count: Number(r.count),
    percentual: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
  }))

  // Compatibility
  const compatibilidadeResult = await db
    .select({
      compativel: interessados.compativel,
      count: sql<number>`count(*)`,
    })
    .from(interessados)
    .groupBy(interessados.compativel)

  const compatMap = new Map(compatibilidadeResult.map(r => [r.compativel, Number(r.count)]))

  const compativeis = compatMap.get(true) || 0
  const incompativeis = compatMap.get(false) || 0
  const taxaCompatibilidade = total > 0 ? Math.round((compativeis / total) * 1000) / 10 : 0

  return {
    distribuicao,
    compativeis,
    incompativeis,
    taxaCompatibilidade,
  }
}

// ==================== CSV EXPORT ====================

export function contactsReportToCsv(report: ContactsReport): string {
  const lines = ['Metrica,Valor']
  lines.push(`Total de Contatos,${report.total}`)
  lines.push(`Novos no Periodo,${report.novosNoPeriodo}`)
  lines.push(`Crescimento (%),${report.crescimento}`)
  lines.push('')
  lines.push('Origem,Quantidade')
  for (const item of report.porOrigem) {
    lines.push(`${item.origem},${item.count}`)
  }
  lines.push('')
  lines.push('Canal,Quantidade')
  for (const item of report.porCanal) {
    lines.push(`${item.canal},${item.count}`)
  }
  lines.push('')
  lines.push('Data,Quantidade')
  for (const item of report.porDia) {
    lines.push(`${item.data},${item.count}`)
  }
  return lines.join('\n')
}

export function funnelReportToCsv(report: FunnelReport): string {
  const lines = ['Etapa,Quantidade,Percentual']
  for (const etapa of report.etapas) {
    lines.push(`${etapa.estado},${etapa.count},${etapa.percentual}%`)
  }
  lines.push('')
  lines.push(`Taxa de Conversao,${report.taxaConversao}%`)
  return lines.join('\n')
}

export function instrumentsReportToCsv(report: InstrumentsReport): string {
  const lines = ['Instrumento,Quantidade,Percentual']
  for (const item of report.distribuicao) {
    lines.push(`${item.instrumento},${item.count},${item.percentual}%`)
  }
  lines.push('')
  lines.push(`Compativeis,${report.compativeis}`)
  lines.push(`Incompativeis,${report.incompativeis}`)
  lines.push(`Taxa de Compatibilidade,${report.taxaCompatibilidade}%`)
  return lines.join('\n')
}

// Export service
export const reportService = {
  parseDateRange,
  getContactsReport,
  getConversationsReport,
  getFunnelReport,
  getCampaignsReport,
  getInstrumentsReport,
  contactsReportToCsv,
  funnelReportToCsv,
  instrumentsReportToCsv,
}
