# Implementation Plan: CRM Omnichannel MVP

**Branch**: `1-crm-omnichannel-mvp` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1-crm-omnichannel-mvp/spec.md`

## Summary

Sistema CRM + Plataforma Omnichannel proprietária para Sociedade Filarmônica 25 de Março. MVP focado em WhatsApp Business API com resposta automática instantânea (< 5 segundos), cadastro automático de contatos com rastreamento de origem, coleta conversacional de informações do interessado, e painel administrativo web para gestão centralizada.

**Abordagem técnica**: Monorepo com backend Node.js/TypeScript servindo API REST + webhook WhatsApp, frontend React para painel admin, PostgreSQL para persistência, Redis para cache e filas de mensagens.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)
**Primary Dependencies**:
- Backend: Fastify, Drizzle ORM, @hono/zod-openapi
- Frontend: React 18, TanStack Query, TailwindCSS
- Infra: Docker, Redis, PostgreSQL 16
**Storage**: PostgreSQL 16 (relacional, principal)
**Testing**: Vitest (unit + integration), Playwright (e2e)
**Target Platform**: Linux server (Docker containers), Web browser (admin panel)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Resposta WhatsApp < 5 segundos, 100 mensagens/minuto processadas
**Constraints**: < 500ms p95 API response, < 512MB memory per container
**Scale/Scope**: ~100 contatos/mês, 3 administradores, 1 canal (WhatsApp MVP)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I. Acolhimento em Primeiro Lugar** | ✅ PASS | FR-004 resposta < 5s, FR-006/FR-007 templates humanizados |
| **II. Proprietário e Modular** | ✅ PASS | Stack 100% TypeScript/PostgreSQL/Docker/Redis, zero SaaS |
| **III. Omnichannel Unificado** | ✅ PASS | Arquitetura preparada para múltiplos canais, MVP foca WhatsApp |
| **IV. Proteção do Maestro** | ✅ PASS | FR-012 a FR-016 coleta automática, FR-022 ficha resumo |
| **V. Preparado para Crescimento** | ✅ PASS | FR-010 rastreamento origem, métricas no dashboard |

**Gate Status**: ✅ ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/1-crm-omnichannel-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml     # API specification
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── api/                          # Backend API (Fastify + TypeScript)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── whatsapp/         # Webhook + envio de mensagens
│   │   │   ├── contacts/         # CRUD contatos
│   │   │   ├── conversations/    # Gestão de conversas
│   │   │   ├── messages/         # Histórico de mensagens
│   │   │   ├── prospects/        # Interessados (fichas)
│   │   │   ├── intents/          # Identificação de intenções
│   │   │   └── auth/             # Autenticação admin
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   └── migrations/       # SQL migrations
│   │   ├── lib/
│   │   │   ├── whatsapp-client.ts
│   │   │   └── intent-matcher.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   └── tsconfig.json
│
├── web/                          # Frontend Admin Panel (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   │   ├── dashboard/        # Widgets do dashboard
│   │   │   ├── contacts/         # Lista e detalhes de contatos
│   │   │   ├── conversations/    # Chat view
│   │   │   └── prospects/        # Fichas de interessados
│   │   ├── pages/
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── contacts.tsx
│   │   │   └── conversation.tsx
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   └── main.tsx
│   ├── tests/
│   │   └── e2e/
│   ├── package.json
│   └── vite.config.ts
│
└── shared/                       # Tipos e utilitários compartilhados
    ├── src/
    │   ├── types/
    │   └── constants/
    └── package.json

docker/
├── docker-compose.yml            # Dev environment
├── docker-compose.prod.yml       # Production
├── api.Dockerfile
└── web.Dockerfile

.env.example                      # Template de variáveis de ambiente
```

**Structure Decision**: Web application (Option 2) com monorepo usando workspaces. Backend em `packages/api`, frontend em `packages/web`, tipos compartilhados em `packages/shared`. Docker Compose para orquestração local e produção.

## Complexity Tracking

> Sem violações de complexidade. Arquitetura segue princípios KISS e YAGNI.

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| Monorepo vs Multi-repo | Monorepo | Projeto pequeno, 1 equipe, tipos compartilhados |
| ORM | Drizzle | Type-safe, migrations simples, sem overhead |
| Framework API | Fastify | Performance, TypeScript nativo, plugins WhatsApp |
| Estado Frontend | TanStack Query | Cache automático, sem boilerplate Redux |
