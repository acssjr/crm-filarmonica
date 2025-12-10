# Quickstart: CRM Omnichannel MVP

**Branch**: `1-crm-omnichannel-mvp` | **Date**: 2025-12-09

Guia rápido para rodar o projeto localmente e entender a arquitetura.

## Pré-requisitos

- Node.js 20 LTS
- Docker e Docker Compose
- Conta Meta Business (para WhatsApp Business API)

## Setup Local

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/[org]/crm-filarmonica.git
cd crm-filarmonica
git checkout 1-crm-omnichannel-mvp

# Instalar dependências (usando npm workspaces)
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_filarmonica

# Redis
REDIS_URL=redis://localhost:6379

# WhatsApp Business API
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3000/api
```

### 3. Subir infraestrutura

```bash
# PostgreSQL + Redis
docker compose up -d postgres redis

# Verificar se estão rodando
docker compose ps
```

### 4. Rodar migrations

```bash
npm run db:migrate -w packages/api
```

### 5. Seed dos administradores

```bash
npm run db:seed -w packages/api
```

Isso cria os 3 administradores:
- `antonio@filarmonica25.org.br` / `admin123`
- `isabelle@filarmonica25.org.br` / `admin123`
- `maestro@filarmonica25.org.br` / `admin123`

### 6. Rodar em desenvolvimento

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
# Instalar ngrok se não tiver
# https://ngrok.com/download

ngrok http 3000
```

Copie a URL `https://xxxx.ngrok.io` e configure no Meta Business:
- Webhook URL: `https://xxxx.ngrok.io/api/webhooks/whatsapp`
- Verify Token: valor do `WHATSAPP_VERIFY_TOKEN`

## Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│   Webhook   │────▶│ Redis Queue │
│  Cloud API  │     │  (Fastify)  │     │  (BullMQ)   │
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
                    │ PostgreSQL  │
                    │ (Contatos,  │
                    │  Mensagens) │
                    └─────────────┘
                           ▲
                           │
┌─────────────┐     ┌─────────────┐
│   React     │────▶│  REST API   │
│   (Admin)   │     │  (Fastify)  │
└─────────────┘     └─────────────┘
```

## Fluxo de Mensagem

1. **Mensagem chega** no webhook `/api/webhooks/whatsapp`
2. **Webhook responde 200** imediatamente e enfileira no Redis
3. **Worker processa**:
   - Busca/cria contato pelo telefone
   - Identifica intenção (keywords)
   - Atualiza estado da jornada
   - Gera resposta apropriada
4. **Resposta enviada** via WhatsApp Cloud API
5. **Mensagens salvas** no PostgreSQL

## Scripts Úteis

```bash
# Rodar todos os testes
npm test

# Testes do backend
npm test -w packages/api

# Testes e2e do frontend
npm run test:e2e -w packages/web

# Lint
npm run lint

# Build de produção
npm run build

# Docker produção
docker compose -f docker-compose.prod.yml up --build
```

## Estrutura de Pastas

```
packages/
├── api/                  # Backend Fastify
│   ├── src/
│   │   ├── modules/      # Módulos por domínio
│   │   ├── db/           # Schema e migrations
│   │   └── lib/          # Utilitários
│   └── tests/
│
├── web/                  # Frontend React
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Rotas/páginas
│   │   └── services/     # API client
│   └── tests/
│
└── shared/               # Tipos compartilhados
    └── src/types/
```

## Troubleshooting

### Webhook não recebe mensagens

1. Verifique se ngrok está rodando
2. Confirme URL no Meta Business Console
3. Cheque logs: `docker compose logs -f api`

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker compose ps

# Recriar se necessário
docker compose down
docker compose up -d postgres
```

### Mensagens não são enviadas

1. Verifique `WHATSAPP_ACCESS_TOKEN` no `.env`
2. Confirme que o número está verificado no Meta Business
3. Cheque rate limits (1000 msg/dia no tier gratuito)

## Próximos Passos

Após setup funcionando:

1. [ ] Implementar User Story 1 (Resposta Automática)
2. [ ] Implementar User Story 2 (Cadastro de Contatos)
3. [ ] Implementar User Story 3 (Painel Admin)
4. [ ] Implementar User Story 4 (Coleta de Informações)
5. [ ] Implementar User Story 5 (Verificação de Horário)

Ver [tasks.md](./tasks.md) para o breakdown detalhado.
