import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react'
import { tags, type Tag as TagType, type CreateTagRequest } from '../services/api'
import { cn } from '../lib/utils'

const TAG_COLORS = [
  { value: 'gray', label: 'Cinza', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  { value: 'red', label: 'Vermelho', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  { value: 'orange', label: 'Laranja', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { value: 'yellow', label: 'Amarelo', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  { value: 'green', label: 'Verde', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { value: 'purple', label: 'Roxo', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { value: 'pink', label: 'Rosa', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
] as const

type TagColor = typeof TAG_COLORS[number]['value']

function getColorClasses(cor: string) {
  return TAG_COLORS.find(c => c.value === cor) || TAG_COLORS[0]
}

export function Tags() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<TagType | null>(null)

  const { data: tagsList, isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTagRequest) => tags.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTagRequest> }) =>
      tags.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEditingTag(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setDeleteConfirm(null)
    },
  })

  const handleOpenCreate = () => {
    setEditingTag(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tag: TagType) => {
    setEditingTag(tag)
    setIsModalOpen(true)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-l-error-500 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" strokeWidth={1.5} />
            <p className="text-error-700 dark:text-error-300">Erro ao carregar tags.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tags</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize seus contatos com etiquetas coloridas
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Tag
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner spinner-lg text-primary-600" />
        </div>
      ) : tagsList && tagsList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tagsList.map((tag) => {
            const colorClasses = getColorClasses(tag.cor)
            return (
              <div
                key={tag.id}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', colorClasses.dot)} />
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium',
                      colorClasses.bg,
                      colorClasses.text
                    )}>
                      {tag.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleOpenEdit(tag)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                      onClick={() => setDeleteConfirm(tag)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state py-24">
          <div className="empty-state-icon">
            <Tag className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h3 className="empty-state-title">Nenhuma tag criada</h3>
          <p className="empty-state-description">
            Crie tags para categorizar e organizar seus contatos
          </p>
          <button className="btn btn-primary mt-4" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Criar Tag
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTag(null)
          }}
          onSubmit={(data) => {
            if (editingTag) {
              updateMutation.mutate({ id: editingTag.id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          tag={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

interface TagModalProps {
  tag: TagType | null
  onClose: () => void
  onSubmit: (data: CreateTagRequest) => void
  isLoading: boolean
  error?: string
}

function TagModal({ tag, onClose, onSubmit, isLoading, error }: TagModalProps) {
  const [nome, setNome] = useState(tag?.nome || '')
  const [cor, setCor] = useState<TagColor>(tag?.cor || 'blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    onSubmit({ nome: nome.trim(), cor })
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tag ? 'Editar Tag' : 'Nova Tag'}
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
            <div className="p-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <AlertCircle className="w-4 h-4 text-error-500" strokeWidth={1.5} />
                  <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                </div>
              )}

              <div>
                <label className="label">Nome da Tag</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: VIP, Urgente, Novo..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label className="label">Cor</label>
                <div className="grid grid-cols-4 gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        'flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-all',
                        cor === color.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                      onClick={() => setCor(color.value)}
                    >
                      <div className={cn('w-4 h-4 rounded-full', color.dot)} />
                      {cor === color.value && (
                        <Check className="w-3.5 h-3.5 text-primary-600" strokeWidth={2} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="label">Preview</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const colorClasses = getColorClasses(cor)
                    return (
                      <span className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        colorClasses.bg,
                        colorClasses.text
                      )}>
                        {nome || 'Nome da tag'}
                      </span>
                    )
                  })()}
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
                disabled={isLoading || !nome.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    {tag ? 'Salvar' : 'Criar Tag'}
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
  tag: TagType
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ tag, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  const colorClasses = getColorClasses(tag.cor)

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
              Excluir Tag
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir a tag{' '}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-sm font-medium',
                colorClasses.bg,
                colorClasses.text
              )}>
                {tag.nome}
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
