---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'CRM + Plataforma Omnichannel proprietária para Sociedade Filarmônica 25 de Março'
session_goals: 'Aprofundar escopo existente, estruturar arquitetura, identificar módulos e fluxos'
selected_approach: 'ai-recommended'
techniques_used: ['Morphological Analysis', 'Role Playing', 'First Principles Thinking']
ideas_generated: [15]
context_file: ''
session_active: false
workflow_completed: true
---

# Sessão de Brainstorming - CRM Filarmônica

**Facilitador:** Antonio
**Data:** 2025-12-09

## Visão Geral da Sessão

**Tópico:** CRM + Plataforma Omnichannel proprietária para Sociedade Filarmônica 25 de Março

**Objetivos:**
- Aprofundar escopo existente
- Estruturar arquitetura do sistema
- Identificar módulos, entidades e fluxos
- Garantir projeto bem estruturado e completo

### Contexto do Projeto

| Aspecto | Detalhes |
|---------|----------|
| **Tipo** | Solução proprietária (from scratch) |
| **Canais Omnichannel** | WhatsApp Business API, Instagram Graph API, Facebook |
| **Entidades Principais** | Alunos, Inventário, Sócios, Leads/Contatos |
| **Stack Técnica** | TypeScript (Node/Bun), PostgreSQL, Docker, Redis |
| **Restrições** | Sem Low-Code, sem SaaS prontos |

### Configuração da Sessão

_Sessão iniciada para aprofundar escopo de CRM + Omnichannel para instituição musical._

## Seleção de Técnicas

**Abordagem:** Técnicas Recomendadas por IA
**Contexto de Análise:** CRM + Omnichannel com foco em estruturação de arquitetura

**Técnicas Selecionadas:**

1. **Morphological Analysis:** Mapear sistematicamente todos os parâmetros e combinações do sistema
2. **Role Playing:** Explorar necessidades sob perspectiva de cada stakeholder
3. **First Principles Thinking:** Desconstruir suposições e reconstruir arquitetura a partir de fundamentos

**Racional IA:** Sequência escolhida para projeto técnico complexo com múltiplas entidades e integrações, priorizando mapeamento completo antes de decisões arquiteturais.

---

## Técnica 1: Análise Morfológica

### Eixos Identificados

| Eixo | Opções |
|------|--------|
| **Canal de entrada** | WhatsApp, Instagram, Facebook |
| **Tipo de contato** | Responsável (pai/mãe), Interessado direto (adulto) |
| **Intenção** | Matrícula, Dúvidas, Agenda/Apresentações, Conhecer instrumentos |
| **Instrumento desejado** | Graves (prioritário), Outros, Saxofone alto (restrito), Indeciso |
| **Estado da jornada** | Curioso → Interessado → Aguardando turma → Aluno → Músico → Sócio-Músico |
| **Período** | Dentro da época de matrícula, Fora de época (lista de espera) |

### Contexto Descoberto

- **Ensino:** Maestro único ensina todos os instrumentos
- **Instrumentos:** Lista fixa; incentivo para graves; saxofone alto restrito por alta demanda
- **Público:** Principalmente crianças - contato real é com os pais (dupla persona)
- **Capacidade:** ~20 alunos por turma
- **Sazonalidade:** Objetivo futuro (semestral/anual), atualmente fluxo contínuo
- **Percepção pública:** Instituição de 157 anos que muitos não sabem que ainda funciona

### Combinações Críticas Identificadas

1. **Cenário Ideal:** Responsável + Matrícula + Graves + Dentro da época → Prioridade máxima
2. **Desafio da Espera:** Matrícula + Fora de época → Lista de espera + engajamento automatizado
3. **Curioso Institucional:** Pergunta sobre apresentações → Informar + despertar interesse na escolinha
4. **Caso Saxofone Alto:** Instrumento restrito → Explicar com cuidado + oferecer alternativas
5. **Indeciso com Potencial:** Não sabe qual instrumento → Direcionar para graves

### Estratégia Definida

| Abordagem | Foco |
|-----------|------|
| **Prevenção** | Enfatizar períodos de matrícula via comunicação programada |
| **Tratamento** | Engajamento automatizado para quem chega fora de época |

---

