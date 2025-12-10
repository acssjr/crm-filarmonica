import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const first = cleaned.slice(4, 9)
    const second = cleaned.slice(9)
    return `+55 (${ddd}) ${first}-${second}`
  }
  return phone
}

export function getOrigemLabel(origem: string): string {
  const labels: Record<string, string> = {
    organico: 'Orgânico',
    campanha: 'Campanha',
    indicacao: 'Indicação',
  }
  return labels[origem] || origem
}

export function getEstadoJornadaLabel(estado: string): string {
  const labels: Record<string, string> = {
    inicial: 'Inicial',
    boas_vindas: 'Boas-vindas',
    coletando_nome: 'Coletando nome',
    coletando_idade: 'Coletando idade',
    coletando_instrumento: 'Coletando instrumento',
    verificando_saxofone: 'Verificando saxofone',
    coletando_experiencia: 'Coletando experiência',
    coletando_disponibilidade: 'Coletando disponibilidade',
    incompativel: 'Incompatível',
    qualificado: 'Qualificado',
    atendimento_humano: 'Atendimento humano',
  }
  return labels[estado] || estado
}

export function getEstadoJornadaColor(estado: string): string {
  const colors: Record<string, string> = {
    inicial: 'badge-gray',
    boas_vindas: 'badge-blue',
    coletando_nome: 'badge-blue',
    coletando_idade: 'badge-blue',
    coletando_instrumento: 'badge-blue',
    verificando_saxofone: 'badge-yellow',
    coletando_experiencia: 'badge-blue',
    coletando_disponibilidade: 'badge-blue',
    incompativel: 'badge-red',
    qualificado: 'badge-green',
    atendimento_humano: 'badge-yellow',
  }
  return colors[estado] || 'badge-gray'
}
