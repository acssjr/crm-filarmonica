/**
 * Test utilities and wrappers for React Testing Library
 */
import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'

// Create a new QueryClient for each test to ensure isolation
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { initialEntries = ['/'], queryClient = createTestQueryClient(), ...renderOptions } = options

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return {
    ...result,
    queryClient,
  }
}

/**
 * Wrapper for components that need BrowserRouter instead of MemoryRouter
 */
export function renderWithBrowserRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return {
    ...result,
    queryClient,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Mock data generators
export const mockContato = (overrides = {}) => ({
  id: 'contact-1',
  telefone: '5575999999999',
  nome: 'John Doe',
  tipo: 'interessado',
  origem: 'organico',
  origemCampanha: null,
  canal: 'whatsapp',
  estadoJornada: 'qualificado',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  ...overrides,
})

export const mockInteressado = (overrides = {}) => ({
  id: 'interessado-1',
  contatoId: 'contact-1',
  nome: 'John Doe',
  idade: 25,
  instrumentoDesejado: 'violino',
  instrumentoSugerido: 'violino',
  experienciaMusical: 'iniciante',
  expectativas: 'Aprender a tocar',
  disponibilidadeHorario: true,
  compativel: true,
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
})

export const mockConversa = (overrides = {}) => ({
  id: 'conversa-1',
  contatoId: 'contact-1',
  canal: 'whatsapp',
  status: 'ativa',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  closedAt: null,
  ...overrides,
})

export const mockMensagem = (overrides = {}) => ({
  id: 'msg-1',
  conversaId: 'conversa-1',
  direcao: 'entrada',
  conteudo: 'Hello World',
  tipo: 'texto',
  enviadoPor: null,
  whatsappId: 'wamid123',
  statusEnvio: 'entregue',
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
})

export const mockTag = (overrides = {}) => ({
  id: 'tag-1',
  nome: 'VIP',
  cor: 'blue' as const,
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
})

export const mockTemplate = (overrides = {}) => ({
  id: 'template-1',
  categoriaId: null,
  nome: 'Welcome Template',
  conteudo: 'Welcome {{nome}}!',
  tipo: 'interno' as const,
  hsmNome: null,
  hsmStatus: null,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  categoria: null,
  ...overrides,
})

export const mockAutomacao = (overrides = {}) => ({
  id: 'automacao-1',
  nome: 'Welcome Automation',
  ativo: true,
  triggerTipo: 'novo_contato' as const,
  triggerConfig: {},
  condicoes: [],
  acoes: [{ tipo: 'enviar_mensagem' as const, config: { mensagem: 'Hello!' } }],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  ...overrides,
})

export const mockDashboardStats = (overrides = {}) => ({
  totalContatos: 150,
  conversasAtivas: 25,
  novosHoje: 5,
  interessadosQualificados: 45,
  porOrigem: [
    { origem: 'organico', count: 80 },
    { origem: 'campanha', count: 50 },
    { origem: 'indicacao', count: 20 },
  ],
  porEstadoJornada: [
    { estado: 'qualificado', count: 45 },
    { estado: 'inicial', count: 30 },
    { estado: 'boas_vindas', count: 25 },
    { estado: 'atendimento_humano', count: 20 },
    { estado: 'incompativel', count: 15 },
  ],
  ...overrides,
})

// Helper to wait for async operations
export const waitForLoadingToFinish = async () => {
  // This will wait for any pending updates
  await new Promise(resolve => setTimeout(resolve, 0))
}
