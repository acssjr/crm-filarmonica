import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Clock,
  Users,
  Send,
  Eye,
  Filter,
  ChevronRight,
  RefreshCw,
  XCircle,
  Mail,
  MailOpen,
  MessageSquare,
} from 'lucide-react'
import {
  campanhas,
  templates,
  tags,
  type Campanha,
  type CreateCampanhaRequest,
  type CampaignFilters,
  type Contato,
} from '../services/api'
import { cn, formatDateTime, formatPhone } from '../lib/utils'

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  rascunho: { label: 'Rascunho', badge: 'badge-gray' },
  agendada: { label: 'Agendada', badge: 'badge-warning' },
  em_andamento: { label: 'Em Andamento', badge: 'badge-primary' },
  concluida: { label: 'Concluída', badge: 'badge-success' },
  cancelada: { label: 'Cancelada', badge: 'badge-error' },
}

const RECURRENCE_LABELS: Record<string, string> = {
  nenhuma: 'Sem recorrência',
  diario: 'Diariamente',
  semanal: 'Semanalmente',
  mensal: 'Mensalmente',
}

export function Campaigns() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campanha | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Campanha | null>(null)
  const [scheduleModal, setScheduleModal] = useState<Campanha | null>(null)

  const { data: campanhasList, isLoading, error } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhas.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campanhas.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] })
      setDeleteConfirm(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => campanhas.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] })
    },
  })

  const handleOpenCreate = () => {
    setEditingCampaign(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (campaign: Campanha) => {
    setEditingCampaign(campaign)
    setIsModalOpen(true)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar campanhas.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas campanhas de marketing
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Campanha
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      ) : campanhasList && campanhasList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {campanhasList.map((campanha) => {
            const status = STATUS_LABELS[campanha.status] || STATUS_LABELS.rascunho
            return (
              <div
                key={campanha.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCampaign(campanha.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {campanha.nome}
                    </h3>
                    <span className={cn('badge mt-1', status.badge)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {campanha.status === 'rascunho' && (
                      <>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(campanha)
                          }}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm text-error-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(campanha)
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                    {(campanha.status === 'agendada' || campanha.status === 'em_andamento') && (
                      <button
                        className="btn btn-ghost btn-icon btn-sm text-error-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelMutation.mutate(campanha.id)
                        }}
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {campanha.agendadaPara && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" strokeWidth={1.5} />
                      <span>{formatDateTime(campanha.agendadaPara)}</span>
                    </div>
                  )}
                  {campanha.recorrencia !== 'nenhuma' && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                      <span>{RECURRENCE_LABELS[campanha.recorrencia]}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Criada em {formatDateTime(campanha.createdAt)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state py-24">
          <div className="empty-state-icon">
            <Megaphone className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">Nenhuma campanha criada</h3>
          <p className="empty-state-description">
            Crie sua primeira campanha para começar a engajar seus contatos
          </p>
          <button className="btn btn-primary mt-4" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Criar Campanha
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCampaign(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['campanhas'] })
            setIsModalOpen(false)
            setEditingCampaign(null)
          }}
        />
      )}

      {/* Campaign Detail Drawer */}
      {selectedCampaign && (
        <CampaignDetailDrawer
          campaignId={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onSchedule={(campaign) => {
            setSelectedCampaign(null)
            setScheduleModal(campaign)
          }}
        />
      )}

      {/* Schedule Modal */}
      {scheduleModal && (
        <ScheduleModal
          campaign={scheduleModal}
          onClose={() => setScheduleModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['campanhas'] })
            setScheduleModal(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirmModal
          campaign={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

interface CampaignModalProps {
  campaign: Campanha | null
  onClose: () => void
  onSuccess: () => void
}

function CampaignModal({ campaign, onClose, onSuccess }: CampaignModalProps) {
  const [nome, setNome] = useState(campaign?.nome || '')
  const [templateId, setTemplateId] = useState(campaign?.templateId || '')
  const [filtros, setFiltros] = useState<CampaignFilters>(
    (campaign?.filtros as CampaignFilters) || {}
  )
  const [recorrencia, setRecorrencia] = useState<'nenhuma' | 'diario' | 'semanal' | 'mensal'>(
    campaign?.recorrencia || 'nenhuma'
  )
  const [showFilters, setShowFilters] = useState(false)
  const [previewContacts, setPreviewContacts] = useState<Contato[] | null>(null)

  const { data: templatesList } = useQuery({
    queryKey: ['templates-for-campaign'],
    queryFn: () => templates.list(),
  })

  const { data: tagsList } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCampanhaRequest) => campanhas.create(data),
    onSuccess: () => onSuccess(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCampanhaRequest> }) =>
      campanhas.update(id, data),
    onSuccess: () => onSuccess(),
  })

  const previewMutation = useMutation({
    mutationFn: (filters: CampaignFilters) => campanhas.previewRecipients(filters),
    onSuccess: (data) => {
      setPreviewContacts(data.contacts)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !templateId) return

    const data: CreateCampanhaRequest = {
      nome: nome.trim(),
      templateId,
      filtros: Object.keys(filtros).length > 0 ? filtros : undefined,
      recorrencia,
    }

    if (campaign) {
      updateMutation.mutate({ id: campaign.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleFilterChange = (key: keyof CampaignFilters, value: string[]) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error?.message || updateMutation.error?.message

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {campaign ? 'Editar Campanha' : 'Nova Campanha'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <AlertCircle className="w-4 h-4 text-error-500" strokeWidth={1.5} />
                  <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                </div>
              )}

              <div>
                <label className="label">Nome da Campanha</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Boas-vindas Novos Alunos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="label">Template de Mensagem</label>
                <select
                  className="input"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Selecione um template</option>
                  {templatesList?.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Recorrência</label>
                <select
                  className="input"
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value as typeof recorrencia)}
                >
                  <option value="nenhuma">Sem recorrência (envio único)</option>
                  <option value="diario">Diariamente</option>
                  <option value="semanal">Semanalmente</option>
                  <option value="mensal">Mensalmente</option>
                </select>
              </div>

              {/* Filters Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Filtros de Destinatários
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-5 h-5 text-gray-400 transition-transform',
                      showFilters && 'rotate-90'
                    )}
                    strokeWidth={1.5}
                  />
                </button>

                {showFilters && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Origem</label>
                        <select
                          className="input"
                          multiple
                          value={filtros.origem || []}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, o => o.value)
                            handleFilterChange('origem', values)
                          }}
                        >
                          <option value="organico">Orgânico</option>
                          <option value="campanha">Campanha</option>
                          <option value="indicacao">Indicação</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Estado da Jornada</label>
                        <select
                          className="input"
                          multiple
                          value={filtros.estadoJornada || []}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, o => o.value)
                            handleFilterChange('estadoJornada', values)
                          }}
                        >
                          <option value="inicial">Inicial</option>
                          <option value="boas_vindas">Boas-vindas</option>
                          <option value="qualificado">Qualificado</option>
                          <option value="incompativel">Incompatível</option>
                          <option value="atendimento_humano">Atendimento Humano</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Canal</label>
                        <select
                          className="input"
                          multiple
                          value={filtros.canal || []}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, o => o.value)
                            handleFilterChange('canal', values)
                          }}
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="web">Web</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Tags</label>
                        <select
                          className="input"
                          multiple
                          value={filtros.tags || []}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, o => o.value)
                            handleFilterChange('tags', values)
                          }}
                        >
                          {tagsList?.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => previewMutation.mutate(filtros)}
                        disabled={previewMutation.isPending}
                      >
                        {previewMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                        )}
                        Preview Destinatários
                      </button>
                      {previewContacts !== null && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {previewContacts.length} contatos encontrados
                        </span>
                      )}
                    </div>

                    {previewContacts && previewContacts.length > 0 && (
                      <div className="max-h-40 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm">
                          <tbody>
                            {previewContacts.slice(0, 10).map(c => (
                              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <td className="p-2">{c.nome || 'Sem nome'}</td>
                                <td className="p-2 text-gray-500">{formatPhone(c.telefone)}</td>
                              </tr>
                            ))}
                            {previewContacts.length > 10 && (
                              <tr>
                                <td colSpan={2} className="p-2 text-center text-gray-500">
                                  e mais {previewContacts.length - 10} contatos...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !nome.trim() || !templateId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    {campaign ? 'Salvar' : 'Criar Campanha'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface CampaignDetailDrawerProps {
  campaignId: string
  onClose: () => void
  onSchedule: (campaign: Campanha) => void
}

function CampaignDetailDrawer({ campaignId, onClose, onSchedule }: CampaignDetailDrawerProps) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['campanha', campaignId],
    queryFn: () => campanhas.get(campaignId),
  })

  const { data: destinatarios } = useQuery({
    queryKey: ['campanha-destinatarios', campaignId],
    queryFn: () => campanhas.getDestinatarios(campaignId),
    enabled: !!data,
  })

  const addRecipientsMutation = useMutation({
    mutationFn: () => campanhas.addDestinatarios(campaignId, { fromFilters: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanha', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campanha-destinatarios', campaignId] })
    },
  })

  if (!data) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex items-center justify-center">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      </div>
    )
  }

  const { campanha, recipientStats, totalRecipients } = data
  const status = STATUS_LABELS[campanha.status] || STATUS_LABELS.rascunho

  const statCards = [
    { key: 'pendente', label: 'Pendentes', icon: Clock, color: 'text-gray-500' },
    { key: 'enviada', label: 'Enviadas', icon: Send, color: 'text-blue-500' },
    { key: 'entregue', label: 'Entregues', icon: Mail, color: 'text-primary-500' },
    { key: 'lida', label: 'Lidas', icon: MailOpen, color: 'text-green-500' },
    { key: 'respondida', label: 'Respondidas', icon: MessageSquare, color: 'text-purple-500' },
    { key: 'falhou', label: 'Falhas', icon: XCircle, color: 'text-error-500' },
  ]

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {campanha.nome}
            </h2>
            <span className={cn('badge mt-1', status.badge)}>{status.label}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* Stats Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Estatísticas ({totalRecipients} destinatários)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {statCards.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="card text-center">
                  <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} strokeWidth={1.5} />
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {recipientStats[key] || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Informações
            </h3>
            <div className="space-y-2 text-sm">
              {campanha.agendadaPara && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" strokeWidth={1.5} />
                  <span>Agendada para: {formatDateTime(campanha.agendadaPara)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                <span>{RECURRENCE_LABELS[campanha.recorrencia]}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span>Criada em: {formatDateTime(campanha.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Recipients */}
          {destinatarios && destinatarios.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Destinatários
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-3 font-medium">Contato</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinatarios.slice(0, 10).map(d => (
                      <tr key={d.id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="p-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {d.contato.nome || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-500">{formatPhone(d.contato.telefone)}</p>
                        </td>
                        <td className="p-3">
                          <span className={cn('badge text-xs', {
                            'badge-gray': d.status === 'pendente',
                            'badge-primary': d.status === 'enviada',
                            'badge-warning': d.status === 'entregue',
                            'badge-success': d.status === 'lida' || d.status === 'respondida',
                            'badge-error': d.status === 'falhou',
                          })}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {destinatarios.length > 10 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
                    e mais {destinatarios.length - 10} destinatários...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {campanha.status === 'rascunho' && (
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            {totalRecipients === 0 && (
              <button
                className="btn btn-secondary w-full"
                onClick={() => addRecipientsMutation.mutate()}
                disabled={addRecipientsMutation.isPending}
              >
                {addRecipientsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Users className="w-4 h-4" strokeWidth={1.5} />
                )}
                Adicionar Destinatários dos Filtros
              </button>
            )}
            <button
              className="btn btn-primary w-full"
              onClick={() => onSchedule(campanha)}
              disabled={totalRecipients === 0}
            >
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              Agendar Envio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ScheduleModalProps {
  campaign: Campanha
  onClose: () => void
  onSuccess: () => void
}

function ScheduleModal({ campaign, onClose, onSuccess }: ScheduleModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const scheduleMutation = useMutation({
    mutationFn: () => {
      const agendadaPara = new Date(`${date}T${time}`)
      return campanhas.agendar(campaign.id, agendadaPara.toISOString())
    },
    onSuccess: () => onSuccess(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) return
    scheduleMutation.mutate()
  }

  // Set minimum date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agendar Envio
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.nome}</p>
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-icon">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {scheduleMutation.error && (
                <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <AlertCircle className="w-4 h-4 text-error-500" strokeWidth={1.5} />
                  <p className="text-sm text-error-700 dark:text-error-300">
                    {scheduleMutation.error.message}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                />
              </div>

              <div>
                <label className="label">Horário</label>
                <input
                  type="time"
                  className="input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  O envio será feito de forma gradual (~80 mensagens por hora) para evitar bloqueios.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={scheduleMutation.isPending || !date || !time}
              >
                {scheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" strokeWidth={1.5} />
                    Agendar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface DeleteConfirmModalProps {
  campaign: Campanha
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ campaign, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-error-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Excluir Campanha
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir a campanha{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {campaign.nome}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                className="btn btn-secondary flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                className="btn bg-error-600 hover:bg-error-700 text-white flex-1"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
