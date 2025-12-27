/**
 * Unit tests for Dashboard component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import {
  renderWithProviders,
  mockDashboardStats,
} from '../__tests__/test-utils'

// Mock the API module
vi.mock('../services/api', () => ({
  dashboard: {
    stats: vi.fn(),
  },
}))

// Import after mock to get the mocked version
import { dashboard } from '../services/api'

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Loading state', () => {
    it('should display loading spinner while fetching data', async () => {
      // Create a promise that never resolves to keep loading state
      vi.mocked(dashboard.stats).mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<Dashboard />)

      // Check for loading spinner
      expect(document.querySelector('.spinner')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('should display error message when API call fails', async () => {
      vi.mocked(dashboard.stats).mockRejectedValue(new Error('Network error'))

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados do dashboard.')).toBeInTheDocument()
      })
    })

    it('should show error icon when error occurs', async () => {
      vi.mocked(dashboard.stats).mockRejectedValue(new Error('Server error'))

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        const errorCard = document.querySelector('.border-l-error-500')
        expect(errorCard).toBeInTheDocument()
      })
    })
  })

  describe('Success state with data', () => {
    beforeEach(() => {
      vi.mocked(dashboard.stats).mockResolvedValue(mockDashboardStats())
    })

    it('should display dashboard title', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
      })
    })

    it('should display dashboard subtitle', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Vis\u00e3o geral do CRM/i)).toBeInTheDocument()
      })
    })

    it('should display total contacts stat card', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Total de Contatos')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should display active conversations stat card', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Conversas Ativas')).toBeInTheDocument()
        // Multiple 25s may exist - just verify the stat card exists
        expect(screen.getAllByText('25').length).toBeGreaterThan(0)
      })
    })

    it('should display new contacts today stat card', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Novos Hoje')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should display qualified prospects stat card', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Interessados Qualificados')).toBeInTheDocument()
        // Multiple 45s may exist - just verify the stat card exists
        expect(screen.getAllByText('45').length).toBeGreaterThan(0)
      })
    })

    it('should display origin distribution chart', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Contatos por Origem')).toBeInTheDocument()
        expect(screen.getByText(/Distribui\u00e7\u00e3o dos canais de capta\u00e7\u00e3o/i)).toBeInTheDocument()
      })
    })

    it('should display origin labels correctly', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Org\u00e2nico/i)).toBeInTheDocument()
        expect(screen.getByText('Campanha')).toBeInTheDocument()
        expect(screen.getByText(/Indica\u00e7\u00e3o/i)).toBeInTheDocument()
      })
    })

    it('should display journey state distribution chart', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Estado da Jornada')).toBeInTheDocument()
        expect(screen.getByText('Progresso dos contatos no funil')).toBeInTheDocument()
      })
    })

    it('should display journey state labels correctly', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Qualificado')).toBeInTheDocument()
        expect(screen.getByText('Inicial')).toBeInTheDocument()
        expect(screen.getByText('Boas-vindas')).toBeInTheDocument()
      })
    })

    it('should display quick actions section', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/A\u00e7\u00f5es R\u00e1pidas/i)).toBeInTheDocument()
        expect(screen.getByText('Gerencie seus contatos e conversas')).toBeInTheDocument()
      })
    })

    it('should display navigation links in quick actions', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Ver Contatos/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Conversas/i })).toBeInTheDocument()
      })
    })

    it('should have correct href for contacts link', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Ver Contatos/i })
        expect(link).toHaveAttribute('href', '/contacts')
      })
    })

    it('should have correct href for conversations link', async () => {
      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Conversas/i })
        expect(link).toHaveAttribute('href', '/conversations')
      })
    })
  })

  describe('Success state with empty data', () => {
    it('should display empty state message for origin chart when no data', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(
        mockDashboardStats({
          porOrigem: [],
          totalContatos: 0,
        })
      )

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Nenhum dado de origem dispon\u00edvel/i)).toBeInTheDocument()
      })
    })

    it('should display empty state message for journey chart when no data', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(
        mockDashboardStats({
          porEstadoJornada: [],
          totalContatos: 0,
        })
      )

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Nenhum dado de jornada dispon\u00edvel/i)).toBeInTheDocument()
      })
    })

    it('should display zero for all stats when no data', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(
        mockDashboardStats({
          totalContatos: 0,
          conversasAtivas: 0,
          novosHoje: 0,
          interessadosQualificados: 0,
        })
      )

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        const zeros = screen.getAllByText('0')
        expect(zeros.length).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('Stat cards with trends', () => {
    it('should display positive trends with up arrow', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(mockDashboardStats())

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        // Check for positive trend indicators
        const trendUps = document.querySelectorAll('.stat-trend-up')
        expect(trendUps.length).toBeGreaterThan(0)
      })
    })

    it('should display negative trends with down arrow', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(mockDashboardStats())

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        // Check for negative trend indicators
        const trendDowns = document.querySelectorAll('.stat-trend-down')
        expect(trendDowns.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Date display', () => {
    it('should display current date information', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(mockDashboardStats())

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Atualizado agora')).toBeInTheDocument()
      })
    })
  })

  describe('Number formatting', () => {
    it('should format large numbers correctly', async () => {
      vi.mocked(dashboard.stats).mockResolvedValue(
        mockDashboardStats({
          totalContatos: 1500,
        })
      )

      renderWithProviders(<Dashboard />)

      await waitFor(() => {
        // Check for Brazilian number formatting (1.500)
        expect(screen.getByText('1.500')).toBeInTheDocument()
      })
    })
  })
})
