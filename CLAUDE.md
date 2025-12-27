# CRM Filarmonica

CRM + Omnichannel platform for Sociedade Filarmonica 25 de Marco - a 157-year-old music institution in Feira de Santana, BA.

## Tech Stack

- **Backend**: Node.js 20 LTS, Fastify 5, TypeScript 5.7
- **Database**: PostgreSQL 16 (Supabase) with Drizzle ORM
- **Queue**: Upstash Redis + BullMQ for async processing
- **Frontend**: React 19, Vite, TailwindCSS
- **Auth**: Clerk

## Project Structure

```
packages/
  api/          # Fastify REST API
  web/          # React SPA
  shared/       # Shared types and enums
specs/          # Feature specifications
```

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in Supabase and Upstash credentials

# Run migrations
npm run db:migrate -w @crm-filarmonica/api

# Seed database
npm run db:seed -w @crm-filarmonica/api

# Start API in dev mode
npm run dev -w @crm-filarmonica/api

# Start frontend in dev mode
npm run dev -w @crm-filarmonica/web
```

## Commands

```bash
# Development
npm run dev -w @crm-filarmonica/api    # Start API with hot reload
npm run dev -w @crm-filarmonica/web    # Start frontend with hot reload
npm run build -w @crm-filarmonica/api  # Build API for production
npm run typecheck -w @crm-filarmonica/api  # Type check

# Database
npm run db:generate -w @crm-filarmonica/api  # Generate migrations
npm run db:migrate -w @crm-filarmonica/api   # Run migrations
npm run db:seed -w @crm-filarmonica/api      # Seed data
npm run db:studio -w @crm-filarmonica/api    # Drizzle Studio

# Testing
npm test -w @crm-filarmonica/api       # Run tests in watch mode
npm run test:run -w @crm-filarmonica/api  # Run tests once
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `REDIS_URL` - Upstash Redis connection string
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business phone number ID
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp API access token
- `WHATSAPP_VERIFY_TOKEN` - Webhook verification token
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend key

## API Endpoints

### Health
- `GET /health` - Health check

### Dashboard
- `GET /api/dashboard/stats` - Overview stats
- `GET /api/dashboard/recent-contacts` - Recent contacts

### Contacts
- `GET /api/contacts` - List contacts (paginated)
- `GET /api/contacts/:id` - Get contact by ID
- `PATCH /api/contacts/:id` - Update contact

### Conversations
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get with messages

### Prospects
- `GET /api/prospects` - List prospects
- `PATCH /api/prospects/:id` - Update status

### WhatsApp Webhook
- `GET /api/webhook` - Verification endpoint
- `POST /api/webhook` - Incoming messages

## Code Style

- ESLint with TypeScript config
- Functional approach, minimal classes
- Zod for validation
- Drizzle for database queries

## Convenções de Commits e PRs

- **Idioma**: Português brasileiro (pt-BR)
- **Commits**: Seguir Conventional Commits (feat, fix, docs, chore, etc.)
- **PRs**: Título e descrição em português
- **Sem assinaturas automáticas**: Não incluir "Generated with Claude Code" ou similares

## Comandos Git Proibidos

**NUNCA usar os seguintes comandos:**
- `git reset --hard` - Destrói histórico e pode sobrescrever trabalho de outros PRs
- `git push --force` para main/master - Pode sobrescrever commits de outros desenvolvedores
- `git rebase -i` em branches já publicados - Reescreve histórico público

**Sempre preferir:**
- `git revert` para desfazer commits (preserva histórico)
- `git stash` para guardar mudanças temporariamente
- PRs com revisão para merge (nunca merge direto em main)

## Arquitetura de Testes (Pirâmide de Testes)

Seguir a pirâmide de testes moderna conforme o Guia Técnico:

| Camada | Volume | Foco | Ferramentas |
|--------|--------|------|-------------|
| **Unitários** | 60-70% | Lógica de negócio isolada | Vitest + Mocks |
| **Integração** | 20-25% | API <-> DB, contratos | PGlite, Supertest |
| **E2E** | 5-10% | Fluxos críticos de usuário | Playwright |

### Princípios:
- **Unitários**: Rápidos (ms), isolados, alto uso de mocks
- **Integração**: Validam contratos entre componentes
- **E2E**: Apenas fluxos críticos (login, checkout, cadastro)
- **Evitar flaky tests**: Isolamento, cleanup, sem dependência de ordem

### Fluxos Críticos para E2E:
1. Recebimento de mensagem WhatsApp -> Criação de contato
2. Disparo de automação por trigger
3. Fluxo de qualificação de prospecto
