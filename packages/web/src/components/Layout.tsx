import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  Megaphone,
  FileText,
  BarChart3,
  Filter,
  Workflow,
  Tag,
  UserCog,
  Settings,
  ChevronUp,
  LogOut,
  User,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useDarkMode } from '../hooks/useDarkMode'

const navigation = {
  principal: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Conversas', href: '/conversations', icon: MessageSquare, badge: 12 },
    { name: 'Contatos', href: '/contacts', icon: Users },
    { name: 'Interessados', href: '/prospects', icon: UserCheck, badge: 4 },
  ],
  marketing: [
    { name: 'Campanhas', href: '/campaigns', icon: Megaphone },
    { name: 'Templates', href: '/templates', icon: FileText },
  ],
  analise: [
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Funil', href: '/funnel', icon: Filter },
  ],
  gerenciar: [
    { name: 'Automações', href: '/automations', icon: Workflow },
    { name: 'Tags', href: '/tags', icon: Tag },
    { name: 'Equipe', href: '/team', icon: UserCog },
  ],
}

export function Layout() {
  const location = useLocation()
  const { isDark, toggleTheme } = useDarkMode()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const renderNavSection = (items: typeof navigation.principal, label?: string) => (
    <div className={label ? 'sidebar-section' : ''}>
      {label && <div className="sidebar-section-label">{label}</div>}
      <div className="mt-2 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn('sidebar-link', isActive && 'active')}
            >
              <item.icon strokeWidth={1.5} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="sidebar-brand">CRM</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Atendimento</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {renderNavSection(navigation.principal)}
          {renderNavSection(navigation.marketing, 'Marketing')}
          {renderNavSection(navigation.analise, 'Análise')}
          {renderNavSection(navigation.gerenciar, 'Gerenciar')}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer space-y-1">
          <Link to="/settings" className="sidebar-link">
            <Settings strokeWidth={1.5} />
            <span>Configurações</span>
          </Link>

          {/* User Card */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="user-card w-full"
            >
              <div className="relative">
                <div className="user-avatar">A</div>
                <div className="absolute -bottom-0.5 -right-0.5 online-dot ring-2 ring-white dark:ring-gray-950" />
              </div>
              <div className="user-info">
                <p className="user-name">Administrador</p>
                <p className="user-email">admin@crm.com</p>
              </div>
              <ChevronUp
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform',
                  userMenuOpen && 'rotate-180'
                )}
                strokeWidth={1.5}
              />
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="dropdown absolute bottom-full left-0 right-0 mb-2">
                <button
                  onClick={toggleTheme}
                  className="dropdown-item w-full"
                >
                  {isDark ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />}
                  <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
                </button>
                <div className="dropdown-divider" />
                <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <User strokeWidth={1.5} />
                  <span>Meu perfil</span>
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <Settings strokeWidth={1.5} />
                  <span>Configurações da conta</span>
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item w-full text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20">
                  <LogOut strokeWidth={1.5} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
