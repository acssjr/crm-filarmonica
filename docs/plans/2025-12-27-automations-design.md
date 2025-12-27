# Design: Sistema de Automações

**Data**: 2025-12-27
**Status**: Aprovado
**Branch**: `feat/automations`

## Resumo

Sistema completo de automações para o CRM, permitindo criar fluxos automáticos com triggers, condições e ações para atendimento WhatsApp.

## Funcionalidades

1. **Respostas condicionais** - Regras avançadas baseadas em atributos do contato
2. **Sequências de nutrição** - Follow-up automático com delays
3. **Alertas para equipe** - Notificações via WhatsApp + badge no painel

## Arquitetura

Seguindo princípios de **Clean Architecture** do plugin backend-development:

```
packages/api/src/modules/automations/
├── domain/                      # Camada interna - sem dependências
│   ├── entities/
│   │   └── automation.entity.ts
│   ├── value-objects/
│   │   ├── trigger.vo.ts
│   │   ├── condition.vo.ts
│   │   └── action.vo.ts
│   ├── events/
│   │   └── automation.events.ts
│   └── ports/
│       ├── automation.repository.port.ts
│       ├── notification.port.ts
│       ├── message-sender.port.ts
│       ├── contact.port.ts
│       └── event-publisher.port.ts
│
├── application/                 # Use Cases
│   ├── create-automation.usecase.ts
│   ├── execute-automation.usecase.ts
│   ├── evaluate-conditions.usecase.ts
│   └── run-scheduled-automations.usecase.ts
│
├── adapters/                    # Implementações concretas
│   ├── automation.repository.ts
│   ├── whatsapp-sender.adapter.ts
│   ├── panel-notifier.adapter.ts
│   └── contact.adapter.ts
│
├── automation.routes.ts         # HTTP adapter
├── automation.scheduler.ts      # BullMQ adapter
├── automation.events.ts         # Event integration
└── index.ts
```

## Modelo de Dados

### Tabela: automacoes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| nome | varchar(100) | Nome da automação |
| ativo | boolean | Ativa/desativada |
| trigger_tipo | varchar(50) | Tipo do trigger |
| trigger_config | jsonb | Configurações do trigger |
| condicoes | jsonb | Array de condições |
| acoes | jsonb | Array de ações |
| created_at | timestamp | Criação |
| updated_at | timestamp | Atualização |

### Tabela: automacao_execucoes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| automacao_id | uuid | FK automacoes |
| contato_id | uuid | FK contatos |
| status | varchar(20) | executando/sucesso/falha/aguardando |
| acoes_executadas | jsonb | Log das ações |
| erro | text | Mensagem de erro |
| proxima_acao_em | timestamp | Para ações com delay |
| created_at | timestamp | Criação |

### Tabela: alertas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tipo | varchar(20) | info/warning/success |
| titulo | varchar(100) | Título do alerta |
| mensagem | text | Conteúdo |
| contato_id | uuid | FK contatos (opcional) |
| automacao_id | uuid | FK automacoes |
| lido | boolean | Foi lido? |
| created_at | timestamp | Criação |

## Triggers Suportados

| Tipo | Descrição | Config |
|------|-----------|--------|
| novo_contato | Novo contato criado | - |
| tag_adicionada | Tag adicionada | tagId (opcional) |
| tag_removida | Tag removida | tagId (opcional) |
| jornada_mudou | Estado da jornada mudou | estado (opcional) |
| tempo_sem_interacao | X dias sem mensagem | dias (obrigatório) |
| mensagem_recebida | Mensagem recebida | palavraChave (opcional) |

## Condições Suportadas

| Campo | Operadores |
|-------|------------|
| tags | contem, nao_contem |
| estadoJornada | igual, diferente |
| origem | igual, diferente |
| idade | igual, diferente |
| instrumentoDesejado | igual, diferente |

## Ações Suportadas

| Tipo | Config | Descrição |
|------|--------|-----------|
| enviar_mensagem | mensagem | Envia texto ao contato |
| enviar_template | templateId | Envia template renderizado |
| adicionar_tag | tagId | Adiciona tag ao contato |
| remover_tag | tagId | Remove tag do contato |
| mudar_jornada | estado | Muda estado da jornada |
| notificar_admin | adminPhone, mensagem | Notifica via WhatsApp |
| aguardar | dias | Pausa execução por X dias |

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /automacoes | Listar todas |
| GET | /automacoes/:id | Buscar por ID |
| POST | /automacoes | Criar |
| PATCH | /automacoes/:id | Atualizar |
| DELETE | /automacoes/:id | Excluir |
| POST | /automacoes/:id/ativar | Ativar |
| POST | /automacoes/:id/desativar | Desativar |
| GET | /automacoes/:id/execucoes | Histórico |
| GET | /alertas | Listar alertas |
| PATCH | /alertas/:id/lido | Marcar como lido |

## Fluxo de Execução

1. **Evento ocorre** (nova msg, tag adicionada, etc.)
2. **Sistema emite evento** para automation.events.ts
3. **Busca automações** ativas com trigger correspondente
4. **Avalia condições** para o contato
5. **Enfileira execução** no BullMQ
6. **Worker processa** executando ações em sequência
7. **Se ação "aguardar"**, pausa e reagenda
8. **Loga resultado** na tabela de execuções

## Scheduler

- Job recorrente a cada 5 minutos
- Verifica automações de `tempo_sem_interacao`
- Busca contatos sem mensagem há X dias
- Enfileira execuções

## Frontend

- Página /automacoes com lista de automações
- Modal para criar/editar com formulário estruturado
- Histórico de execuções por automação
- Badge de alertas não lidos no header
