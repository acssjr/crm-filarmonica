import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Workflow,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Loader2,
  Play,
  Pause,
  ChevronRight,
  Zap,
  Clock,
  Tag,
  MessageSquare,
  Users,
  Send,
  Bell,
  Filter,
} from 'lucide-react'
import {
  automacoes,
  templates,
  tags,
  type Automacao,
  type CreateAutomacaoRequest,
  type TriggerTipo,
  type ActionTipo,
  type ConditionCampo,
  type ConditionOperador,
} from '../services/api'
import { cn, formatDateTime } from '../lib/utils'

const TRIGGER_LABELS: Record<TriggerTipo, { label: string; description: string }> = {
  novo_contato: { label: 'Novo Contato', description: 'Quando um novo contato é criado' },
  tag_adicionada: { label: 'Tag Adicionada', description: 'Quando uma tag é adicionada a um contato' },
  tag_removida: { label: 'Tag Removida', description: 'Quando uma tag é removida de um contato' },
  jornada_mudou: { label: 'Jornada Mudou', description: 'Quando o estado da jornada muda' },
  tempo_sem_interacao: { label: 'Tempo sem Interação', description: 'Quando passa X dias sem mensagem' },
  mensagem_recebida: { label: 'Mensagem Recebida', description: 'Quando uma mensagem é recebida' },
}

const ACTION_LABELS: Record<ActionTipo, { label: string; icon: typeof Send }> = {
  enviar_mensagem: { label: 'Enviar Mensagem', icon: MessageSquare },
  enviar_template: { label: 'Enviar Template', icon: Send },
  adicionar_tag: { label: 'Adicionar Tag', icon: Tag },
  remover_tag: { label: 'Remover Tag', icon: Tag },
  mudar_jornada: { label: 'Mudar Jornada', icon: Users },
  notificar_admin: { label: 'Notificar Admin', icon: Bell },
  aguardar: { label: 'Aguardar', icon: Clock },
}

const CONDITION_LABELS: Record<ConditionCampo, string> = {
  tags: 'Tags',
  estadoJornada: 'Estado da Jornada',
  origem: 'Origem',
  idade: 'Idade',
  instrumentoDesejado: 'Instrumento Desejado',
}

const OPERADOR_LABELS: Record<ConditionOperador, string> = {
  igual: 'é igual a',
  diferente: 'é diferente de',
  contem: 'contém',
  nao_contem: 'não contém',
}

