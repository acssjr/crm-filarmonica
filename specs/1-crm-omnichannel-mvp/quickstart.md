# Quickstart: CRM Omnichannel MVP

**Branch**: `1-crm-omnichannel-mvp` | **Date**: 2025-12-09

Guia rapido para rodar o projeto localmente e entender a arquitetura.

## Pre-requisitos

- Node.js 20 LTS
- Conta Supabase (PostgreSQL)
- Conta Upstash (Redis)
- Conta Clerk (autenticacao)
- Conta Meta Business (para WhatsApp Business API)

## Setup Local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/acssjr/crm-filarmonica.git
cd crm-filarmonica
git checkout 1-crm-omnichannel-mvp

# Instalar dependencias (usando npm workspaces)
npm install
```

### 2. Configurar variaveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=rediss://default:[password]@[region].upstash.io:6379

# WhatsApp Business API
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Frontend (packages/web/.env)
VITE_API_URL=http://localhost:3000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Rodar migrations

```bash
npm run db:migrate -w packages/api
```

### 4. Seed dos administradores

```bash
npm run db:seed -w packages/api
```

Isso cria os 3 administradores:
- `antonio@filarmonica25.org.br` / `admin123`
- `isabelle@filarmonica25.org.br` / `admin123`
- `maestro@filarmonica25.org.br` / `admin123`

### 5. Rodar em desenvolvimento

```bash
# Terminal 1: API
npm run dev -w packages/api

# Terminal 2: Frontend
npm run dev -w packages/web
```

- API: http://localhost:3000
- Frontend: http://localhost:5173

## Testando o Webhook (ngrok)

Para testar o webhook do WhatsApp localmente:

```bash
# Instalar ngrok se nao tiver
# https://ngrok.com/download

ngrok http 3000
```

Copie a URL `https://xxxx.ngrok.io` e configure no Meta Business:
- Webhook URL: `https://xxxx.ngrok.io/api/webhooks/whatsapp`
- Verify Token: valor do `WHATSAPP_VERIFY_TOKEN`

## Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│   Webhook   │────▶│   Upstash   │
│  Cloud API  │     │  (Fastify)  │     │   Redis     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │◀────│   Worker    │◀────│ Intent      │
│  Cloud API  │     │  (Process)  │     │ Matcher     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │ PostgreSQL  │
                    └─────────────┘
                           ▲
                           │
┌─────────────┐     ┌─────────────┐
│   React     │────▶│  REST API   │
│ + Clerk     │     │  (Fastify)  │
└─────────────┘     └─────────────┘
```

## Fluxo de Mensagem

1. **Mensagem chega** no webhook `/api/webhooks/whatsapp`
2. **Webhook responde 200** imediatamente e enfileira no Redis
3. **Worker processa**:
   - Busca/cria contato pelo telefone
   - Identifica intencao (keywords)
   - Atualiza estado da jornada
   - Gera resposta apropriada
4. **Resposta enviada** via WhatsApp Cloud API
5. **Mensagens salvas** no PostgreSQL

## Scripts Uteis

```bash
# Rodar todos os testes
npm test

# Testes do backend
npm test -w packages/api

# Lint
npm run lint

# Build de producao
npm run build
```

## Estrutura de Pastas

```
packages/
├── api/                  # Backend Fastify
│   ├── src/
│   │   ├── modules/      # Modulos por dominio
│   │   ├── db/           # Schema e migrations
│   │   └── lib/          # Utilitarios
│   └── tests/
│
├── web/                  # Frontend React
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Rotas/paginas
│   │   └── services/     # API client
│   └── tests/
│
└── shared/               # Tipos compartilhados
    └── src/types/
```

## Troubleshooting

### Webhook nao recebe mensagens

1. Verifique se ngrok esta rodando
2. Confirme URL no Meta Business Console
3. Cheque logs do servidor

### Erro de conexao com banco

1. Verifique credenciais do Supabase no `.env`
2. Confirme que o projeto Supabase esta ativo
3. Verifique se o IP esta liberado nas configuracoes do Supabase

### Mensagens nao sao enviadas

1. Verifique `WHATSAPP_ACCESS_TOKEN` no `.env`
2. Confirme que o numero esta verificado no Meta Business
3. Cheque rate limits (1000 msg/dia no tier gratuito)

## Proximos Passos

Ver [tasks.md](./tasks.md) para o breakdown detalhado das tarefas.
