import { BarChart3, Download } from 'lucide-react'

export function Reports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Relatorios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analise o desempenho do seu CRM
          </p>
        </div>
        <button className="btn btn-secondary">
          <Download className="w-4 h-4" strokeWidth={1.5} />
          Exportar
        </button>
      </div>

      {/* Empty State */}
      <div className="empty-state py-24">
        <div className="empty-state-icon">
          <BarChart3 className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="empty-state-title">Relatorios em breve</h3>
        <p className="empty-state-description">
          Em breve voce podera visualizar relatorios detalhados sobre seus contatos e conversas
        </p>
      </div>
    </div>
  )
}
