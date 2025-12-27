import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search,
  MessageSquare,
  AlertCircle,
  MoreVertical,
  Calendar,
  Paperclip,
  Send,
  Sparkles,
  Check
} from 'lucide-react'
import { conversations, messages, type ConversaComContato, type Mensagem } from '../services/api'
import { formatPhone, formatTime, formatDateTime, cn } from '../lib/utils'

export function Conversations() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: conversationsList, isLoading: isLoadingList } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversations.list({ limit: 50 }),
  })

  const { data: selectedConversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversations.get(id!),
    enabled: !!id,
  })

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`)
  }

  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Conversas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{conversationsList?.total ?? 0}</span> conversas ativas
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              className="input pl-10 py-2 text-sm"
              placeholder="Buscar conversa..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner spinner-md text-primary-600" />
            </div>
          ) : (
            <div>
              {conversationsList?.data.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === id}
                  onClick={() => handleSelectConversation(conversation.id)}
                />
              ))}
              {conversationsList?.data.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <MessageSquare className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <p className="empty-state-description">Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {id ? (
          isLoadingConversation ? (
            <div className="flex items-center justify-center flex-1">
              <div className="spinner spinner-lg text-primary-600" />
            </div>
          ) : selectedConversation ? (
            <ConversationDetail
              conversation={selectedConversation.conversa}
              onMessageSent={() => {
                queryClient.invalidateQueries({ queryKey: ['conversation', id] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
              }}
            />
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="empty-state-title">Conversa não encontrada</h3>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-primary-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Escolha uma conversa da lista ao lado para visualizar as mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversaComContato
  isSelected: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors',
        isSelected
          ? 'bg-gray-50 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
      onClick={onClick}
    >
      <div className="user-avatar flex-shrink-0">
        {conversation.contato.nome?.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {conversation.contato.nome || 'Sem nome'}
          </p>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatTime(conversation.updatedAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {formatPhone(conversation.contato.telefone)}
        </p>
        {conversation.ultimaMensagem && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {conversation.ultimaMensagem.conteudo}
          </p>
        )}
      </div>
      {conversation.status === 'ativa' && !isSelected && (
        <div className="w-2 h-2 rounded-full bg-success-500 flex-shrink-0 mt-2" />
      )}
    </div>
  )
}

interface ConversationDetailProps {
  conversation: {
    id: string
    contato: {
      id: string
      nome: string | null
      telefone: string
    }
    mensagens: Mensagem[]
    status: string
    createdAt: string
  }
  onMessageSent: () => void
}

function ConversationDetail({ conversation, onMessageSent }: ConversationDetailProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendMutation = useMutation({
    mutationFn: (conteudo: string) =>
      messages.send(conversation.id, { conteudo }),
    onSuccess: () => {
      setMessage('')
      onMessageSent()
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.mensagens])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim())
    }
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
          {conversation.contato.nome?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {conversation.contato.nome || 'Sem nome'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {formatPhone(conversation.contato.telefone)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'badge',
            conversation.status === 'ativa' ? 'badge-success badge-dot' : 'badge-gray'
          )}>
            {conversation.status === 'ativa' ? 'Ativa' : 'Encerrada'}
          </span>
          <button className="btn btn-ghost btn-icon">
            <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-xs">
            <Calendar className="w-3 h-3" strokeWidth={1.5} />
            Conversa iniciada em {formatDateTime(conversation.createdAt)}
          </span>
        </div>

        {conversation.mensagens.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="input pr-12"
              disabled={sendMutation.isPending}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Paperclip className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            className="btn btn-primary px-6"
          >
            {sendMutation.isPending ? (
              <div className="spinner spinner-sm" />
            ) : (
              <Send className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>
        </form>
        {sendMutation.isError && (
          <div className="flex items-center gap-2 mt-2 text-error-600 dark:text-error-400 text-sm">
            <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
            Erro ao enviar mensagem. Tente novamente.
          </div>
        )}
      </div>
    </>
  )
}

interface MessageBubbleProps {
  message: Mensagem
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direcao === 'saida'

  return (
    <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div className={cn('message-bubble', isOutgoing ? 'message-outgoing' : 'message-incoming')}>
        <p className="whitespace-pre-wrap break-words">{message.conteudo}</p>
        <div className={cn('message-time flex items-center gap-2', isOutgoing ? 'justify-end' : 'justify-start')}>
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && message.tipo === 'automatica' && (
            <span className="inline-flex items-center gap-1 text-[10px] opacity-70">
              <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
              Auto
            </span>
          )}
          {isOutgoing && (
            <Check className="w-3 h-3 opacity-70" strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  )
}
