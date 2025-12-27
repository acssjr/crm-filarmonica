import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  Users,
  MessageSquare,
  Filter,
  TrendingUp,
  TrendingDown,
  Megaphone,
  Music,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Mail,
  MailOpen,
} from 'lucide-react'
import {
  relatorios,
  type ReportParams,
} from '../services/api'
import { cn } from '../lib/utils'

type ReportTab = 'contatos' | 'conversas' | 'funil' | 'campanhas' | 'instrumentos'
type PeriodFilter = '7d' | '30d' | '90d' | '365d' | 'custom'

const TABS = [
  { id: 'contatos' as const, label: 'Contatos', icon: Users },
  { id: 'conversas' as const, label: 'Conversas', icon: MessageSquare },
  { id: 'funil' as const, label: 'Funil', icon: Filter },
  { id: 'campanhas' as const, label: 'Campanhas', icon: Megaphone },
  { id: 'instrumentos' as const, label: 'Instrumentos', icon: Music },
]

const PERIODS = [
  { id: '7d' as const, label: '7 dias' },
  { id: '30d' as const, label: '30 dias' },
  { id: '90d' as const, label: '90 dias' },
  { id: '365d' as const, label: '1 ano' },
  { id: 'custom' as const, label: 'Personalizado' },
]

export function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('contatos')
  const [period, setPeriod] = useState<PeriodFilter>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const params: ReportParams = period === 'custom'
    ? { inicio: customStart, fim: customEnd }
    : { periodo: period }

  const handleExport = () => {
    if (activeTab === 'contatos' || activeTab === 'funil' || activeTab === 'instrumentos') {
      relatorios.exportCsv(activeTab, params)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analise o desempenho do seu CRM
          </p>
        </div>
        {(activeTab === 'contatos' || activeTab === 'funil' || activeTab === 'instrumentos') && (
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Período</label>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    period === p.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="label">Data Início</label>
                <input
                  type="date"
                  className="input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Data Fim</label>
                <input
                  type="date"
                  className="input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'contatos' && <ContactsReportSection params={params} />}
      {activeTab === 'conversas' && <ConversationsReportSection params={params} />}
      {activeTab === 'funil' && <FunnelReportSection />}
      {activeTab === 'campanhas' && <CampaignsReportSection params={params} />}
      {activeTab === 'instrumentos' && <InstrumentsReportSection />}
    </div>
  )
}

function ContactsReportSection({ params }: { params: ReportParams }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relatorio-contatos', params],
    queryFn: () => relatorios.contatos(params),
  })

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Contatos"
          value={data.total}
          icon={Users}
        />
        <StatCard
          label="Novos no Período"
          value={data.novosNoPeriodo}
          icon={TrendingUp}
          trend={data.crescimento}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Origem */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Por Origem</h3>
          <div className="space-y-3">
            {data.porOrigem.map(item => (
              <div key={item.origem} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {item.origem}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(item.count / data.total) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Por Canal */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Por Canal</h3>
          <div className="space-y-3">
            {data.porCanal.map(item => (
              <div key={item.canal} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {item.canal}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(item.count / data.total) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Por Dia */}
      {data.porDia.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Novos Contatos por Dia</h3>
          <div className="flex items-end gap-1 h-40">
            {data.porDia.map((item, i) => {
              const maxCount = Math.max(...data.porDia.map(d => d.count))
              const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{item.count}</span>
                  <div
                    className="w-full bg-primary-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ConversationsReportSection({ params }: { params: ReportParams }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relatorio-conversas', params],
    queryFn: () => relatorios.conversas(params),
  })

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Conversas"
          value={data.total}
          icon={MessageSquare}
        />
        <StatCard
          label="Conversas Ativas"
          value={data.ativas}
          icon={Clock}
        />
        <StatCard
          label="Conversas Encerradas"
          value={data.encerradas}
          icon={CheckCircle}
        />
        <StatCard
          label="Tempo Médio de Resposta"
          value={`${data.tempoMedioRespostaMinutos} min`}
          icon={Clock}
          valueIsString
        />
      </div>

      {/* Mensagens por Dia */}
      {data.mensagensPorDia.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Mensagens por Dia</h3>
          <div className="flex items-end gap-1 h-40">
            {data.mensagensPorDia.map((item, i) => {
              const maxCount = Math.max(...data.mensagensPorDia.map(d => d.entrada + d.saida))
              const height = maxCount > 0 ? ((item.entrada + item.saida) / maxCount) * 100 : 0
              const entradaHeight = (item.entrada + item.saida) > 0
                ? (item.entrada / (item.entrada + item.saida)) * 100
                : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{item.entrada + item.saida}</span>
                  <div
                    className="w-full rounded-t overflow-hidden flex flex-col"
                    style={{ height: `${height}%`, minHeight: (item.entrada + item.saida) > 0 ? '4px' : '0' }}
                  >
                    <div
                      className="bg-primary-500"
                      style={{ height: `${entradaHeight}%` }}
                    />
                    <div
                      className="bg-green-500 flex-1"
                    />
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Recebidas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enviadas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FunnelReportSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relatorio-funil'],
    queryFn: () => relatorios.funil(),
  })

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  if (!data) return null

  const estadoLabels: Record<string, string> = {
    inicial: 'Inicial',
    boas_vindas: 'Boas-vindas',
    coletando_nome: 'Coletando Nome',
    coletando_idade: 'Coletando Idade',
    coletando_instrumento: 'Coletando Instrumento',
    qualificado: 'Qualificado',
    incompativel: 'Incompatível',
    atendimento_humano: 'Atendimento Humano',
  }

  return (
    <div className="space-y-6">
      {/* Taxa de Conversao */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Taxa de Conversão</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Porcentagem de contatos que chegaram ao estado qualificado
            </p>
          </div>
          <div className="text-4xl font-bold text-primary-600">
            {data.taxaConversao.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Funil */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Funil de Jornada</h3>
        <div className="space-y-3">
          {data.etapas.map((etapa) => {
            const maxCount = Math.max(...data.etapas.map(e => e.count))
            const width = maxCount > 0 ? (etapa.count / maxCount) * 100 : 0
            return (
              <div key={etapa.estado} className="flex items-center gap-3">
                <span className="w-40 text-sm text-gray-600 dark:text-gray-400">
                  {estadoLabels[etapa.estado] || etapa.estado}
                </span>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full flex items-center justify-end pr-3',
                      etapa.estado === 'qualificado' ? 'bg-green-500' :
                      etapa.estado === 'incompativel' ? 'bg-error-500' :
                      'bg-primary-500'
                    )}
                    style={{ width: `${width}%`, minWidth: etapa.count > 0 ? '40px' : '0' }}
                  >
                    {width > 15 && (
                      <span className="text-xs font-medium text-white">
                        {etapa.count}
                      </span>
                    )}
                  </div>
                </div>
                {width <= 15 && (
                  <span className="w-12 text-sm font-medium text-gray-900 dark:text-white">
                    {etapa.count}
                  </span>
                )}
                <span className="w-16 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {etapa.percentual.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CampaignsReportSection({ params }: { params: ReportParams }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relatorio-campanhas', params],
    queryFn: () => relatorios.campanhas(params),
  })

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  if (!data) return null

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    agendada: 'Agendada',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Campanhas"
          value={data.total}
          icon={Megaphone}
        />
        <StatCard
          label="Taxa de Entrega"
          value={`${data.metricas.taxaEntrega.toFixed(1)}%`}
          icon={Mail}
          valueIsString
        />
        <StatCard
          label="Taxa de Leitura"
          value={`${data.metricas.taxaLeitura.toFixed(1)}%`}
          icon={MailOpen}
          valueIsString
        />
        <StatCard
          label="Taxa de Resposta"
          value={`${data.metricas.taxaResposta.toFixed(1)}%`}
          icon={MessageSquare}
          valueIsString
        />
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Status */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Campanhas por Status</h3>
          <div className="space-y-3">
            {data.porStatus.map(item => (
              <div key={item.status} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                  {statusLabels[item.status] || item.status}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', {
                      'bg-gray-400': item.status === 'rascunho',
                      'bg-warning-500': item.status === 'agendada',
                      'bg-primary-500': item.status === 'em_andamento',
                      'bg-green-500': item.status === 'concluida',
                      'bg-error-500': item.status === 'cancelada',
                    })}
                    style={{ width: `${(item.count / data.total) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metricas de Envio */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Métricas de Envio</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Send className="w-6 h-6 mx-auto mb-2 text-blue-500" strokeWidth={1.5} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.metricas.totalEnviadas}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enviadas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="w-6 h-6 mx-auto mb-2 text-primary-500" strokeWidth={1.5} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.metricas.totalEntregues}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entregues</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MailOpen className="w-6 h-6 mx-auto mb-2 text-green-500" strokeWidth={1.5} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.metricas.totalLidas}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lidas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-error-500" strokeWidth={1.5} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.metricas.totalFalhas}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Falhas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InstrumentsReportSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relatorio-instrumentos'],
    queryFn: () => relatorios.instrumentos(),
  })

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Interessados Compatíveis"
          value={data.compativeis}
          icon={CheckCircle}
        />
        <StatCard
          label="Interessados Incompatíveis"
          value={data.incompativeis}
          icon={XCircle}
        />
        <StatCard
          label="Taxa de Compatibilidade"
          value={`${data.taxaCompatibilidade.toFixed(1)}%`}
          icon={TrendingUp}
          valueIsString
        />
      </div>

      {/* Distribuição de Instrumentos */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Distribuição de Instrumentos Desejados
        </h3>
        <div className="space-y-3">
          {data.distribuicao.map(item => {
            const maxCount = Math.max(...data.distribuicao.map(d => d.count))
            const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            return (
              <div key={item.instrumento} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.instrumento}
                </span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {item.count}
                </span>
                <span className="w-16 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {item.percentual.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  trend?: number
  valueIsString?: boolean
}

function StatCard({ label, value, icon: Icon, trend, valueIsString }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {valueIsString ? value : value.toLocaleString()}
          </p>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trend >= 0 ? 'text-green-600' : 'text-error-600'
            )}>
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <TrendingDown className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner spinner-lg text-primary-600" />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
        <p className="text-error-700 dark:text-error-300">Erro ao carregar relatório.</p>
      </div>
    </div>
  )
}