## Técnica 2: Role Playing

### Personas Exploradas

#### 1. Mãe/Pai Interessado
| Aspecto | Insight |
|---------|---------|
| **Primeira reação** | Surpresa - "A banda ainda funciona?" |
| **Frustração principal** | Horários incompatíveis (aulas: seg/qua/sex 15h-17h) |
| **Encantamento** | Ver a banda funcionando, imaginar o filho fazendo parte |

**Implicações:** Informar horários cedo na conversa; enviar vídeos/fotos de apresentações.

#### 2. Secretário/Atendente
| Aspecto | Insight |
|---------|---------|
| **Perguntas repetitivas** | "Onde fica?" e "Qual horário?" |
| **Problema crítico** | Demora nas respostas, "desdém não intencional" por frustração |
| **Causa raiz** | Frustração acumulada do Maestro com desistências |

**Implicações:** Respostas automáticas instantâneas; mensagens sempre acolhedoras; sistema protege o Maestro da fadiga emocional.

#### 3. Maestro
| Aspecto | Insight |
|---------|---------|
| **Precisa saber do aluno** | Expectativas, conhecimento prévio, experiência musical |
| **O que frustra** | Desinteresse, desatenção, falta de compromisso, faltas |
| **Alívio desejado** | Não atender pessoas - só receber alunos prontos |

**Implicações:** Sistema qualifica antes de matricular; gera ficha resumo do aluno para o Maestro.

#### 4. Nostálgico/Curioso da Cidade
| Aspecto | Insight |
|---------|---------|
| **Primeira pergunta** | "A banda ainda funciona?" |
| **Conexão emocional** | Músicas de época, nostalgia, memórias |
| **Potencial oculto** | Apoiadora, divulgadora, matricular neto |

**Implicações:** Segmentar contatos (lead vs apoiador); conteúdo nostálgico; convites para eventos.

### Jornadas Identificadas

**Jornada do Aluno:**
```
Curioso → Interessado → Aguardando turma → Aluno → Músico → Sócio-Músico
```

**Jornada do Apoiador:**
```
Curioso → Informado → Compareceu a evento → Engajado → Divulgador → Trouxe alguém
```

### Funcionalidades Emergentes

| Funcionalidade | Propósito |
|----------------|-----------|
| Resposta automática inicial | Boas-vindas + Local + Horários + Próximos passos |
| FAQ inteligente | Responde perguntas comuns instantaneamente |
| Tom acolhedor configurável | Mensagens sempre gentis |
| Qualificação pré-Maestro | Coleta informações, gera ficha resumo |
| Segmentação de contatos | Lead vs Apoiador vs Aluno |
| Conteúdo nostálgico | Vídeos, fotos históricas para engajamento |

---

## Técnica 3: First Principles Thinking

### Verdades Fundamentais

| Verdade | Implicação Técnica |
|---------|-------------------|
| Mensagens chegam de 3 canais diferentes | Camada de unificação (Omnichannel) |
| Mesmo contato pode vir por canais diferentes | Identificar/unificar pessoa |
| Respostas precisam ser rápidas e acolhedoras | Automação com templates humanizados |
| Maestro não deve atender diretamente | Sistema filtra e qualifica |
| Crianças são alunos, pais são contatos | Modelo de dados com relacionamento |
| Horário é fixo (seg/qua/sex 15h-17h) | Qualificação deve verificar disponibilidade cedo |

### Estrutura de Usuários

| Usuário | Papel | Acesso |
|---------|-------|--------|
| **Antonio** | Dev + Design + Marketing | Admin total |
| **Isabelle** | Marketing | Admin total |
| **Maestro** | Ensino | Admin total |

### Entidades do MVP

