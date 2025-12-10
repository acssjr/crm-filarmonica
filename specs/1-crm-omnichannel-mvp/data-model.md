# Data Model: CRM Omnichannel MVP

**Branch**: `1-crm-omnichannel-mvp` | **Date**: 2025-12-09
**Spec Reference**: [spec.md](./spec.md) - Key Entities section

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  Administrador  │       │     Contato     │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ nome            │       │ telefone        │
│ email           │       │ nome            │
│ senha_hash      │       │ tipo            │
│ created_at      │       │ origem          │
│ updated_at      │       │ origem_campanha │
└─────────────────┘       │ canal           │
                          │ estado_jornada  │
                          │ created_at      │
                          │ updated_at      │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │ Interessado │  │  Conversa   │  │   Evento    │
          ├─────────────┤  ├─────────────┤  ├─────────────┤
          │ id          │  │ id          │  │ id          │
          │ contato_id  │  │ contato_id  │  │ contato_id  │
          │ nome        │  │ canal       │  │ tipo        │
          │ idade       │  │ status      │  │ dados       │
          │ instrumento │  │ created_at  │  │ created_at  │
          │ experiencia │  │ updated_at  │  └─────────────┘
          │ expectativas│  │ closed_at   │
          │ disponib... │  └──────┬──────┘
          │ compativel  │         │
          │ created_at  │         ▼
          └─────────────┘  ┌─────────────┐
                           │  Mensagem   │
                           ├─────────────┤
                           │ id          │
                           │ conversa_id │
                           │ direcao     │
                           │ conteudo    │
                           │ tipo        │
                           │ enviado_por │
                           │ whatsapp_id │
                           │ created_at  │
                           └─────────────┘
```

## Entities

### Administrador

Usuário com acesso ao painel administrativo.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| nome | VARCHAR(100) | NOT NULL | Nome do administrador |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email para login |
| senha_hash | VARCHAR(255) | NOT NULL | Hash bcrypt da senha |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Data de criação |
| updated_at | TIMESTAMP | NOT NULL | Última atualização |

**Seed Data** (3 administradores fixos):
- Antonio (owner)
- Isabelle (marketing)
- Maestro (musical director)

---

### Contato

Pessoa que entra em contato pelo WhatsApp (pai/mãe ou interessado direto).

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| telefone | VARCHAR(20) | UNIQUE, NOT NULL | Número WhatsApp (formato E.164) |
| nome | VARCHAR(200) | NULL | Nome (coletado durante conversa) |
| tipo | ENUM | NOT NULL, DEFAULT 'desconhecido' | `desconhecido`, `responsavel`, `interessado_direto` |
| origem | ENUM | NOT NULL, DEFAULT 'organico' | `organico`, `campanha`, `indicacao` |
| origem_campanha | VARCHAR(50) | NULL | Código da campanha (ex: CAMP01) |
| canal | ENUM | NOT NULL, DEFAULT 'whatsapp' | `whatsapp` (MVP), futuro: `instagram`, `facebook` |
| estado_jornada | ENUM | NOT NULL, DEFAULT 'inicial' | Estado atual no fluxo conversacional |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Primeiro contato |
| updated_at | TIMESTAMP | NOT NULL | Última interação |

**Estados da Jornada** (state machine):
```typescript
type EstadoJornada =
  | 'inicial'           // Mensagem recebida, ainda não interagiu
  | 'boas_vindas'       // Recebeu mensagem de boas-vindas
  | 'coletando_nome'    // Perguntamos o nome
  | 'coletando_idade'   // Perguntamos a idade
  | 'coletando_instrumento' // Perguntamos o instrumento
  | 'verificando_saxofone'  // Explicando restrição do sax alto
  | 'coletando_experiencia' // Perguntamos experiência
  | 'coletando_disponibilidade' // Verificando horário
  | 'incompativel'      // Sem disponibilidade no horário
  | 'qualificado'       // Ficha completa, pronto para agendar
  | 'atendimento_humano'; // Transferido para admin
