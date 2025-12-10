import type { IntentId } from './intents.js'

// Filarmonica info
const ENDERECO = 'Praca da Bandeira, 25 - Centro, Nazare - BA'
const GOOGLE_MAPS = 'https://maps.google.com/?q=Praca+da+Bandeira+25+Nazare+BA'
const HORARIOS = 'Segunda, Quarta e Sexta, das 15h as 17h'
const HISTORIA = '157 anos de tradicao musical'

export const TEMPLATES: Record<IntentId, string> = {
  saudacao: `Ola! Bem-vindo(a) a Sociedade Filarmonica 25 de Marco! 🎵

Somos uma escola de musica com ${HISTORIA}, formando musicos em Nazare, Bahia.

📍 *Endereco*: ${ENDERECO}
🕐 *Aulas*: ${HORARIOS}

Como posso ajudar voce hoje? Quer saber mais sobre matriculas, instrumentos ou visitar a sede?`,

  localizacao: `📍 *Nossa localizacao*:

${ENDERECO}

📎 Google Maps: ${GOOGLE_MAPS}

Venha nos visitar! Estamos abertos para aulas ${HORARIOS}.`,

  horario: `🕐 *Horarios das aulas*:

${HORARIOS}

As aulas sao gratuitas e abertas para todas as idades. Quer saber como se matricular?`,

  funcionamento: `Sim, a Sociedade Filarmonica 25 de Marco esta ativa e funcionando! 🎺

Somos uma das bandas mais antigas do Brasil, com ${HISTORIA} de tradicao musical em Nazare, Bahia.

📍 ${ENDERECO}
🕐 ${HORARIOS}

Venha nos conhecer! Estamos sempre recebendo novos alunos.`,

  instrumento: `🎵 *Instrumentos que ensinamos*:

Temos aulas para diversos instrumentos de sopro e percussao:
- Metais: Trompete, Trombone, Tuba, Bombardino
- Madeiras: Clarinete, Saxofone (Tenor, Baritono)
- Percussao: Caixa, Bumbo, Pratos

⚠️ *Importante*: Estamos priorizando alunos para instrumentos de registro grave (Tuba, Bombardino, Trombone, Sax Baritono).

Qual instrumento te interessa?`,

  matricula: `📝 *Como se matricular*:

1. Venha nos visitar em ${ENDERECO}
2. Traga documento com foto
3. Converse com o Maestro sobre seus interesses

🕐 Atendemos ${HORARIOS}

As aulas sao *gratuitas*! Voce tem disponibilidade nesses horarios?`,

  desconhecido: `Obrigado pela mensagem! 🎵

Sou o assistente da Sociedade Filarmonica 25 de Marco. Posso ajudar com:
- 📍 Localizacao e como chegar
- 🕐 Horarios das aulas
- 🎺 Instrumentos disponiveis
- 📝 Como se matricular

O que gostaria de saber?`,
}

export function getTemplateResponse(intentId: IntentId): string {
  return TEMPLATES[intentId] || TEMPLATES.desconhecido
}

// Template for non-text messages
export const NON_TEXT_MESSAGE_RESPONSE = `Desculpe, por enquanto so consigo processar mensagens de texto. 📝

Por favor, envie sua pergunta por escrito e terei prazer em ajudar!`

// Template for spam protection (after 3 contextless messages)
export const SPAM_PROTECTION_RESPONSE = `Parece que voce esta tendo dificuldades. 🤔

Se precisar de ajuda, por favor entre em contato diretamente conosco:
📍 ${ENDERECO}
🕐 ${HORARIOS}

Ou envie uma pergunta especifica sobre a Filarmonica.`
