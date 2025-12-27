import { Settings as SettingsIcon, Bell, Lock, Palette, Globe, Webhook } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

const settingsSections = [
  { id: 'general', name: 'Geral', icon: SettingsIcon },
  { id: 'notifications', name: 'Notificacoes', icon: Bell },
  { id: 'security', name: 'Seguranca', icon: Lock },
  { id: 'appearance', name: 'Aparencia', icon: Palette },
  { id: 'integrations', name: 'Integracoes', icon: Webhook },
  { id: 'language', name: 'Idioma', icon: Globe },
]

export function Settings() {
  const [activeSection, setActiveSection] = useState('general')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuracoes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Personalize seu CRM
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    activeSection === section.id
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                {settingsSections.find((s) => s.id === activeSection)?.name}
              </h2>
              <p className="card-description">
                Configuracoes de {settingsSections.find((s) => s.id === activeSection)?.name.toLowerCase()}
              </p>
            </div>

            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <SettingsIcon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="empty-state-title">Em breve</h3>
              <p className="empty-state-description">
                Esta secao de configuracoes estara disponivel em breve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
