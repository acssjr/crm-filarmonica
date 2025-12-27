# Estratégia de Testes - CRM Filarmonica

## Pirâmide de Testes Atual

| Camada | Atual | Meta | Status |
|--------|-------|------|--------|
| **Unitários** | ~85% | 60-70% | Excedendo |
| **Integração** | ~15% | 20-25% | No alvo |
| **E2E** | 0% | 5-10% | Faltando |

## Análise dos Testes Existentes

### Unitários (524 testes)

#### Essenciais (MANTER)

**Domain Layer (Value Objects + Entities)**
- `trigger.vo.test.ts` - Validação de triggers
- `action.vo.test.ts` - Validação de ações
- `condition.vo.test.ts` - Avaliação de condições
- `automation.entity.test.ts` - Lógica da entidade

**Justificativa**: São o core da lógica de negócio. Devem ter cobertura alta.

**Use Cases**
- `create-automation.usecase.test.ts` - CRUD de automações
- `execute-automation.usecase.test.ts` - Execução de automações (CRÍTICO)

**Justificativa**: Orquestram a lógica de negócio. Essenciais.

**Services**
- `contact.service.test.ts` - Normalização de telefones, parsing de campanhas
- `tag.service.test.ts` - CRUD de tags

**Justificativa**: Contêm lógica de negócio específica.

#### Potencialmente Redundantes (AVALIAR)

**Adapters com mocks simples**
- `event-publisher.adapter.test.ts` - Testa pub/sub in-memory
- `notification.adapter.test.ts` - Testa logging de notificações
- `template.adapter.test.ts` - Testa busca de templates

**Justificativa**: Adapters thin que apenas delegam. Podem ser cobertos por testes de integração.

**Nota**: Manter se os adapters tiverem lógica própria (como `whatsapp-sender.adapter.test.ts` que sanitiza telefones).

### Integração (com PGlite)

**Essenciais (MANTER)**
- `contact.repository.integration.test.ts` - Queries complexas
- `automation.repository.test.ts` - CRUD com DB real

**Justificativa**: Validam que queries SQL funcionam corretamente.

**Faltando**
- `tag.repository.integration.test.ts` - Relações many-to-many
- `message.repository.integration.test.ts` - Histórico de conversas

### Testes de Rotas (API Contract)

**Essenciais (MANTER)**
- `automation.routes.test.ts` - Endpoints de automações
- `tag.routes.test.ts` - Endpoints de tags

**Faltando**
- `contact.routes.test.ts` - Endpoints de contatos
- `webhook.routes.test.ts` - Webhook do WhatsApp (CRÍTICO)

## Testes E2E Necessários

### Fluxos Críticos de Negócio

#### 1. Recebimento de Mensagem WhatsApp
```
Webhook POST -> Criar/Atualizar Contato -> Disparar Automação -> Enviar Resposta
```
**Prioridade**: ALTA
**Ferramentas**: Playwright ou Supertest com banco real

#### 2. Fluxo de Qualificação de Prospecto
```
Contato entra -> Boas-vindas -> Coleta dados -> Qualificação -> Atendimento humano
```
**Prioridade**: ALTA
**Cobertura**: Máquina de estados completa

#### 3. Disparo de Automação por Trigger
```
Trigger manual/agendado -> Avaliar condições -> Executar ações -> Registrar execução
```
**Prioridade**: MÉDIA

### Configuração Sugerida para E2E

```typescript
// packages/api/e2e/vitest.config.ts
export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.test.ts'],
    globalSetup: './e2e/setup.ts', // Cria banco real
    globalTeardown: './e2e/teardown.ts', // Limpa
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
```

## Recomendações

### Curto Prazo
1. Implementar webhook.routes.test.ts (teste de contrato)
2. Implementar primeiro E2E: fluxo WhatsApp básico

### Médio Prazo
1. Implementar E2E de qualificação de prospecto
2. Adicionar testes de integração para repositories faltantes

### Longo Prazo
1. Configurar Playwright para testes de frontend
2. Implementar testes de carga para webhook

## Métricas de Qualidade

| Métrica | Atual | Meta |
|---------|-------|------|
| Cobertura de código | 98.76% | >80% |
| Tempo de execução | 2s | <30s |
| Flaky tests | 0 | 0 |
| E2E críticos | 0/3 | 3/3 |

## Conclusão

A base de testes unitários é sólida. O foco agora deve ser:

1. **E2E do webhook WhatsApp** - É o ponto de entrada principal do sistema
2. **Testes de contrato para API** - Garantir que mudanças não quebrem clientes
3. **Reduzir testes redundantes** - Alguns adapters podem ser cobertos por integração

A pirâmide está "invertida" no topo (muitos unitários), mas isso é aceitável dado o estágio inicial do projeto. O importante é adicionar os E2E críticos.