```

**Validation Rules**:
- `telefone`: Formato E.164 (+5511999999999)
- `origem_campanha`: Só preenchido se `origem` = 'campanha'

---

### Interessado

Pessoa que vai estudar música (pode ser filho do Contato).

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| contato_id | UUID | FK → Contato, NOT NULL | Contato responsável |
| nome | VARCHAR(200) | NOT NULL | Nome do interessado |
| idade | INTEGER | NOT NULL, CHECK >= 0 | Idade em anos |
| instrumento_desejado | VARCHAR(100) | NOT NULL | Instrumento escolhido |
| instrumento_sugerido | VARCHAR(100) | NULL | Alternativa sugerida (se sax alto) |
| experiencia_musical | TEXT | NULL | Descrição da experiência prévia |
| expectativas | TEXT | NULL | O que espera da escola |
| disponibilidade_horario | BOOLEAN | NOT NULL | Disponível seg/qua/sex 15h-17h |
| compativel | BOOLEAN | NOT NULL, DEFAULT true | Horário compatível |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Data de criação da ficha |

**Validation Rules**:
- Se `instrumento_desejado` = 'saxofone alto', `instrumento_sugerido` deve ser preenchido
- `idade` geralmente entre 7 e 70 anos (soft validation)

**Business Rules**:
- Instrumentos de graves são prioritários: tuba, bombardino, trombone, sax barítono, sax tenor
- Saxofone alto tem restrição (explicar gentilmente)

---

### Conversa

Agrupa mensagens de um contato em uma sessão.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| contato_id | UUID | FK → Contato, NOT NULL | Contato da conversa |
| canal | ENUM | NOT NULL | `whatsapp` |
| status | ENUM | NOT NULL, DEFAULT 'ativa' | `ativa`, `encerrada` |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Início da conversa |
| updated_at | TIMESTAMP | NOT NULL | Última mensagem |
| closed_at | TIMESTAMP | NULL | Quando foi encerrada |

**Business Rules**:
- Nova conversa criada se última mensagem > 24h
- Conversa encerrada automaticamente após 7 dias sem atividade

---

### Mensagem

Cada mensagem trocada na conversa.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| conversa_id | UUID | FK → Conversa, NOT NULL | Conversa pai |
| direcao | ENUM | NOT NULL | `entrada` (do contato), `saida` (do sistema) |
| conteudo | TEXT | NOT NULL | Texto da mensagem |
| tipo | ENUM | NOT NULL | `texto`, `automatica`, `manual` |
| enviado_por | UUID | FK → Administrador, NULL | NULL se automática |
| whatsapp_id | VARCHAR(100) | UNIQUE, NULL | ID da mensagem no WhatsApp |
| status_envio | ENUM | DEFAULT 'enviada' | `pendente`, `enviada`, `entregue`, `lida`, `falhou` |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Timestamp da mensagem |

**Indexes**:
- `conversa_id` + `created_at` (listagem cronológica)
- `whatsapp_id` (deduplicação de webhooks)

---

### Evento

Log de eventos importantes para analytics.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | Identificador único |
| contato_id | UUID | FK → Contato, NULL | Contato relacionado |
| tipo | VARCHAR(50) | NOT NULL | Tipo do evento |
| dados | JSONB | NULL | Dados adicionais |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW | Quando ocorreu |

**Tipos de Evento**:
- `primeiro_contato` - Novo contato registrado
- `mensagem_recebida` - Mensagem do contato
- `mensagem_enviada` - Resposta do sistema
- `intencao_detectada` - { intencao: 'localizacao' }
- `jornada_atualizada` - { de: 'inicial', para: 'boas_vindas' }
- `ficha_gerada` - Interessado qualificado
- `horario_incompativel` - Contato sem disponibilidade
- `atendimento_humano` - Admin assumiu conversa

---

## Indexes

```sql
-- Contato
CREATE UNIQUE INDEX idx_contato_telefone ON contato(telefone);
CREATE INDEX idx_contato_estado ON contato(estado_jornada);
CREATE INDEX idx_contato_origem ON contato(origem);
CREATE INDEX idx_contato_created ON contato(created_at DESC);

-- Interessado
CREATE INDEX idx_interessado_contato ON interessado(contato_id);
CREATE INDEX idx_interessado_instrumento ON interessado(instrumento_desejado);

-- Conversa
CREATE INDEX idx_conversa_contato ON conversa(contato_id);
CREATE INDEX idx_conversa_status ON conversa(status);
CREATE INDEX idx_conversa_updated ON conversa(updated_at DESC);

-- Mensagem
CREATE INDEX idx_mensagem_conversa ON mensagem(conversa_id, created_at);
CREATE UNIQUE INDEX idx_mensagem_whatsapp ON mensagem(whatsapp_id) WHERE whatsapp_id IS NOT NULL;

-- Evento
CREATE INDEX idx_evento_contato ON evento(contato_id);
CREATE INDEX idx_evento_tipo ON evento(tipo);
CREATE INDEX idx_evento_created ON evento(created_at DESC);
```

## State Transitions

### Jornada do Contato

```
┌─────────┐  msg recebida   ┌─────────────┐
│ inicial │ ───────────────▶│ boas_vindas │
└─────────┘                 └──────┬──────┘
                                   │ demonstra interesse
                                   ▼
                            ┌─────────────────┐
                            │ coletando_nome  │
                            └────────┬────────┘
                                     │ nome informado
                                     ▼
                            ┌─────────────────┐
                            │ coletando_idade │
                            └────────┬────────┘
                                     │ idade informada
                                     ▼
                         ┌──────────────────────┐
                         │ coletando_instrumento│
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ sax alto      │ outro         │
                    ▼               ▼               │
          ┌──────────────────┐ ┌────────────────────┤
          │verificando_saxo. │ │                    │
          └────────┬─────────┘ │                    │
                   │ aceita    │                    │
                   │ alternativa│                   │
                   └───────────┘                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │ coletando_experiencia │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                     ┌────────────────────────────┐
                                     │ coletando_disponibilidade  │
                                     └─────────────┬──────────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │ não tem            │ tem disponibilidade│
                              ▼                    ▼                    │
                       ┌─────────────┐      ┌─────────────┐            │
                       │ incompativel│      │ qualificado │◀───────────┘
                       └─────────────┘      └─────────────┘

        (qualquer momento)
              │
              ▼
     ┌──────────────────┐
     │atendimento_humano│  (admin assume)
     └──────────────────┘
```

## Dashboard Aggregations

Para o painel administrativo (FR-018):

```sql
-- Total de contatos
SELECT COUNT(*) FROM contato;

-- Conversas ativas
SELECT COUNT(*) FROM conversa WHERE status = 'ativa';

-- Novos contatos hoje
SELECT COUNT(*) FROM contato WHERE DATE(created_at) = CURRENT_DATE;

-- Contatos por origem (para métricas de campanha)
SELECT origem, COUNT(*) FROM contato GROUP BY origem;

-- Contatos por estado da jornada
SELECT estado_jornada, COUNT(*) FROM contato GROUP BY estado_jornada;

-- Taxa de conversão (qualificados / total)
SELECT
  COUNT(*) FILTER (WHERE estado_jornada = 'qualificado') AS qualificados,
  COUNT(*) AS total
FROM contato;
```
