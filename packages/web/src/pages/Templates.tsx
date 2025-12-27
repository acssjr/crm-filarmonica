import { FileText, Plus } from 'lucide-react'

export function Templates() {
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
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Novo Template
        </button>
      </div>

      {/* Empty State */}
      <div className="empty-state py-24">
        <div className="empty-state-icon">
          <FileText className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">Nenhum template criado</h3>
        <p className="empty-state-description">
          Crie templates para agilizar o envio de mensagens padronizadas
        </p>
        <button className="btn btn-primary mt-4">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Criar Template
        </button>
      </div>
    </div>
  )
}
