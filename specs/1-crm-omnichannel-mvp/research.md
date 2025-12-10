# Research: CRM Omnichannel MVP

**Branch**: `1-crm-omnichannel-mvp` | **Date**: 2025-12-09
**Status**: Complete - All decisions documented

## 1. WhatsApp Business API Integration

### Decision: WhatsApp Cloud API (Meta)

**Rationale**:
- API oficial da Meta, sem intermediários
- Gratuito para 1000 conversas/mês iniciadas por usuário
- Webhook nativo para recebimento em tempo real
- Templates de mensagem pré-aprovados

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Twilio WhatsApp | Custo adicional por mensagem, intermediário |
| WhatsApp Business App | Sem API, não automatizável |
| Unofficial APIs | Risco de ban, viola ToS |

**Implementation Notes**:
- Webhook endpoint: `POST /api/webhooks/whatsapp`
- Verificação de token no handshake
- Mensagens chegam como POST com payload JSON
- Envio via `POST https://graph.facebook.com/v18.0/{phone_id}/messages`

---

## 2. Intent Recognition (Identificação de Intenções)

### Decision: Keyword Matching com Fallback para LLM

**Rationale**:
- MVP simples: 4 intenções básicas (saudação, localização, horário, funcionamento)
- Keyword matching cobre 90% dos casos
- Fallback para LLM (Claude/GPT) se keywords não matcharem
- Custo zero para casos comuns

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| LLM para tudo | Custo por mensagem, latência > 1s |
| Dialogflow | Vendor lock-in, complexidade desnecessária |
| Rasa NLU | Overhead de infraestrutura para MVP |

**Implementation Notes**:
```typescript
// Ordem de prioridade das intenções
const INTENTS = [
  { id: 'horario', keywords: ['horário', 'horario', 'hora', 'quando', 'aula'] },
  { id: 'localizacao', keywords: ['onde', 'endereço', 'endereco', 'local', 'fica'] },
  { id: 'funcionamento', keywords: ['funciona', 'aberto', 'existe', 'ativo'] },
  { id: 'saudacao', keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'] },
];
```

---

## 3. Resposta Automática < 5 segundos

### Decision: Redis Queue + Worker Assíncrono

**Rationale**:
- Webhook responde 200 OK imediatamente (< 100ms)
- Mensagem enfileirada no Redis
- Worker processa e envia resposta
- SLA de 5 segundos garantido mesmo sob carga

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Resposta síncrona no webhook | Timeout se processamento demorar |
| Background job sem fila | Sem garantia de ordem, retry complexo |
| Kafka | Overkill para escala do MVP |

**Implementation Notes**:
- Queue: `whatsapp:incoming`
- Worker: BullMQ com Redis
- Retry: 3 tentativas com backoff exponencial
- Dead letter queue para mensagens falhadas

---

## 4. Coleta Conversacional de Informações

### Decision: State Machine por Contato

**Rationale**:
- Estados claros: `inicial` → `coletando_nome` → `coletando_idade` → `coletando_instrumento` → `coletando_disponibilidade` → `qualificado`
- Fácil de testar e debugar
- Permite retomar conversa de onde parou

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Fluxo linear rígido | Não lida com respostas fora de ordem |
| LLM conversacional | Custo, imprevisibilidade, complexidade |
| Formulário no WhatsApp | UX ruim, não conversacional |

**Implementation Notes**:
```typescript
type JourneyState =
  | 'inicial'
  | 'coletando_nome'
  | 'coletando_idade'
  | 'coletando_instrumento'
  | 'verificando_saxofone'
  | 'coletando_experiencia'
  | 'coletando_disponibilidade'
  | 'incompativel'
  | 'qualificado';
```

---

## 5. Painel Administrativo

### Decision: SPA React com TanStack Query

**Rationale**:
- 3 administradores, baixa complexidade
- TanStack Query simplifica cache e sync
- Shadcn/ui para componentes acessíveis
- Vite para build rápido

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Next.js | SSR desnecessário para painel interno |
| Vue/Nuxt | Menos familiaridade da equipe |
| Remix | Overkill para painel simples |

---

## 6. Autenticação de Administradores

### Decision: JWT + Cookie HttpOnly

**Rationale**:
- 3 usuários fixos (Antonio, Isabelle, Maestro)
- Sem necessidade de OAuth/OIDC
- JWT em cookie HttpOnly para segurança
- Refresh token com rotação

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Session-based | Mais complexo com múltiplos containers |
| Auth0/Clerk | Custo, vendor lock-in para 3 usuários |
| Magic Links | Complexidade desnecessária |

**Implementation Notes**:
- Access token: 15 minutos
- Refresh token: 7 dias
- Seed inicial: criar 3 admins com senha hash
- bcrypt para hash de senhas

---

## 7. Persistência e Migrations

### Decision: Drizzle ORM + PostgreSQL

**Rationale**:
- Type-safe queries com inferência TypeScript
- Migrations versionadas em SQL
- Leve, sem overhead de ORMs pesados
- Suporte a JSON para metadados flexíveis

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Prisma | Build time lento, client pesado |
| TypeORM | Decorators, menos type-safe |
| Knex raw | Sem type inference |

---

## 8. Deploy e Infraestrutura

### Decision: Docker Compose (VPS simples)

**Rationale**:
- MVP não requer Kubernetes
- VPS única com Docker Compose
- Fácil backup e restore
- Custo ~$10-20/mês

**Alternatives Considered**:
| Alternativa | Rejeitada Porque |
|-------------|------------------|
| Kubernetes | Overkill, complexidade operacional |
| Serverless | Cold start viola SLA 5s |
| PaaS (Render/Railway) | Custo maior para Redis + PostgreSQL |

**Implementation Notes**:
- VPS: 2 vCPU, 4GB RAM
- Containers: api, web, redis, postgres
- Nginx como reverse proxy
- Let's Encrypt para HTTPS
- Backup diário do PostgreSQL

---

## Summary

| Área | Decisão | Complexidade |
|------|---------|--------------|
| WhatsApp | Cloud API oficial | Baixa |
| Intent | Keyword + LLM fallback | Baixa |
| Resposta | Redis Queue + Worker | Média |
| Coleta | State Machine | Média |
| Frontend | React + TanStack Query | Baixa |
| Auth | JWT + Cookie | Baixa |
| ORM | Drizzle + PostgreSQL | Baixa |
| Deploy | Docker Compose + VPS | Baixa |

**Status**: ✅ Todas as decisões técnicas documentadas. Pronto para Phase 1 (Design & Contracts).
