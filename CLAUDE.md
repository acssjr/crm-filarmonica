# CRM Filarmonica

CRM + Omnichannel platform for Sociedade Filarmonica 25 de Marco - a 157-year-old music institution in Nazare, BA.

## Tech Stack

- **Backend**: Node.js 20 LTS, Fastify 5, TypeScript 5.7
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Queue**: Redis 7 + BullMQ for async processing
- **Frontend**: React 19, Vite, TailwindCSS (planned)
- **Infra**: Docker Compose

## Project Structure

```
packages/
  api/          # Fastify REST API
  web/          # React SPA (planned)
  shared/       # Shared types and enums
docker/         # Docker Compose files
specs/          # Feature specifications
```

## Quick Start

```bash
# Start databases
cd docker && docker compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run migrations
npm run db:migrate -w @crm-filarmonica/api

# Seed database
npm run db:seed -w @crm-filarmonica/api

# Start API in dev mode
npm run dev -w @crm-filarmonica/api
```

## Commands

```bash
# Development
npm run dev -w @crm-filarmonica/api    # Start with hot reload
npm run build -w @crm-filarmonica/api  # Build for production
npm run typecheck -w @crm-filarmonica/api  # Type check

# Database
npm run db:generate -w @crm-filarmonica/api  # Generate migrations
npm run db:migrate -w @crm-filarmonica/api   # Run migrations
npm run db:seed -w @crm-filarmonica/api      # Seed data
npm run db:studio -w @crm-filarmonica/api    # Drizzle Studio

# Testing
npm test -w @crm-filarmonica/api       # Run tests in watch mode
npm run test:run -w @crm-filarmonica/api  # Run tests once

# Docker
docker compose -f docker/docker-compose.dev.yml up -d   # Dev databases
docker compose -f docker/docker-compose.yml up -d       # Full stack
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens (min 32 chars)
- `COOKIE_SECRET` - Secret for cookies (min 32 chars)
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business phone number ID
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp API access token
- `WHATSAPP_VERIFY_TOKEN` - Webhook verification token

## API Endpoints

### Health
- `GET /health` - Health check

### Auth
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Current user info

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
