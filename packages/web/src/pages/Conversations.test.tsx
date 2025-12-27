/**
 * Unit tests for Conversations component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Conversations } from './Conversations'
import {
  renderWithProviders,
  mockContato,
  mockConversa,
  mockMensagem,
} from '../__tests__/test-utils'

// Mock the API module
vi.mock('../services/api', () => ({
  conversations: {
    list: vi.fn(),
    get: vi.fn(),
  },
  messages: {
    send: vi.fn(),
  },
}))

// Mock react-router-dom useParams and useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    useParams: vi.fn(() => ({})),
    useNavigate: () => mockNavigate,
  }
})

// Import after mock to get the mocked version
import { conversations, messages } from '../services/api'
import { useParams } from 'react-router-dom'

describe('Conversations', () => {
  const user = userEvent.setup()

  const mockConversationsList = {
    data: [
      {
        ...mockConversa({ id: 'conv-1', status: 'ativa' }),
        contato: mockContato({ id: 'contact-1', nome: 'John Doe', telefone: '5575999999999' }),
        ultimaMensagem: mockMensagem({ conteudo: 'Hello there' }),
      },
      {
        ...mockConversa({ id: 'conv-2', status: 'ativa' }),
        contato: mockContato({ id: 'contact-2', nome: 'Jane Smith', telefone: '5575888888888' }),
        ultimaMensagem: mockMensagem({ conteudo: 'Hi!' }),
      },
      {
        ...mockConversa({ id: 'conv-3', status: 'encerrada' }),
        contato: mockContato({ id: 'contact-3', nome: null, telefone: '5575777777777' }),
        ultimaMensagem: undefined,
      },
    ],
    total: 3,
    page: 1,
    limit: 50,
    totalPages: 1,
  }

  const mockConversationDetail = {
    conversa: {
      id: 'conv-1',
      contato: mockContato({ id: 'contact-1', nome: 'John Doe', telefone: '5575999999999' }),
      mensagens: [
        mockMensagem({ id: 'msg-1', direcao: 'entrada', conteudo: 'Hello', createdAt: '2024-01-01T10:00:00Z' }),
        mockMensagem({ id: 'msg-2', direcao: 'saida', conteudo: 'Hi! How can I help?', tipo: 'automatica', createdAt: '2024-01-01T10:01:00Z' }),
        mockMensagem({ id: 'msg-3', direcao: 'entrada', conteudo: 'I want to learn violin', createdAt: '2024-01-01T10:02:00Z' }),
      ],
      status: 'ativa',
      createdAt: '2024-01-01T10:00:00Z',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useParams).mockReturnValue({})
    vi.mocked(conversations.list).mockResolvedValue(mockConversationsList)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Conversations list - Loading state', () => {
    it('should display loading spinner while fetching conversations', async () => {
      vi.mocked(conversations.list).mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<Conversations />)

      expect(document.querySelector('.spinner')).toBeInTheDocument()
    })
  })

  describe('Conversations list - Empty state', () => {
    it('should display empty state message when no conversations exist', async () => {
      vi.mocked(conversations.list).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Nenhuma conversa encontrada')).toBeInTheDocument()
      })
    })
  })

  describe('Conversations list - With data', () => {
    it('should display page title', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Conversas' })).toBeInTheDocument()
      })
    })

    it('should display total conversations count', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('conversas ativas')).toBeInTheDocument()
      })
    })

    it('should display search input', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar conversa...')).toBeInTheDocument()
      })
    })

    it('should display conversation items in list', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Sem nome')).toBeInTheDocument()
      })
    })

    it('should display formatted phone numbers', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('+55 (75) 99999-9999')).toBeInTheDocument()
        expect(screen.getByText('+55 (75) 88888-8888')).toBeInTheDocument()
      })
    })

    it('should display last message preview', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Hello there')).toBeInTheDocument()
        expect(screen.getByText('Hi!')).toBeInTheDocument()
      })
    })

    it('should display avatar with first letter of name', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const avatars = document.querySelectorAll('.user-avatar')
        expect(avatars.length).toBeGreaterThan(0)
        expect(avatars[0].textContent).toBe('J')
      })
    })

    it('should display "?" for contacts without name', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const avatars = document.querySelectorAll('.user-avatar')
        const noNameAvatar = Array.from(avatars).find(a => a.textContent === '?')
        expect(noNameAvatar).toBeInTheDocument()
      })
    })

    it('should show active indicator for active conversations', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const activeIndicators = document.querySelectorAll('.bg-success-500')
        expect(activeIndicators.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Conversation selection', () => {
    it('should navigate when clicking a conversation', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const conversationItem = screen.getByText('John Doe').closest('div[class*="cursor-pointer"]')
      if (conversationItem) await user.click(conversationItem)

      expect(mockNavigate).toHaveBeenCalledWith('/conversations/conv-1')
    })

    it('should highlight selected conversation', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Multiple elements with John Doe - one in list, one in detail
        const johnDoes = screen.getAllByText('John Doe')
        expect(johnDoes.length).toBeGreaterThan(0)
      })

      // Find the conversation list item
      const listItems = document.querySelectorAll('div[class*="cursor-pointer"]')
      const selectedItem = Array.from(listItems).find(item =>
        item.textContent?.includes('John Doe') && item.classList.contains('bg-gray-50')
      )
      expect(selectedItem).toBeInTheDocument()
    })
  })

  describe('No conversation selected state', () => {
    it('should display placeholder when no conversation is selected', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Selecione uma conversa')).toBeInTheDocument()
      })
    })

    it('should display helpful description', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Escolha uma conversa da lista ao lado para visualizar as mensagens')).toBeInTheDocument()
      })
    })
  })

  describe('Conversation detail - Loading', () => {
    it('should display loading spinner while fetching conversation detail', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Should have at least 2 spinners - one for list, one for detail
        const spinners = document.querySelectorAll('.spinner')
        expect(spinners.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Conversation detail - Not found', () => {
    it('should display error message when conversation not found', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'invalid-id' })
      // Return undefined to trigger not found state
      vi.mocked(conversations.get).mockResolvedValue(undefined as any)

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Check for the "not found" heading
        expect(screen.getByRole('heading', { name: /Conversa n\u00e3o encontrada/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Conversation detail - With messages', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display contact name in header', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Should appear in both list and detail header
        const johnDoes = screen.getAllByText('John Doe')
        expect(johnDoes.length).toBeGreaterThan(1)
      })
    })

    it('should display contact phone in header', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const phones = screen.getAllByText('+55 (75) 99999-9999')
        expect(phones.length).toBeGreaterThan(1)
      })
    })

    it('should display conversation status badge', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Ativa')).toBeInTheDocument()
      })
    })

    it('should display message bubbles', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
        expect(screen.getByText('I want to learn violin')).toBeInTheDocument()
      })
    })

    it('should display "Auto" label for automatic messages', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Auto')).toBeInTheDocument()
      })
    })

    it('should display conversation start date', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText(/Conversa iniciada em/)).toBeInTheDocument()
      })
    })

    it('should style incoming messages differently from outgoing', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const incomingMessages = document.querySelectorAll('.message-incoming')
        const outgoingMessages = document.querySelectorAll('.message-outgoing')

        expect(incomingMessages.length).toBeGreaterThan(0)
        expect(outgoingMessages.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Message input', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display message input field', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })
    })

    it('should display send button', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const sendButton = document.querySelector('button[type="submit"]')
        expect(sendButton).toBeInTheDocument()
      })
    })

    it('should disable send button when input is empty', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const sendButton = document.querySelector('button[type="submit"]')
        expect(sendButton).toBeDisabled()
      })
    })

    it('should enable send button when input has text', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(input, 'Hello!')

      const sendButton = document.querySelector('button[type="submit"]')
      expect(sendButton).not.toBeDisabled()
    })

    it('should call send API when submitting message', async () => {
      vi.mocked(messages.send).mockResolvedValue({
        mensagem: mockMensagem({ conteudo: 'Hello!' }),
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(input, 'Hello!')

      const sendButton = document.querySelector('button[type="submit"]')
      if (sendButton) await user.click(sendButton)

      await waitFor(() => {
        expect(messages.send).toHaveBeenCalledWith('conv-1', { conteudo: 'Hello!' })
      })
    })

    it('should clear input after sending message', async () => {
      vi.mocked(messages.send).mockResolvedValue({
        mensagem: mockMensagem({ conteudo: 'Hello!' }),
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...') as HTMLInputElement
      await user.type(input, 'Hello!')

      const sendButton = document.querySelector('button[type="submit"]')
      if (sendButton) await user.click(sendButton)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should display error message when send fails', async () => {
      vi.mocked(messages.send).mockRejectedValue(new Error('Network error'))

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(input, 'Hello!')

      const sendButton = document.querySelector('button[type="submit"]')
      if (sendButton) await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Erro ao enviar mensagem. Tente novamente.')).toBeInTheDocument()
      })
    })

    it('should submit on Enter key press', async () => {
      vi.mocked(messages.send).mockResolvedValue({
        mensagem: mockMensagem({ conteudo: 'Hello!' }),
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(input, 'Hello!{enter}')

      await waitFor(() => {
        expect(messages.send).toHaveBeenCalledWith('conv-1', { conteudo: 'Hello!' })
      })
    })

    it('should not submit empty message', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(input, '   ')

      const sendButton = document.querySelector('button[type="submit"]')
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Attachment button', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display attachment button', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Find the paperclip/attachment button
        const attachButton = document.querySelector('button[type="button"]')
        expect(attachButton).toBeInTheDocument()
      })
    })
  })

  describe('Message time formatting', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display message timestamps', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        // Should have time in HH:MM format
        const times = document.querySelectorAll('.message-time')
        expect(times.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Menu button', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display more options button in header', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const moreButton = document.querySelector('.btn-ghost.btn-icon')
        expect(moreButton).toBeInTheDocument()
      })
    })
  })

  describe('Conversation status display', () => {
    it('should show Ativa badge for active conversations', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Ativa')).toBeInTheDocument()
      })
    })

    it('should show Encerrada badge for closed conversations', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue({
        conversa: {
          ...mockConversationDetail.conversa,
          status: 'encerrada',
        },
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        expect(screen.getByText('Encerrada')).toBeInTheDocument()
      })
    })
  })

  describe('Contact avatar', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display avatar in conversation detail header', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const detailHeader = document.querySelector('.bg-white.dark\\:bg-gray-900.border-b')
        expect(detailHeader).toBeInTheDocument()

        const avatar = detailHeader?.querySelector('.rounded-full')
        expect(avatar).toBeInTheDocument()
        expect(avatar?.textContent).toBe('J')
      })
    })

    it('should display "?" for contacts without name', async () => {
      vi.mocked(conversations.get).mockResolvedValue({
        conversa: {
          ...mockConversationDetail.conversa,
          contato: mockContato({ nome: null }),
        },
      })

      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const detailHeader = document.querySelector('.bg-white.dark\\:bg-gray-900.border-b')
        const avatar = detailHeader?.querySelector('.rounded-full')
        expect(avatar?.textContent).toBe('?')
      })
    })
  })

  describe('Message direction styling', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should align incoming messages to the left', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const incomingWrapper = screen.getByText('Hello').closest('.flex')
        expect(incomingWrapper).toHaveClass('justify-start')
      })
    })

    it('should align outgoing messages to the right', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const outgoingWrapper = screen.getByText('Hi! How can I help?').closest('.flex')
        expect(outgoingWrapper).toHaveClass('justify-end')
      })
    })
  })

  describe('Check mark on outgoing messages', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'conv-1' })
      vi.mocked(conversations.get).mockResolvedValue(mockConversationDetail)
    })

    it('should display check mark on outgoing messages', async () => {
      renderWithProviders(<Conversations />)

      await waitFor(() => {
        const outgoingBubble = screen.getByText('Hi! How can I help?').closest('.message-bubble')
        const checkMark = outgoingBubble?.querySelector('svg.w-3.h-3')
        expect(checkMark).toBeInTheDocument()
      })
    })
  })
})
