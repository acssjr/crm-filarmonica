import { Filter, Settings } from 'lucide-react'

export function Funnel() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Funil de Vendas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe o progresso dos seus leads
          </p>
        </div>
        <button className="btn btn-secondary">
          <Settings className="w-4 h-4" strokeWidth={1.5} />
          Configurar
        </button>
      </div>

      {/* Empty State */}
      <div className="empty-state py-24">
        <div className="empty-state-icon">
          <Filter className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">Funil em breve</h3>
        <p className="empty-state-description">
          Em breve você poderá visualizar e gerenciar seu funil de vendas aqui
        </p>
      </div>
    </div>
  )
}
