import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
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
    <div className="flex h-[calc(100vh-8rem)] -m-8">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
          <p className="text-sm text-gray-600">
            {conversationsList?.total ?? 0} conversas
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversationsList?.data.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === id}
                  onClick={() => handleSelectConversation(conversation.id)}
                />
              ))}
              {conversationsList?.data.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhuma conversa encontrada
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {id ? (
          isLoadingConversation ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
              <p className="text-gray-500">Conversa não encontrada</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <ChatIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Selecione uma conversa</p>
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
        'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
        isSelected && 'bg-blue-50 hover:bg-blue-50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium flex-shrink-0">
          {conversation.contato.nome?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 truncate">
              {conversation.contato.nome || 'Sem nome'}
            </p>
            <span className="text-xs text-gray-500">
              {formatTime(conversation.updatedAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {formatPhone(conversation.contato.telefone)}
          </p>
          {conversation.ultimaMensagem && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {conversation.ultimaMensagem.conteudo}
            </p>
          )}
        </div>
      </div>
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
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
          {conversation.contato.nome?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {conversation.contato.nome || 'Sem nome'}
          </p>
          <p className="text-sm text-gray-600">
            {formatPhone(conversation.contato.telefone)}
          </p>
        </div>
        <div className="ml-auto">
          <span className={cn(
            'badge',
            conversation.status === 'ativa' ? 'badge-green' : 'badge-gray'
          )}>
            {conversation.status === 'ativa' ? 'Ativa' : 'Encerrada'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="text-center">
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
            Conversa iniciada em {formatDateTime(conversation.createdAt)}
          </span>
        </div>

        {conversation.mensagens.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="input flex-1"
            disabled={sendMutation.isPending}
          />
          <button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            className="btn btn-primary"
          >
            {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
        {sendMutation.isError && (
          <p className="text-red-600 text-sm mt-2">
            Erro ao enviar mensagem. Tente novamente.
          </p>
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
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isOutgoing
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.conteudo}</p>
        <div
          className={cn(
            'flex items-center gap-2 mt-1 text-xs',
            isOutgoing ? 'text-blue-200' : 'text-gray-500'
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && message.tipo === 'automatica' && (
            <span className="bg-blue-500 px-1.5 py-0.5 rounded text-[10px]">
              Auto
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
