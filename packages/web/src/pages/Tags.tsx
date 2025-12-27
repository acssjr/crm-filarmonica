import { Tag, Plus } from 'lucide-react'

export function Tags() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tags</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize seus contatos com etiquetas
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Tag
        </button>
      </div>

      {/* Empty State */}
      <div className="empty-state py-24">
        <div className="empty-state-icon">
          <Tag className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">Nenhuma tag criada</h3>
        <p className="empty-state-description">
          Crie tags para categorizar e organizar seus contatos
        </p>
        <button className="btn btn-primary mt-4">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Criar Tag
        </button>
      </div>
    </div>
  )
}
