import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contacts, type ContactsParams, type Contato } from '../services/api'
import {
  formatPhone,
  formatDateTime,
  getOrigemLabel,
  getEstadoJornadaLabel,
  getEstadoJornadaColor,
  cn,
} from '../lib/utils'

export function Contacts() {
  const [params, setParams] = useState<ContactsParams>({
    page: 1,
    limit: 20,
  })
  const [selectedContact, setSelectedContact] = useState<Contato | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contacts.list(params),
  })

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: keyof ContactsParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }))
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Erro ao carregar contatos.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-600 mt-1">
            {data?.total ?? 0} contatos cadastrados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              className="input"
              placeholder="Nome ou telefone..."
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origem
            </label>
            <select
              className="input"
              onChange={(e) => handleFilterChange('origem', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="organico">Orgânico</option>
              <option value="campanha">Campanha</option>
              <option value="indicacao">Indicação</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado da Jornada
            </label>
            <select
              className="input"
              onChange={(e) => handleFilterChange('estadoJornada', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="inicial">Inicial</option>
              <option value="boas_vindas">Boas-vindas</option>
              <option value="coletando_nome">Coletando nome</option>
              <option value="coletando_idade">Coletando idade</option>
              <option value="coletando_instrumento">Coletando instrumento</option>
              <option value="qualificado">Qualificado</option>
              <option value="incompativel">Incompatível</option>
              <option value="atendimento_humano">Atendimento humano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origem
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {contact.nome || 'Sem nome'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatPhone(contact.telefone)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-blue">
                        {getOrigemLabel(contact.origem)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', getEstadoJornadaColor(contact.estadoJornada))}>
                        {getEstadoJornadaLabel(contact.estadoJornada)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {formatDateTime(contact.createdAt)}
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Nenhum contato encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Página {data.page} de {data.totalPages}
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
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact Detail Drawer */}
      {selectedContact && (
        <ContactDetailDrawer
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  )
}

interface ContactDetailDrawerProps {
  contact: Contato
  onClose: () => void
}

function ContactDetailDrawer({ contact, onClose }: ContactDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['contact', contact.id],
    queryFn: () => contacts.get(contact.id),
  })

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Informações</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Nome</span>
                    <p className="font-medium">{data?.contato.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Telefone</span>
                    <p className="font-medium">{formatPhone(data?.contato.telefone || '')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Origem</span>
                    <p>
                      <span className="badge badge-blue">
                        {getOrigemLabel(data?.contato.origem || '')}
                      </span>
                      {data?.contato.origemCampanha && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({data.contato.origemCampanha})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Estado da Jornada</span>
                    <p>
                      <span className={cn('badge', getEstadoJornadaColor(data?.contato.estadoJornada || ''))}>
                        {getEstadoJornadaLabel(data?.contato.estadoJornada || '')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Criado em</span>
                    <p className="text-sm">{formatDateTime(data?.contato.createdAt || '')}</p>
                  </div>
                </div>
              </div>

              {data?.contato.interessado && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Ficha do Interessado</h3>
                  <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                    <div>
                      <span className="text-sm text-gray-500">Nome</span>
                      <p className="font-medium">{data.contato.interessado.nome}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Idade</span>
                      <p className="font-medium">{data.contato.interessado.idade} anos</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Instrumento Desejado</span>
                      <p className="font-medium">{data.contato.interessado.instrumentoDesejado}</p>
                    </div>
                    {data.contato.interessado.instrumentoSugerido && (
                      <div>
                        <span className="text-sm text-gray-500">Instrumento Sugerido</span>
                        <p className="font-medium">{data.contato.interessado.instrumentoSugerido}</p>
                      </div>
                    )}
                    {data.contato.interessado.experienciaMusical && (
                      <div>
                        <span className="text-sm text-gray-500">Experiência Musical</span>
                        <p className="font-medium">{data.contato.interessado.experienciaMusical}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">Disponibilidade</span>
                      <p>
                        <span className={cn('badge', data.contato.interessado.disponibilidadeHorario ? 'badge-green' : 'badge-red')}>
                          {data.contato.interessado.disponibilidadeHorario ? 'Disponível' : 'Indisponível'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Compatível</span>
                      <p>
                        <span className={cn('badge', data.contato.interessado.compativel ? 'badge-green' : 'badge-red')}>
                          {data.contato.interessado.compativel ? 'Sim' : 'Não'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