```
CONTATO
├── id, nome, telefone, instagram_id, facebook_id
├── tipo: "responsavel" | "interessado_direto"
├── origem: "organico" | "campanha_X" | "indicacao"
├── canal_primeiro_contato
├── estado_jornada
└── timestamps

INTERESSADO (quem vai estudar)
├── id, nome, idade
├── instrumento_desejado, experiencia_musical, expectativas
├── disponibilidade_horario (boolean)
└── contato_responsavel_id (FK)

CONVERSA
├── id, contato_id, canal, status
└── timestamps

MENSAGEM
├── id, conversa_id, direcao, conteudo, tipo
└── enviado_por, timestamps

EVENTO
├── id, titulo, data, local, descricao
└── timestamps
```

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────┐
│                    PAINEL WEB (Admin)                   │
│            Antonio | Isabelle | Maestro                 │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      API (Node/Bun)                     │
│   • Gestão de contatos    • Fluxos automatizados        │
│   • Métricas              • Templates de mensagem       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   WhatsApp    │   │   Instagram   │   │   Facebook    │
│ Business API  │   │   Graph API   │   │   Messenger   │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              CAMADA DE UNIFICAÇÃO                       │
│   Mensagem de qualquer canal → formato único interno    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │     Redis     │   │    Docker     │
│  (dados)      │   │  (filas/cache)│   │  (deploy)     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Priorização de Funcionalidades

| Fase | Funcionalidades |
|------|-----------------|
| **MVP (P0)** | WhatsApp + Resposta automática + Cadastro com origem + Painel admin |
| **V1 (P1)** | Instagram/Facebook + Qualificação + Métricas básicas |
| **V2 (P2)** | Engajamento automatizado + Relatórios para Ads + Turmas |

---

## Organização de Ideias e Priorização

### Temas Consolidados

| Tema | Foco | Ideias |
|------|------|--------|
| **Acolhimento Automatizado** | Resolver demora, garantir tom acolhedor | Resposta automática, FAQ, mensagens calorosas |
| **Qualificação Inteligente** | Filtrar e preparar antes do Maestro | Verificar horário, coletar expectativas, ficha resumo |
| **Gestão de Jornadas** | Acompanhar diferentes tipos de contato | Jornada Aluno, Jornada Apoiador, estados claros |
| **Preparação para Crescimento** | Estrutura para ads e métricas | Rastreamento origem, conversão, ROI |

### Top 3 Ideias de Alto Impacto

1. **Resposta automática com local + horários** - Resolve o problema mais frequente imediatamente
2. **Verificação de compatibilidade de horário cedo** - Evita frustração e perda de tempo
3. **Ficha resumo do aluno para o Maestro** - Libera o Maestro para focar em ensinar

### Quick Wins

| Ideia | Esforço | Impacto |
|-------|---------|---------|
| Mensagem de boas-vindas automática | Baixo | Alto |
| Template de FAQ | Baixo | Alto |
| Campo de origem no cadastro | Baixo | Médio |

### Conceitos Inovadores

- **Sistema como protetor emocional:** Protege o Maestro da fadiga de atendimento repetitivo
- **Dupla jornada:** Jornada do Aluno + Jornada do Apoiador
- **Filtro de compromisso:** Quem passa pelo processo de espera chega mais comprometido

---

## Resumo da Sessão

### Conquistas

- Mapeamento completo de 6 eixos do sistema (Análise Morfológica)
- 4 personas exploradas com necessidades claras (Role Playing)
- Arquitetura técnica fundamentada e priorizada (First Principles)
- 2 jornadas de usuário identificadas
- Modelo de dados MVP definido
- Roadmap de 3 fases estabelecido

### Próximos Passos Recomendados

1. **Imediato:** Configurar projeto base (TypeScript, PostgreSQL, Docker)
2. **Semana 1:** Implementar integração WhatsApp Business API
3. **Semana 2:** Criar fluxo de resposta automática + cadastro de contatos
4. **Semana 3:** Desenvolver painel admin básico
5. **Futuro:** Expandir para Instagram/Facebook, métricas, automações avançadas

### Insights-Chave

> "A frustração do Maestro por desistências afeta o acolhimento de novos interessados. O sistema quebra esse ciclo ao garantir respostas sempre acolhedoras e filtrar quem chega até ele."

> "Não é só CRM - é uma ferramenta que vai permitir a sazonalidade desejada ao organizar o fluxo de interessados."

> "Existem duas jornadas distintas: quem quer estudar e quem quer apoiar. Ambas têm valor para a Filarmônica."

---

**Sessão finalizada em:** 2025-12-09
**Técnicas utilizadas:** Morphological Analysis, Role Playing, First Principles Thinking
**Facilitador:** Antonio

