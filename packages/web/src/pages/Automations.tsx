import { Workflow, Plus } from 'lucide-react'

export function Automations() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Automacoes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure fluxos automaticos de atendimento
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Automacao
        </button>
      </div>

      {/* Empty State */}
      <div className="empty-state py-24">
        <div className="empty-state-icon">
          <Workflow className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">Nenhuma automacao configurada</h3>
        <p className="empty-state-description">
          Crie automacoes para responder seus contatos automaticamente
        </p>
        <button className="btn btn-primary mt-4">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Criar Automacao
        </button>
      </div>
    </div>
  )
}
