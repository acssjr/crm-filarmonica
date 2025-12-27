<div align="center">
  <h1>CRM Filarmonica</h1>
  <p><strong>CRM Omnichannel para Sociedade Filarmonica 25 de Março</strong></p>

  ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
  ![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
  ![License](https://img.shields.io/badge/License-Private-red)
</div>

---

## Sobre

Sistema de CRM (Customer Relationship Management) omnichannel desenvolvido para a Sociedade Filarmônica 25 de Março. Permite gerenciamento centralizado de contatos, conversas via WhatsApp Business API, campanhas de marketing, automações e funil de vendas.

### Principais Funcionalidades

- **Dashboard** - Visão geral com métricas e KPIs
- **Contatos** - Gestão centralizada de clientes e leads
- **Conversas** - Integração com WhatsApp Business API
- **Prospectos** - Pipeline de vendas e qualificação
- **Campanhas** - Marketing e comunicação em massa
- **Templates** - Modelos de mensagens reutilizáveis
- **Relatórios** - Analytics e insights
- **Funil** - Visualização do processo de vendas
- **Automações** - Workflows automatizados
- **Tags** - Organização e segmentação
- **Equipe** - Gestão de usuários e permissões
- **Configurações** - Personalização do sistema

## Stack Tecnológica

### Backend (`packages/api`)

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 20+ | Runtime JavaScript |
| Fastify | 5.x | Framework web de alta performance |
| Drizzle ORM | 0.36 | ORM TypeScript-first |
| PostgreSQL | - | Banco de dados (via Supabase) |
| Redis | - | Cache e filas (via Upstash) |
| BullMQ | 5.x | Processamento de jobs em background |
| Zod | 3.x | Validação de schemas |

### Frontend (`packages/web`)

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.x | Biblioteca UI |
| Vite | 6.x | Build tool e dev server |
| TailwindCSS | 3.4 | Framework CSS utilitário |
| TanStack Query | 5.x | Gerenciamento de estado do servidor |
| React Router | 7.x | Roteamento SPA |
| Clerk | 5.x | Autenticação |
| Lucide | - | Ícones |

### Compartilhado (`packages/shared`)

Types e utilitários TypeScript compartilhados entre packages.

## Arquitetura

```
crm-filarmonica/
├── packages/
│   ├── api/          # Backend Fastify
│   │   ├── src/
│   │   │   ├── db/        # Drizzle ORM schemas e migrations
│   │   │   ├── routes/    # Rotas da API
│   │   │   └── server.ts  # Entry point
│   │   └── package.json
│   ├── web/          # Frontend React
│   │   ├── src/
│   │   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── pages/       # Páginas da aplicação
│   │   │   └── main.tsx     # Entry point
│   │   └── package.json
│   └── shared/       # Tipos compartilhados
│       └── package.json
├── docs/             # Documentação
├── .env.example      # Template de variáveis de ambiente
└── package.json      # Workspace root
```

## Começando

### Pré-requisitos

- Node.js 20+
- npm 9+
- Conta [Supabase](https://supabase.com) (PostgreSQL)
- Conta [Upstash](https://upstash.com) (Redis)
- WhatsApp Business API (opcional)

### Instalação

1. Clone o repositório
   ```bash
   git clone https://github.com/acssjr/crm-filarmonica.git
   cd crm-filarmonica
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente
   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais

   # Para o frontend
   cp .env.example packages/web/.env
   ```

4. Execute as migrations do banco
   ```bash
   npm run db:migrate
   ```

5. (Opcional) Popule com dados de teste
   ```bash
   npm run db:seed
   ```

### Desenvolvimento

```bash
# Inicia API e Web simultaneamente
npm run dev

# Ou separadamente:
npm run dev:api   # Backend em http://localhost:3000
npm run dev:web   # Frontend em http://localhost:5173
```

### Build

```bash
# Build de todos os packages
npm run build

# Ou separadamente:
npm run build:api
npm run build:web
```

### Testes

```bash
# Todos os testes
npm test

# Por package
npm run test:api
npm run test:web
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL (Supabase) |
| `REDIS_URL` | Connection string Redis (Upstash) |
| `WHATSAPP_PHONE_ID` | ID do telefone WhatsApp Business |
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso da API |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação webhook |
| `API_PORT` | Porta da API (default: 3000) |
| `VITE_API_URL` | URL da API para o frontend |
| `VITE_CLERK_PUBLISHABLE_KEY` | Chave pública do Clerk |

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia todos os packages em modo desenvolvimento |
| `npm run dev:api` | Inicia apenas a API |
| `npm run dev:web` | Inicia apenas o frontend |
| `npm run build` | Build de produção |
| `npm run test` | Executa todos os testes |
| `npm run lint` | Verifica código com ESLint |
| `npm run db:migrate` | Executa migrations |
| `npm run db:seed` | Popula banco com dados de teste |
| `npm run db:studio` | Abre Drizzle Studio |

## Roadmap

- [ ] Integração completa WhatsApp Business API
- [ ] Sistema de automações
- [ ] Dashboard com métricas em tempo real
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Integração com outros canais (Email, SMS)
- [ ] App mobile

## Contribuição

Este é um projeto privado da Sociedade Filarmônica 25 de Março.

## Licença

Uso restrito - Todos os direitos reservados.

---

<div align="center">
  <sub>Desenvolvido para Sociedade Filarmônica 25 de Março</sub>
</div>