export function Automations() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automacao | null>(null)
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Automacao | null>(null)

  const { data: automacoesList, isLoading, error } = useQuery({
    queryKey: ['automacoes'],
    queryFn: () => automacoes.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automacoes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automacoes'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? automacoes.desativar(id) : automacoes.ativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automacoes'] })
    },
  })

  const handleOpenCreate = () => {
    setEditingAutomation(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (automation: Automacao) => {
    setEditingAutomation(automation)
    setIsModalOpen(true)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar automações.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Automações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure fluxos automáticos de atendimento
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Automação
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      ) : automacoesList && automacoesList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {automacoesList.map((automation) => {
            const trigger = TRIGGER_LABELS[automation.triggerTipo]
            return (
              <div
                key={automation.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAutomation(automation.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {automation.nome}
                    </h3>
                    <span
                      className={cn(
                        'badge mt-1',
                        automation.ativo ? 'badge-success' : 'badge-gray'
                      )}
                    >
                      {automation.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      className={cn(
                        'btn btn-ghost btn-icon btn-sm',
                        automation.ativo ? 'text-warning-600' : 'text-success-600'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMutation.mutate({ id: automation.id, ativo: automation.ativo })
                      }}
                      title={automation.ativo ? 'Desativar' : 'Ativar'}
                      disabled={toggleMutation.isPending}
                    >
                      {automation.ativo ? (
                        <Pause className="w-4 h-4" strokeWidth={1.5} />
                      ) : (
                        <Play className="w-4 h-4" strokeWidth={1.5} />
                      )}
                    </button>
                    {!automation.ativo && (
                      <>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(automation)
                          }}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm text-error-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(automation)
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
                    <span>{trigger?.label || automation.triggerTipo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" strokeWidth={1.5} />
                    <span>
                      {automation.condicoes.length > 0
                        ? `${automation.condicoes.length} condição(ões)`
                        : 'Sem condições'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" strokeWidth={1.5} />
                    <span>{automation.acoes.length} ação(ões)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Criada em {formatDateTime(automation.createdAt)}
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
            <Workflow className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">Nenhuma automação configurada</h3>
          <p className="empty-state-description">
            Crie automações para responder seus contatos automaticamente
          </p>
          <button className="btn btn-primary mt-4" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Criar Automação
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <AutomationModal
          automation={editingAutomation}
          onClose={() => {
            setIsModalOpen(false)
            setEditingAutomation(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['automacoes'] })
            setIsModalOpen(false)
            setEditingAutomation(null)
          }}
        />
      )}

      {/* Detail Drawer */}
      {selectedAutomation && (
        <AutomationDetailDrawer
          automationId={selectedAutomation}
          onClose={() => setSelectedAutomation(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirmModal
          automation={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

interface AutomationModalProps {
  automation: Automacao | null
  onClose: () => void
  onSuccess: () => void
}

function AutomationModal({ automation, onClose, onSuccess }: AutomationModalProps) {
  const [nome, setNome] = useState(automation?.nome || '')
  const [triggerTipo, setTriggerTipo] = useState<TriggerTipo>(
    automation?.triggerTipo || 'novo_contato'
  )
  const [triggerConfig, setTriggerConfig] = useState(automation?.triggerConfig || {})
  const [condicoes, setCondicoes] = useState(automation?.condicoes || [])
  const [acoes, setAcoes] = useState(
    automation?.acoes || [{ tipo: 'enviar_mensagem' as ActionTipo, config: {} }]
  )
  const [showConditions, setShowConditions] = useState(false)

  const { data: templatesList } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templates.list(),
  })

  const { data: tagsList } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAutomacaoRequest) => automacoes.create(data),
    onSuccess: () => onSuccess(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAutomacaoRequest> }) =>
      automacoes.update(id, data),
    onSuccess: () => onSuccess(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || acoes.length === 0) return

    const data: CreateAutomacaoRequest = {
      nome: nome.trim(),
      triggerTipo,
      triggerConfig,
      condicoes: condicoes.length > 0 ? condicoes : undefined,
      acoes,
    }

    if (automation) {
      updateMutation.mutate({ id: automation.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const addAction = () => {
    setAcoes([...acoes, { tipo: 'enviar_mensagem', config: {} }])
  }

  const removeAction = (index: number) => {
    setAcoes(acoes.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, updates: Partial<(typeof acoes)[0]>) => {
    setAcoes(acoes.map((a, i) => (i === index ? { ...a, ...updates } : a)))
  }

  const addCondition = () => {
    setCondicoes([...condicoes, { campo: 'estadoJornada' as ConditionCampo, operador: 'igual' as ConditionOperador, valor: '' }])
  }

  const removeCondition = (index: number) => {
    setCondicoes(condicoes.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<(typeof condicoes)[0]>) => {
    setCondicoes(condicoes.map((c, i) => (i === index ? { ...c, ...updates } : c)))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error?.message || updateMutation.error?.message

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {automation ? 'Editar Automação' : 'Nova Automação'}
              </h2>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-icon">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <AlertCircle className="w-4 h-4 text-error-500" strokeWidth={1.5} />
                  <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="label">Nome da Automação</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Boas-vindas Novos Contatos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="label">Quando executar (Trigger)</label>
                <select
                  className="input"
                  value={triggerTipo}
                  onChange={(e) => {
                    setTriggerTipo(e.target.value as TriggerTipo)
                    setTriggerConfig({})
                  }}
                >
                  {Object.entries(TRIGGER_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {TRIGGER_LABELS[triggerTipo]?.description}
                </p>

                {/* Trigger-specific config */}
                {triggerTipo === 'tag_adicionada' || triggerTipo === 'tag_removida' ? (
                  <div className="mt-3">
                    <label className="label text-sm">Tag específica (opcional)</label>
                    <select
                      className="input"
                      value={triggerConfig.tagId || ''}
                      onChange={(e) =>
                        setTriggerConfig({ ...triggerConfig, tagId: e.target.value || undefined })
                      }
                    >
                      <option value="">Qualquer tag</option>
                      {tagsList?.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : triggerTipo === 'tempo_sem_interacao' ? (
                  <div className="mt-3">
                    <label className="label text-sm">Dias sem interação</label>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      value={triggerConfig.dias || ''}
                      onChange={(e) =>
                        setTriggerConfig({
                          ...triggerConfig,
                          dias: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Ex: 7"
                    />
                  </div>
                ) : triggerTipo === 'mensagem_recebida' ? (
                  <div className="mt-3">
                    <label className="label text-sm">Palavra-chave (opcional)</label>
                    <input
                      type="text"
                      className="input"
                      value={triggerConfig.palavraChave || ''}
                      onChange={(e) =>
                        setTriggerConfig({
                          ...triggerConfig,
                          palavraChave: e.target.value || undefined,
                        })
                      }
                      placeholder="Ex: informação"
                    />
                  </div>
                ) : null}
              </div>

              {/* Conditions */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => setShowConditions(!showConditions)}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Condições ({condicoes.length})
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-5 h-5 text-gray-400 transition-transform',
                      showConditions && 'rotate-90'
                    )}
                    strokeWidth={1.5}
                  />
                </button>

                {showConditions && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {condicoes.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          className="input flex-1"
                          value={condition.campo}
                          onChange={(e) =>
                            updateCondition(index, { campo: e.target.value as ConditionCampo })
                          }
                        >
                          {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="input w-40"
                          value={condition.operador}
                          onChange={(e) =>
                            updateCondition(index, { operador: e.target.value as ConditionOperador })
                          }
                        >
                          {condition.campo === 'tags' ? (
                            <>
                              <option value="contem">contém</option>
                              <option value="nao_contem">não contém</option>
                            </>
                          ) : (
                            <>
                              <option value="igual">é igual a</option>
                              <option value="diferente">é diferente de</option>
                            </>
                          )}
                        </select>
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Valor"
                          value={Array.isArray(condition.valor) ? condition.valor.join(', ') : condition.valor}
                          onChange={(e) => updateCondition(index, { valor: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm text-error-600"
                          onClick={() => removeCondition(index)}
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={addCondition}
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                      Adicionar Condição
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <label className="label">Ações</label>
                <div className="space-y-3">
                  {acoes.map((action, index) => {
                    const ActionIcon = ACTION_LABELS[action.tipo]?.icon || Play
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <ActionIcon className="w-4 h-4 text-primary-600" strokeWidth={1.5} />
                          </div>
                          <select
                            className="input flex-1"
                            value={action.tipo}
                            onChange={(e) =>
                              updateAction(index, { tipo: e.target.value as ActionTipo, config: {} })
                            }
                          >
                            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {acoes.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-error-600"
                              onClick={() => removeAction(index)}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>

                        {/* Action-specific config */}
                        {action.tipo === 'enviar_mensagem' && (
                          <textarea
                            className="input"
                            rows={3}
                            placeholder="Digite a mensagem..."
                            value={action.config?.mensagem || ''}
                            onChange={(e) =>
                              updateAction(index, {
                                config: { ...action.config, mensagem: e.target.value },
                              })
                            }
                          />
                        )}

                        {action.tipo === 'enviar_template' && (
                          <select
                            className="input"
                            value={action.config?.templateId || ''}
                            onChange={(e) =>
                              updateAction(index, {
                                config: { ...action.config, templateId: e.target.value },
                              })
                            }
                          >
                            <option value="">Selecione um template</option>
                            {templatesList?.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nome}
                              </option>
                            ))}
                          </select>
                        )}

                        {(action.tipo === 'adicionar_tag' || action.tipo === 'remover_tag') && (
                          <select
                            className="input"
                            value={action.config?.tagId || ''}
                            onChange={(e) =>
                              updateAction(index, {
                                config: { ...action.config, tagId: e.target.value },
                              })
                            }
                          >
                            <option value="">Selecione uma tag</option>
                            {tagsList?.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nome}
                              </option>
                            ))}
                          </select>
                        )}

                        {action.tipo === 'mudar_jornada' && (
                          <select
                            className="input"
                            value={action.config?.estado || ''}
                            onChange={(e) =>
                              updateAction(index, {
                                config: { ...action.config, estado: e.target.value },
                              })
                            }
                          >
                            <option value="">Selecione um estado</option>
                            <option value="inicial">Inicial</option>
                            <option value="boas_vindas">Boas-vindas</option>
                            <option value="qualificado">Qualificado</option>
                            <option value="atendimento_humano">Atendimento Humano</option>
                            <option value="incompativel">Incompatível</option>
                          </select>
                        )}

                        {action.tipo === 'notificar_admin' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              className="input"
                              placeholder="Telefone do admin (ex: 5575999999999)"
                              value={action.config?.adminPhone || ''}
                              onChange={(e) =>
                                updateAction(index, {
                                  config: { ...action.config, adminPhone: e.target.value },
                                })
                              }
                            />
                            <textarea
                              className="input"
                              rows={2}
                              placeholder="Mensagem de notificação..."
                              value={action.config?.mensagem || ''}
                              onChange={(e) =>
                                updateAction(index, {
                                  config: { ...action.config, mensagem: e.target.value },
                                })
                              }
                            />
                          </div>
                        )}

                        {action.tipo === 'aguardar' && (
                          <input
                            type="number"
                            className="input"
                            min={1}
                            placeholder="Dias para aguardar"
                            value={action.config?.dias || ''}
                            onChange={(e) =>
                              updateAction(index, {
                                config: { ...action.config, dias: parseInt(e.target.value) || undefined },
                              })
                            }
                          />
                        )}
                      </div>
                    )
                  })}

                  <button type="button" className="btn btn-secondary" onClick={addAction}>
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    Adicionar Ação
                  </button>
                </div>
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
                disabled={isLoading || !nome.trim() || acoes.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    {automation ? 'Salvar' : 'Criar Automação'}
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

interface AutomationDetailDrawerProps {
  automationId: string
  onClose: () => void
}

function AutomationDetailDrawer({ automationId, onClose }: AutomationDetailDrawerProps) {
  const { data: automation } = useQuery({
    queryKey: ['automacao', automationId],
    queryFn: () => automacoes.get(automationId),
  })

  const { data: execucoes } = useQuery({
    queryKey: ['automacao-execucoes', automationId],
    queryFn: () => automacoes.getExecucoes(automationId),
    enabled: !!automation,
  })

  if (!automation) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex items-center justify-center">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      </div>
    )
  }

  const trigger = TRIGGER_LABELS[automation.triggerTipo]

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {automation.nome}
            </h2>
            <span
              className={cn('badge mt-1', automation.ativo ? 'badge-success' : 'badge-gray')}
            >
              {automation.ativo ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* Trigger */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Trigger
            </h3>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{trigger?.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {trigger?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {automation.condicoes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Condições
              </h3>
              <div className="space-y-2">
                {automation.condicoes.map((condition, index) => (
                  <div key={index} className="card text-sm">
                    <span className="font-medium">{CONDITION_LABELS[condition.campo]}</span>{' '}
                    <span className="text-gray-500">{OPERADOR_LABELS[condition.operador]}</span>{' '}
                    <span className="text-primary-600">
                      {Array.isArray(condition.valor) ? condition.valor.join(', ') : condition.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Ações
            </h3>
            <div className="space-y-2">
              {automation.acoes.map((action, index) => {
                const ActionIcon = ACTION_LABELS[action.tipo]?.icon || Play
                return (
                  <div key={index} className="card">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                      </div>
                      <ActionIcon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      <span className="text-gray-900 dark:text-white">
                        {ACTION_LABELS[action.tipo]?.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Executions */}
          {execucoes && execucoes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Últimas Execuções
              </h3>
              <div className="space-y-2">
                {execucoes.slice(0, 10).map((exec) => (
                  <div key={exec.id} className="card text-sm">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn('badge', {
                          'badge-success': exec.status === 'sucesso',
                          'badge-error': exec.status === 'falha',
                          'badge-warning': exec.status === 'aguardando',
                          'badge-primary': exec.status === 'executando',
                        })}
                      >
                        {exec.status}
                      </span>
                      <span className="text-gray-500">{formatDateTime(exec.createdAt)}</span>
                    </div>
                    {exec.erro && (
                      <p className="text-error-600 mt-2 text-xs">{exec.erro}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DeleteConfirmModalProps {
  automation: Automacao
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ automation, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-error-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Excluir Automação
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir a automação{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {automation.nome}
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
