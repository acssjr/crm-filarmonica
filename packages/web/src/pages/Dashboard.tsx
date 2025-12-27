import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users,
  MessageSquare,
  UserPlus,
  UserCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { dashboard } from '../services/api'
import { getOrigemLabel, getEstadoJornadaLabel } from '../lib/utils'

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.stats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner spinner-lg text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar dados do dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral do CRM</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Atualizado agora</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Contatos"
          value={stats?.totalContatos ?? 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Conversas Ativas"
          value={stats?.conversasAtivas ?? 0}
          icon={MessageSquare}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Novos Hoje"
          value={stats?.novosHoje ?? 0}
          icon={UserPlus}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Interessados Qualificados"
          value={stats?.interessadosQualificados ?? 0}
          icon={UserCheck}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Contatos por Origem</h2>
            <p className="card-description">Distribuição dos canais de captação</p>
          </div>
          {stats?.porOrigem && stats.porOrigem.length > 0 ? (
            <div className="space-y-4">
              {stats.porOrigem.map((item, index) => (
                <div key={item.origem} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getOrigemLabel(item.origem)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max((item.count / stats.totalContatos) * 100, 2)}%`,
                        backgroundColor: getBarColor(index),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Nenhum dado de origem disponível" />
          )}
        </div>

        {/* Journey State Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Estado da Jornada</h2>
            <p className="card-description">Progresso dos contatos no funil</p>
          </div>
          {stats?.porEstadoJornada && stats.porEstadoJornada.length > 0 ? (
            <div className="space-y-4">
              {stats.porEstadoJornada.map((item, index) => (
                <div key={item.estado} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getJourneyColor(index) }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getEstadoJornadaLabel(item.estado)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max((item.count / stats.totalContatos) * 100, 2)}%`,
                        backgroundColor: getJourneyColor(index),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Nenhum dado de jornada disponível" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gray-900 dark:bg-gray-800 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
            <p className="text-gray-400 text-sm mt-1">Gerencie seus contatos e conversas</p>
          </div>
          <div className="flex gap-3">
            <Link to="/contacts" className="btn bg-white/10 text-white hover:bg-white/20 border-0">
              <Users className="w-4 h-4" strokeWidth={1.5} />
              Ver Contatos
            </Link>
            <Link to="/conversations" className="btn btn-primary">
              <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
              Conversas
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for colors
function getBarColor(index: number): string {
  const colors = ['#6941C6', '#7F56D9', '#9B8AFB', '#BDB4FE', '#D9D6FE']
  return colors[index % colors.length]
}

function getJourneyColor(index: number): string {
  const colors = ['#6941C6', '#12B76A', '#F79009', '#D92D20', '#3b82f6', '#8b5cf6']
  return colors[index % colors.length]
}

// Components
interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value.toLocaleString('pt-BR')}</p>
          {trend && (
            <div className={`stat-trend ${trend.isPositive ? 'stat-trend-up' : 'stat-trend-down'}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <TrendingDown className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state py-8">
      <div className="empty-state-icon">
        <BarChart3 className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <p className="empty-state-description">{message}</p>
    </div>
  )
}
