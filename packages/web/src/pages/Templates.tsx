import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  Send,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Variable,
  Copy,
} from 'lucide-react'
import {
  templates,
  type Template,
  type TemplateCategoria,
  type CreateTemplateRequest,
} from '../services/api'
import { cn } from '../lib/utils'

export function Templates() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [testTemplate, setTestTemplate] = useState<Template | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['uncategorized']))
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: templatesList, isLoading, error } = useQuery({
    queryKey: ['templates', selectedCategory],
    queryFn: () => templates.list(selectedCategory || undefined),
  })

  const { data: categorias } = useQuery({
    queryKey: ['template-categorias'],
    queryFn: () => templates.listCategorias(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateRequest) => templates.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setIsModalOpen(false)
      setEditingTemplate(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateRequest> }) =>
      templates.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setIsModalOpen(false)
      setEditingTemplate(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setDeleteConfirm(null)
    },
  })

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Group templates by category
  const groupedTemplates = (templatesList || []).reduce((acc, template) => {
    const categoryId = template.categoriaId || 'uncategorized'
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar templates.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Modelos de mensagens para suas campanhas
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Novo Template
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <label className="label">Categoria</label>
            <select
              className="input"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Todas as categorias</option>
              {categorias?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      ) : templatesList && templatesList.length > 0 ? (
        <div className="space-y-4">
          {/* Uncategorized */}
          {groupedTemplates['uncategorized']?.length > 0 && (
            <CategorySection
              categoryId="uncategorized"
              categoryName="Sem Categoria"
              templates={groupedTemplates['uncategorized']}
              isExpanded={expandedCategories.has('uncategorized')}
              onToggle={() => toggleCategory('uncategorized')}
              onEdit={handleOpenEdit}
              onDelete={setDeleteConfirm}
              onPreview={setPreviewTemplate}
              onTest={setTestTemplate}
            />
          )}

          {/* Categorized */}
          {categorias?.map(cat => {
            const catTemplates = groupedTemplates[cat.id]
            if (!catTemplates?.length) return null
            return (
              <CategorySection
                key={cat.id}
                categoryId={cat.id}
                categoryName={cat.nome}
                isSystem={cat.isSistema}
                templates={catTemplates}
                isExpanded={expandedCategories.has(cat.id)}
                onToggle={() => toggleCategory(cat.id)}
                onEdit={handleOpenEdit}
                onDelete={setDeleteConfirm}
                onPreview={setPreviewTemplate}
                onTest={setTestTemplate}
              />
            )
          })}
        </div>
      ) : (
        <div className="empty-state py-24">
          <div className="empty-state-icon">
            <FileText className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">Nenhum template criado</h3>
          <p className="empty-state-description">
            Crie templates para agilizar o envio de mensagens padronizadas
          </p>
          <button className="btn btn-primary mt-4" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Criar Template
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <TemplateModal
          template={editingTemplate}
          categorias={categorias || []}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTemplate(null)
          }}
          onSubmit={(data) => {
            if (editingTemplate) {
              updateMutation.mutate({ id: editingTemplate.id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Test Modal */}
      {testTemplate && (
        <TestModal
          template={testTemplate}
          onClose={() => setTestTemplate(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          template={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

interface CategorySectionProps {
  categoryId: string
  categoryName: string
  isSystem?: boolean
  templates: Template[]
  isExpanded: boolean
  onToggle: () => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
  onPreview: (template: Template) => void
  onTest: (template: Template) => void
}

function CategorySection({
  categoryName,
  isSystem,
  templates,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onPreview,
  onTest,
}: CategorySectionProps) {
  return (
    <div className="card p-0 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          )}
          <FolderOpen className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
          <span className="font-medium text-gray-900 dark:text-white">{categoryName}</span>
          {isSystem && (
            <span className="badge badge-gray text-xs">Sistema</span>
          )}
          <span className="badge badge-primary">{templates.length}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {templates.map(template => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {template.nome}
                  </h4>
                  {template.tipo === 'hsm' && (
                    <span className="badge badge-warning text-xs">HSM</span>
                  )}
                  {template.hsmStatus && (
                    <span className={cn('badge text-xs', {
                      'badge-warning': template.hsmStatus === 'pendente',
                      'badge-success': template.hsmStatus === 'aprovado',
                      'badge-error': template.hsmStatus === 'rejeitado',
                    })}>
                      {template.hsmStatus}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                  {template.conteudo.substring(0, 100)}
                  {template.conteudo.length > 100 ? '...' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => onPreview(template)}
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => onTest(template)}
                  title="Testar Envio"
                >
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => onEdit(template)}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                  onClick={() => onDelete(template)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TemplateModalProps {
  template: Template | null
  categorias: TemplateCategoria[]
  onClose: () => void
  onSubmit: (data: CreateTemplateRequest) => void
  isLoading: boolean
  error?: string
}

function TemplateModal({ template, categorias, onClose, onSubmit, isLoading, error }: TemplateModalProps) {
  const [nome, setNome] = useState(template?.nome || '')
  const [conteudo, setConteudo] = useState(template?.conteudo || '')
  const [categoriaId, setCategoriaId] = useState(template?.categoriaId || '')
  const [tipo, setTipo] = useState<'interno' | 'hsm'>(template?.tipo || 'interno')
  const [hsmNome, setHsmNome] = useState(template?.hsmNome || '')
  const [showVariables, setShowVariables] = useState(false)

  const { data: variables } = useQuery({
    queryKey: ['template-variables'],
    queryFn: () => templates.getVariables(),
  })

  const { data: previewData } = useQuery({
    queryKey: ['template-preview-content', conteudo],
    queryFn: () => templates.previewContent(conteudo),
    enabled: conteudo.length > 0,
  })

  const insertVariable = (key: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = conteudo.substring(0, start) + `{${key}}` + conteudo.substring(end)
      setConteudo(newContent)
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + key.length + 2
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    } else {
      setConteudo(prev => prev + `{${key}}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !conteudo.trim()) return
    onSubmit({
      nome: nome.trim(),
      conteudo: conteudo.trim(),
      categoriaId: categoriaId || undefined,
      tipo,
      hsmNome: tipo === 'hsm' ? hsmNome : undefined,
    })
  }

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
                {template ? 'Editar Template' : 'Novo Template'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome do Template</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Boas-vindas"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select
                    className="input"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as 'interno' | 'hsm')}
                  >
                    <option value="interno">Interno</option>
                    <option value="hsm">HSM (WhatsApp Business)</option>
                  </select>
                </div>
                {tipo === 'hsm' && (
                  <div>
                    <label className="label">Nome HSM</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="nome_do_template_hsm"
                      value={hsmNome}
                      onChange={(e) => setHsmNome(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Conteúdo</label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    <Variable className="w-4 h-4" strokeWidth={1.5} />
                    Variáveis
                  </button>
                </div>

                {showVariables && variables && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Clique para inserir no texto:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variables.map(v => (
                        <button
                          key={v.key}
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                          onClick={() => insertVariable(v.key)}
                          title={`${v.label} - Ex: ${v.example}`}
                        >
                          <span>{`{${v.key}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  id="template-content"
                  className="input min-h-[120px] font-mono text-sm"
                  placeholder="Olá {nome}, seja bem-vindo à Sociedade Filarmônica!"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Preview */}
              {conteudo && (
                <div>
                  <label className="label">Preview</label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewData?.preview || conteudo}
                    </p>
                  </div>
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
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !nome.trim() || !conteudo.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    {template ? 'Salvar' : 'Criar Template'}
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

interface PreviewModalProps {
  template: Template
  onClose: () => void
}

function PreviewModal({ template, onClose }: PreviewModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['template-preview', template.id],
    queryFn: () => templates.preview(template.id),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {template.nome}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preview do template
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner spinner-lg text-primary-600" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Conteúdo Original</label>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => copyToClipboard(data?.original || template.conteudo)}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {data?.original || template.conteudo}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Preview com Exemplo</label>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => copyToClipboard(data?.preview || '')}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="text-sm text-primary-800 dark:text-primary-200 whitespace-pre-wrap">
                      {data?.preview}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TestModalProps {
  template: Template
  onClose: () => void
}

function TestModal({ template, onClose }: TestModalProps) {
  const [telefone, setTelefone] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string; preview: string } | null>(null)

  const testMutation = useMutation({
    mutationFn: () => templates.test(template.id, telefone),
    onSuccess: (data) => {
      setResult(data)
    },
    onError: (error: Error) => {
      setResult({ success: false, message: error.message, preview: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!telefone.trim()) return
    testMutation.mutate()
  }

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
                  Testar Envio
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {template.nome}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {result && (
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border',
                  result.success
                    ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                    : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                )}>
                  {result.success ? (
                    <Check className="w-4 h-4 text-success-500" strokeWidth={1.5} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-error-500" strokeWidth={1.5} />
                  )}
                  <p className={cn(
                    'text-sm',
                    result.success
                      ? 'text-success-700 dark:text-success-300'
                      : 'text-error-700 dark:text-error-300'
                  )}>
                    {result.message}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Número de Telefone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="75999001234"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Apenas números, com DDD
                </p>
              </div>

              {result?.preview && (
                <div>
                  <label className="label">Mensagem Enviada</label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {result.preview}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testMutation.isPending || !telefone.trim()}
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                    Enviar Teste
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
  template: Template
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ template, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
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
              Excluir Template
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir o template{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {template.nome}
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
