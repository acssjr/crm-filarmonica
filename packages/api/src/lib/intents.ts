export interface Intent {
  id: string
  keywords: string[]
  priority: number
}

// Intent definitions ordered by priority (higher = checked first)
export const INTENTS: Intent[] = [
  {
    id: 'matricula',
    keywords: ['matricula', 'matrícula', 'inscrever', 'inscrição', 'inscricao', 'quero entrar', 'como faço para entrar'],
    priority: 100,
  },
  {
    id: 'horario',
    keywords: ['horário', 'horario', 'hora', 'quando', 'aula', 'aulas', 'dia', 'dias'],
    priority: 90,
  },
  {
    id: 'localizacao',
    keywords: ['onde', 'endereço', 'endereco', 'local', 'fica', 'localização', 'localizacao', 'como chegar', 'mapa'],
    priority: 80,
  },
  {
    id: 'funcionamento',
    keywords: ['funciona', 'aberto', 'existe', 'ativo', 'ativa', 'ainda funciona', 'banda'],
    priority: 70,
  },
  {
    id: 'instrumento',
    keywords: ['instrumento', 'instrumentos', 'tocar', 'aprender', 'saxofone', 'trompete', 'clarinete', 'tuba', 'trombone'],
    priority: 60,
  },
  {
    id: 'saudacao',
    keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eae', 'eai', 'hey', 'hello', 'alo', 'alô'],
    priority: 10,
  },
]

export type IntentId = 'saudacao' | 'localizacao' | 'horario' | 'funcionamento' | 'instrumento' | 'matricula' | 'desconhecido'

export function detectIntent(text: string): IntentId {
  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents for matching

  // Sort by priority descending
  const sortedIntents = [...INTENTS].sort((a, b) => b.priority - a.priority)

  for (const intent of sortedIntents) {
    for (const keyword of intent.keywords) {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (normalizedText.includes(normalizedKeyword)) {
        return intent.id as IntentId
      }
    }
  }

  return 'desconhecido'
}
