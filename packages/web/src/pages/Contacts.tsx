import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Pencil,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Phone,
  Calendar,
  Tag,
  Music,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Check
} from 'lucide-react'
import { contacts, tags, type ContactsParams, type Contato, type Tag as TagType } from '../services/api'
import {
  formatPhone,
  formatDateTime,
  getOrigemLabel,
  getEstadoJornadaLabel,
  cn,
} from '../lib/utils'

const TAG_COLORS = [
  { value: 'gray', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  { value: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  { value: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { value: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  { value: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  { value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { value: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { value: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
] as const

function getTagColorClasses(cor: string) {
  return TAG_COLORS.find(c => c.value === cor) || TAG_COLORS[0]
}

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
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar contatos.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Contatos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold text-gray-900 dark:text-white">{data?.total ?? 0}</span> contatos cadastrados
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Novo Contato
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                className="input pl-10"
                placeholder="Nome ou telefone..."
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div className="w-44">
            <label className="label">Origem</label>
            <select
              className="input"
              onChange={(e) => handleFilterChange('origem', e.target.value)}
            >
              <option value="">Todas as origens</option>
              <option value="organico">Orgânico</option>
              <option value="campanha">Campanha</option>
              <option value="indicacao">Indicação</option>
            </select>
          </div>
          <div className="w-52">
            <label className="label">Estado da Jornada</label>
            <select
              className="input"
              onChange={(e) => handleFilterChange('estadoJornada', e.target.value)}
            >
              <option value="">Todos os estados</option>
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
      <div className="table-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner spinner-lg text-primary-600" />
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                  <th>Estado</th>
                  <th>Criado em</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((contact) => (
                  <tr
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="user-avatar">
                          {(contact.nome || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {contact.nome || 'Sem nome'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-gray-600 dark:text-gray-300">
                      {formatPhone(contact.telefone)}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {getOrigemLabel(contact.origem)}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', getEstadoJornadaBadge(contact.estadoJornada))}>
                        {getEstadoJornadaLabel(contact.estadoJornada)}
                      </span>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400 text-sm">
                      {formatDateTime(contact.createdAt)}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon">
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Users className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <h3 className="empty-state-title">Nenhum contato encontrado</h3>
                        <p className="empty-state-description">
                          Tente ajustar os filtros ou aguarde novos contatos
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Página <span className="font-semibold text-gray-900 dark:text-white">{data.page}</span> de{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{data.totalPages}</span>
                </p>
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={data.page <= 1}
                    onClick={() => handlePageChange(data.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        className={cn('pagination-btn', data.page === page && 'active')}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    className="pagination-btn"
                    disabled={data.page >= data.totalPages}
                    onClick={() => handlePageChange(data.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
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

function getEstadoJornadaBadge(estado: string): string {
  const badges: Record<string, string> = {
    inicial: 'badge-gray',
    boas_vindas: 'badge-primary',
    coletando_nome: 'badge-warning',
    coletando_idade: 'badge-warning',
    coletando_instrumento: 'badge-warning',
    qualificado: 'badge-success',
    incompativel: 'badge-error',
    atendimento_humano: 'badge-primary',
  }
  return badges[estado] || 'badge-gray'
}

interface ContactDetailDrawerProps {
  contact: Contato
  onClose: () => void
}

function ContactDetailDrawer({ contact, onClose }: ContactDetailDrawerProps) {
  const queryClient = useQueryClient()
  const [showTagManager, setShowTagManager] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['contact', contact.id],
    queryFn: () => contacts.get(contact.id),
  })

  const { data: contactTags, isLoading: tagsLoading } = useQuery({
    queryKey: ['contact-tags', contact.id],
    queryFn: () => tags.getContactTags(contact.id),
  })

  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.list(),
  })

  const updateTagsMutation = useMutation({
    mutationFn: (tagIds: string[]) => tags.updateContactTags(contact.id, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contact.id] })
      setShowTagManager(false)
    },
  })

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes do Contato</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatPhone(contact.telefone)}</p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="spinner spinner-lg text-primary-600" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-5 space-y-6">
              {/* Contact Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl font-semibold text-primary-600 dark:text-primary-400">
                  {(data?.contato.nome || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {data?.contato.nome || 'Sem nome'}
                  </h3>
                  <span className={cn('badge', getEstadoJornadaBadge(data?.contato.estadoJornada || ''))}>
                    {getEstadoJornadaLabel(data?.contato.estadoJornada || '')}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              {/* Info Cards */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Informações
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard
                    icon={Phone}
                    label="Telefone"
                    value={formatPhone(data?.contato.telefone || '')}
                  />
                  <InfoCard
                    icon={Tag}
                    label="Origem"
                    value={
                      <span className="badge badge-primary">
                        {getOrigemLabel(data?.contato.origem || '')}
                      </span>
                    }
                  />
                  <InfoCard icon={Users} label="Tipo" value={data?.contato.tipo || 'Desconhecido'} />
                  <InfoCard
                    icon={Calendar}
                    label="Criado em"
                    value={formatDateTime(data?.contato.createdAt || '')}
                  />
                </div>
                {data?.contato.origemCampanha && (
                  <InfoCard icon={Tag} label="Campanha" value={data.contato.origemCampanha} />
                )}
              </div>

              {/* Tags Section */}
              <div className="h-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tags
                  </h4>
                  <button
                    className="btn btn-ghost btn-sm text-primary-600 hover:text-primary-700"
                    onClick={() => setShowTagManager(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Gerenciar
                  </button>
                </div>
                {tagsLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner spinner-sm text-primary-600" />
                    <span className="text-sm text-gray-500">Carregando tags...</span>
                  </div>
                ) : contactTags && contactTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {contactTags.map((tag) => {
                      const colorClasses = getTagColorClasses(tag.cor)
                      return (
                        <span
                          key={tag.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
                            colorClasses.bg,
                            colorClasses.text
                          )}
                        >
                          <div className={cn('w-2 h-2 rounded-full', colorClasses.dot)} />
                          {tag.nome}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma tag atribuída
                  </p>
                )}
              </div>

              {/* Interested Person Info */}
              {data?.contato.interessado && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ficha do Interessado
                    </h4>
                    <div className="card bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoCard icon={Users} label="Nome" value={data.contato.interessado.nome} />
                        <InfoCard icon={Calendar} label="Idade" value={`${data.contato.interessado.idade} anos`} />
                        <InfoCard
                          icon={Music}
                          label="Instrumento Desejado"
                          value={data.contato.interessado.instrumentoDesejado}
                        />
                        {data.contato.interessado.instrumentoSugerido && (
                          <InfoCard
                            icon={Music}
                            label="Instrumento Sugerido"
                            value={data.contato.interessado.instrumentoSugerido}
                          />
                        )}
                        {data.contato.interessado.experienciaMusical && (
                          <InfoCard
                            icon={Music}
                            label="Experiência Musical"
                            value={data.contato.interessado.experienciaMusical}
                          />
                        )}
                        <InfoCard
                          icon={Clock}
                          label="Disponibilidade"
                          value={
                            <span className={cn('badge', data.contato.interessado.disponibilidadeHorario ? 'badge-success' : 'badge-error')}>
                              {data.contato.interessado.disponibilidadeHorario ? 'Disponível' : 'Indisponível'}
                            </span>
                          }
                        />
                        <InfoCard
                          icon={data.contato.interessado.compativel ? CheckCircle : XCircle}
                          label="Compatível"
                          value={
                            <span className={cn('badge', data.contato.interessado.compativel ? 'badge-success' : 'badge-error')}>
                              {data.contato.interessado.compativel ? 'Sim' : 'Não'}
                            </span>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <Link
                to={`/conversations?contact=${contact.id}`}
                className="btn btn-primary flex-1"
              >
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                Ver Conversas
              </Link>
              <button className="btn btn-secondary">
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Manager Modal */}
      {showTagManager && (
        <TagManagerModal
          contactTags={contactTags || []}
          allTags={allTags || []}
          onClose={() => setShowTagManager(false)}
          onSave={(tagIds) => updateTagsMutation.mutate(tagIds)}
          isLoading={updateTagsMutation.isPending}
        />
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {label}
      </div>
      <div className="font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

interface TagManagerModalProps {
  contactTags: TagType[]
  allTags: TagType[]
  onClose: () => void
  onSave: (tagIds: string[]) => void
  isLoading: boolean
}

function TagManagerModal({ contactTags, allTags, onClose, onSave, isLoading }: TagManagerModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    contactTags.map(t => t.id)
  )

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSave = () => {
    onSave(selectedTagIds)
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciar Tags
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {allTags.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Tag className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma tag criada ainda
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Crie tags na página de Tags para organizar seus contatos
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {allTags.map((tag) => {
                  const colorClasses = getTagColorClasses(tag.cor)
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-3 h-3 rounded-full', colorClasses.dot)} />
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-sm font-medium',
                          colorClasses.bg,
                          colorClasses.text
                        )}>
                          {tag.nome}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary-600" strokeWidth={2} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isLoading || allTags.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
