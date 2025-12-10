<!--
Sync Impact Report
===================
Version change: 0.0.0 → 1.0.0
Added principles:
  - I. Acolhimento em Primeiro Lugar
  - II. Proprietário e Modular
  - III. Omnichannel Unificado
  - IV. Proteção do Maestro
  - V. Preparado para Crescimento
Added sections:
  - Stack Técnica Obrigatória
  - Fluxo de Desenvolvimento
Templates requiring updates:
  - ✅ Constitution created
  - ⚠ spec-template.md (pending - first run)
  - ⚠ plan-template.md (pending - first run)
  - ⚠ tasks-template.md (pending - first run)
Follow-up TODOs: None
-->

# CRM Filarmônica Constitution

## Core Principles

### I. Acolhimento em Primeiro Lugar

Toda interação com interessados DEVE ser acolhedora, rápida e humanizada.

- Respostas automáticas DEVEM ser instantâneas (< 5 segundos)
- Tom de comunicação DEVE ser sempre gentil e convidativo
- Mensagens NUNCA podem parecer robóticas ou frias
- Sistema DEVE proteger a experiência do usuário mesmo quando operadores estão ausentes

**Rationale**: A frustração acumulada por desistências afeta o acolhimento. O sistema quebra esse ciclo garantindo respostas sempre positivas.

### II. Proprietário e Modular

O sistema DEVE ser construído 100% proprietário, sem dependência de SaaS ou Low-Code.

- PROIBIDO uso de Chatwoot, Botpress, ou similares
- Stack obrigatória: TypeScript (Node/Bun), PostgreSQL, Docker, Redis
- Cada módulo DEVE ser independente e testável isoladamente
- APIs DEVEM seguir padrões RESTful ou GraphQL consistentes

**Rationale**: Controle total sobre o código permite customização para necessidades específicas da Filarmônica e evita vendor lock-in.

### III. Omnichannel Unificado

Mensagens de qualquer canal DEVEM ser tratadas de forma unificada internamente.

- WhatsApp, Instagram e Facebook DEVEM convergir para formato único
- Mesmo contato em canais diferentes DEVE ser identificado e unificado
- Histórico de conversas DEVE ser consolidado independente do canal
- Resposta PODE ser enviada por qualquer canal configurado

**Rationale**: O interessado não deve perceber diferença na experiência entre canais.

### IV. Proteção do Maestro

O Maestro NÃO DEVE ser sobrecarregado com atendimento inicial.

- Sistema DEVE qualificar interessados antes de envolver o Maestro
- Ficha resumo do aluno DEVE ser gerada automaticamente
- Perguntas frequentes (local, horário) DEVEM ser respondidas sem intervenção humana
- Maestro DEVE receber apenas contatos qualificados e prontos

**Rationale**: O Maestro deve focar em ensinar, não em responder perguntas repetitivas.

### V. Preparado para Crescimento

O sistema DEVE estar estruturado para suportar campanhas de marketing e métricas desde o MVP.

- Toda entrada DEVE registrar origem (orgânico, campanha, indicação)
- Conversões DEVEM ser rastreáveis (lead → interessado → aluno)
- Estrutura DEVE permitir exportação de audiências para Meta Ads
- Métricas básicas DEVEM estar disponíveis no painel admin

**Rationale**: Investimento futuro em ads requer dados históricos para calcular ROI.

## Stack Técnica Obrigatória

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Runtime** | Node.js ou Bun | Performance, ecossistema TypeScript |
| **Linguagem** | TypeScript | Type safety, manutenibilidade |
| **Banco de Dados** | PostgreSQL | Relacional, robusto, gratuito |
| **Cache/Filas** | Redis | Performance, pub/sub para mensagens |
| **Containers** | Docker | Deploy consistente, isolamento |
| **Integrações** | WhatsApp Business API, Instagram Graph API, Facebook Messenger | Canais prioritários |

### Restrições Tecnológicas

- PROIBIDO: Low-Code, No-Code, SaaS de atendimento
- PROIBIDO: Banco NoSQL como principal (pode ser complementar)
- PROIBIDO: Frameworks proprietários que criem lock-in

## Fluxo de Desenvolvimento

### Priorização por Fases

| Fase | Escopo | Critério de Conclusão |
|------|--------|----------------------|
| **MVP (P0)** | WhatsApp + Resposta automática + Cadastro + Painel admin | Sistema responde mensagens e registra contatos |
| **V1 (P1)** | Instagram/Facebook + Qualificação + Métricas | Todos os canais unificados, dashboard funcional |
| **V2 (P2)** | Engajamento automatizado + Ads + Turmas | Campanhas programadas, gestão de turmas |

### Padrões de Código

- Testes DEVEM existir para toda lógica de negócio crítica
- Commits DEVEM seguir Conventional Commits
- PRs DEVEM ter descrição clara do que muda e por quê
- Documentação inline DEVE existir para funções públicas

## Governance

Esta constituição estabelece os princípios inegociáveis do projeto CRM Filarmônica.

- Toda decisão técnica DEVE ser validada contra estes princípios
- Alterações nos princípios REQUEREM documentação, justificativa e aprovação
- Em caso de conflito, princípios têm precedência sobre conveniência
- Revisão da constituição: a cada major release ou mudança significativa de escopo

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
