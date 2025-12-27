import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Music,
  Phone,
  Clock,
  X,
  Users,
  AlertCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { prospects, type ProspectsParams, type InteressadoComContato } from '../services/api'
import { formatPhone, formatDateTime, cn } from '../lib/utils'

export function Prospects() {
  const [params, setParams] = useState<ProspectsParams>({
    page: 1,
    limit: 20,
  })
  const [selectedProspect, setSelectedProspect] = useState<InteressadoComContato | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['prospects', params],
    queryFn: () => prospects.list(params),
  })

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (compativel: boolean | undefined) => {
    setParams((prev) => ({
      ...prev,
      compativel,
      page: 1,
    }))
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar interessados.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Interessados</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold text-gray-900 dark:text-white">{data?.total ?? 0}</span> fichas de interessados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Visualizar:</span>
          <button className="btn btn-secondary btn-icon">
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button className="btn btn-ghost btn-icon">
            <List className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          className={cn('filter-chip', params.compativel === undefined && 'active')}
          onClick={() => handleFilterChange(undefined)}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          Todos
        </button>
        <button
          className={cn('filter-chip', params.compativel === true && 'active')}
          onClick={() => handleFilterChange(true)}
        >
          <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          Compativeis
        </button>
        <button
          className={cn('filter-chip', params.compativel === false && 'active')}
          onClick={() => handleFilterChange(false)}
        >
          <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          Incompativeis
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                onClick={() => setSelectedProspect(prospect)}
              />
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="empty-state-title">Nenhum interessado encontrado</h3>
              <p className="empty-state-description">
                Tente ajustar os filtros ou aguarde novos interessados
              </p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pagina <span className="font-semibold text-gray-900 dark:text-white">{data.page}</span> de{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{data.totalPages}</span>
              </p>
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={data.page <= 1}
                  onClick={() => handlePageChange(data.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Anterior
                </button>
                <button
                  className="pagination-btn"
                  disabled={data.page >= data.totalPages}
                  onClick={() => handlePageChange(data.page + 1)}
                >
                  Proxima
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}
    </div>
  )
}

interface ProspectCardProps {
  prospect: InteressadoComContato
  onClick: () => void
}

function ProspectCard({ prospect, onClick }: ProspectCardProps) {
  return (
    <div
      className="card cursor-pointer group hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-semibold text-primary-600 dark:text-primary-400">
            {prospect.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {prospect.nome}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{prospect.idade} anos</p>
          </div>
        </div>
        <span className={cn(
          'badge badge-dot',
          prospect.compativel ? 'badge-success' : 'badge-error'
        )}>
          {prospect.compativel ? 'Compativel' : 'Incompativel'}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Music className="h-4 w-4 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Instrumento</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {prospect.instrumentoDesejado}
              {prospect.instrumentoSugerido && prospect.instrumentoSugerido !== prospect.instrumentoDesejado && (
                <span className="text-primary-600 dark:text-primary-400 ml-1">
                  → {prospect.instrumentoSugerido}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Phone className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
          <span className="font-mono text-xs">{formatPhone(prospect.contato.telefone)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
          <span className={cn(
            'text-sm font-medium',
            prospect.disponibilidadeHorario
              ? 'text-success-600 dark:text-success-400'
              : 'text-error-600 dark:text-error-400'
          )}>
            {prospect.disponibilidadeHorario ? 'Horario disponivel' : 'Horario indisponivel'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDateTime(prospect.createdAt)}
        </p>
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
      </div>
    </div>
  )
}

interface ProspectDetailModalProps {
  prospect: InteressadoComContato
  onClose: () => void
}

function ProspectDetailModal({ prospect, onClose }: ProspectDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 dark:bg-gray-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ficha do Interessado</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-semibold">
              {prospect.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold">{prospect.nome}</p>
              <p className="text-gray-400">{prospect.idade} anos</p>
              <div className="mt-2">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  prospect.compativel
                    ? 'bg-success-500/20 text-success-300'
                    : 'bg-error-500/20 text-error-300'
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    prospect.compativel ? 'bg-success-400' : 'bg-error-400'
                  )} />
                  {prospect.compativel ? 'Compativel' : 'Incompativel'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instrument Card */}
          <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Instrumento Musical</p>
                <p className="font-semibold text-gray-900 dark:text-white">{prospect.instrumentoDesejado}</p>
                {prospect.instrumentoSugerido && prospect.instrumentoSugerido !== prospect.instrumentoDesejado && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    Sugestao: {prospect.instrumentoSugerido}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoCard
              icon={Clock}
              label="Disponibilidade"
              value={prospect.disponibilidadeHorario ? 'Seg/Qua/Sex 15h-17h' : 'Indisponivel'}
              variant={prospect.disponibilidadeHorario ? 'success' : 'danger'}
            />
            <InfoCard
              icon={Phone}
              label="Telefone"
              value={formatPhone(prospect.contato.telefone)}
            />
          </div>

          {prospect.experienciaMusical && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Experiencia Musical</p>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{prospect.experienciaMusical}</p>
            </div>
          )}

          {prospect.expectativas && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expectativas</p>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{prospect.expectativas}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ficha criada em {formatDateTime(prospect.createdAt)}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn btn-secondary">
                Fechar
              </button>
              <Link to={`/contacts/${prospect.contato.id}`} className="btn btn-primary">
                Ver Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, variant }: {
  icon: React.ElementType
  label: string
  value: string
  variant?: 'success' | 'danger'
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-xs">
        <Icon className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn(
          'font-medium text-sm',
          variant === 'success' && 'text-success-600 dark:text-success-400',
          variant === 'danger' && 'text-error-600 dark:text-error-400',
          !variant && 'text-gray-900 dark:text-white'
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}
