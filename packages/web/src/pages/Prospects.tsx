import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Erro ao carregar interessados.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interessados</h1>
          <p className="text-gray-600 mt-1">
            {data?.total ?? 0} fichas de interessados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          className={cn(
            'btn',
            params.compativel === undefined ? 'btn-primary' : 'btn-secondary'
          )}
          onClick={() => handleFilterChange(undefined)}
        >
          Todos
        </button>
        <button
          className={cn(
            'btn',
            params.compativel === true ? 'btn-primary' : 'btn-secondary'
          )}
          onClick={() => handleFilterChange(true)}
        >
          Compativeis
        </button>
        <button
          className={cn(
            'btn',
            params.compativel === false ? 'btn-primary' : 'btn-secondary'
          )}
          onClick={() => handleFilterChange(false)}
        >
          Incompativeis
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
            <div className="text-center py-12 text-gray-500">
              Nenhum interessado encontrado
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Pagina {data.page} de {data.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={data.page <= 1}
                  onClick={() => handlePageChange(data.page - 1)}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={data.page >= data.totalPages}
                  onClick={() => handlePageChange(data.page + 1)}
                >
                  Proxima
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
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
            {prospect.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{prospect.nome}</p>
            <p className="text-sm text-gray-600">{prospect.idade} anos</p>
          </div>
        </div>
        <span className={cn(
          'badge',
          prospect.compativel ? 'badge-green' : 'badge-red'
        )}>
          {prospect.compativel ? 'Compativel' : 'Incompativel'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MusicIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {prospect.instrumentoDesejado}
            {prospect.instrumentoSugerido && prospect.instrumentoSugerido !== prospect.instrumentoDesejado && (
              <span className="text-blue-600 ml-1">
                → {prospect.instrumentoSugerido}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatPhone(prospect.contato.telefone)}</span>
        </div>

        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className={cn(
            prospect.disponibilidadeHorario ? 'text-green-600' : 'text-red-600'
          )}>
            {prospect.disponibilidadeHorario ? 'Horario disponivel' : 'Horario indisponivel'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Cadastrado em {formatDateTime(prospect.createdAt)}
        </p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ficha do Interessado</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl">
              {prospect.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{prospect.nome}</p>
              <p className="text-gray-600">{prospect.idade} anos</p>
              <div className="mt-1">
                <span className={cn(
                  'badge',
                  prospect.compativel ? 'badge-green' : 'badge-red'
                )}>
                  {prospect.compativel ? 'Compativel' : 'Incompativel'}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Instrumento Desejado</span>
              <p className="font-medium">{prospect.instrumentoDesejado}</p>
            </div>
            {prospect.instrumentoSugerido && (
              <div>
                <span className="text-sm text-gray-500">Instrumento Sugerido</span>
                <p className="font-medium text-blue-600">{prospect.instrumentoSugerido}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500">Disponibilidade</span>
              <p className={cn(
                'font-medium',
                prospect.disponibilidadeHorario ? 'text-green-600' : 'text-red-600'
              )}>
                {prospect.disponibilidadeHorario ? 'Seg/Qua/Sex 15h-17h' : 'Indisponivel'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Telefone</span>
              <p className="font-medium">{formatPhone(prospect.contato.telefone)}</p>
            </div>
          </div>

          {prospect.experienciaMusical && (
            <div>
              <span className="text-sm text-gray-500">Experiencia Musical</span>
              <p className="mt-1 text-gray-900">{prospect.experienciaMusical}</p>
            </div>
          )}

          {prospect.expectativas && (
            <div>
              <span className="text-sm text-gray-500">Expectativas</span>
              <p className="mt-1 text-gray-900">{prospect.expectativas}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Ficha criada em {formatDateTime(prospect.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
