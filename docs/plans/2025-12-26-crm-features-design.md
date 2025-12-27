# CRM Features Design

Data: 2025-12-26

## Visão Geral

Este documento define o design das novas funcionalidades do CRM Filarmonica:

1. **Tags** - Sistema de etiquetas para organizar contatos
2. **Templates** - Templates de mensagem para WhatsApp
3. **Campanhas** - Envio em massa usando templates
4. **Relatórios** - Analytics e métricas

---

## 1. Tags

### Decisões
- Tags simples (nome + cor)
- Apenas admins criam/editam/excluem tags
- Sem limite de tags por contato
- Paleta fixa de 8 cores: gray, red, orange, yellow, green, blue, purple, pink

### Banco de Dados

```sql
-- Tabela de tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL UNIQUE,
  cor VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relação muitos-para-muitos
CREATE TABLE contato_tags (
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contato_id, tag_id)
);

CREATE INDEX idx_contato_tags_contato ON contato_tags(contato_id);
CREATE INDEX idx_contato_tags_tag ON contato_tags(tag_id);
```

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/tags | Lista todas as tags |
| POST | /api/tags | Cria nova tag (admin) |
| PATCH | /api/tags/:id | Edita tag (admin) |
| DELETE | /api/tags/:id | Remove tag (admin) |
| POST | /api/contacts/:id/tags | Adiciona tag ao contato |
| DELETE | /api/contacts/:id/tags/:tagId | Remove tag do contato |

### Frontend
- Página Tags: Lista, criar, editar, excluir tags
- Contatos: Badges coloridos + dropdown para adicionar/remover
- Filtro: Filtrar contatos por tag na listagem

---

## 2. Templates

### Decisões
- Templates internos (respostas rápidas) + HSM do WhatsApp
- Categorias fixas (Boas-vindas, Lembretes, Promoções, Atendimento) + customizáveis
- Variáveis: {nome}, {telefone}, {instrumento}, {idade}, {experiencia}, {disponibilidade}, {data_cadastro}
- Preview visual + envio de teste

### Banco de Dados

```sql
-- Categorias de template
CREATE TABLE template_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL UNIQUE,
  is_sistema BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed categorias fixas
INSERT INTO template_categorias (nome, is_sistema) VALUES
  ('Boas-vindas', true),
  ('Lembretes', true),
  ('Promoções', true),
  ('Atendimento', true);

-- Templates
CREATE TYPE template_tipo AS ENUM ('interno', 'hsm');
CREATE TYPE hsm_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES template_categorias(id),
  nome VARCHAR(100) NOT NULL,
  conteudo TEXT NOT NULL,
  tipo template_tipo NOT NULL DEFAULT 'interno',
  hsm_nome VARCHAR(100),
  hsm_status hsm_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_categoria ON templates(categoria_id);
CREATE INDEX idx_templates_tipo ON templates(tipo);
```

### Variáveis Disponíveis

| Variável | Fonte | Exemplo |
|----------|-------|---------|
| {nome} | contatos.nome | "João Silva" |
| {telefone} | contatos.telefone | "75999001234" |
| {instrumento} | interessados.instrumento_desejado | "Saxofone" |
| {idade} | interessados.idade | "25" |
| {experiencia} | interessados.experiencia_musical | "2 anos de violão" |
| {disponibilidade} | interessados.disponibilidade_horario | "Sim" / "Não" |
| {data_cadastro} | contatos.created_at | "26/12/2025" |

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/templates | Lista templates (filtro por categoria) |
| GET | /api/templates/:id | Detalhes do template |
| POST | /api/templates | Cria template |
| PATCH | /api/templates/:id | Edita template |
| DELETE | /api/templates/:id | Remove template |
| POST | /api/templates/:id/preview | Preview com dados de exemplo |
| POST | /api/templates/:id/test | Envia teste para número |
| GET | /api/template-categorias | Lista categorias |
| POST | /api/template-categorias | Cria categoria |
| DELETE | /api/template-categorias/:id | Remove categoria (não sistema) |

---

## 3. Campanhas

### Decisões
- Seleção por filtros + ajuste manual de destinatários
- Agendamento com data/hora + recorrência (diário, semanal, mensal)
- Envio gradual (~80 msg/hora) para evitar bloqueio do WhatsApp
- Métricas completas: enviadas, entregues, lidas, respondidas, falhas

### Banco de Dados

```sql
-- Status da campanha
CREATE TYPE campanha_status AS ENUM ('rascunho', 'agendada', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE campanha_recorrencia AS ENUM ('nenhuma', 'diario', 'semanal', 'mensal');
CREATE TYPE destinatario_status AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'respondida', 'falhou');

-- Campanhas
CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  template_id UUID NOT NULL REFERENCES templates(id),
  filtros JSONB,
  status campanha_status NOT NULL DEFAULT 'rascunho',
  agendada_para TIMESTAMPTZ,
  recorrencia campanha_recorrencia NOT NULL DEFAULT 'nenhuma',
  recorrencia_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Destinatários da campanha
CREATE TABLE campanha_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  contato_id UUID NOT NULL REFERENCES contatos(id),
  status destinatario_status NOT NULL DEFAULT 'pendente',
  erro TEXT,
  enviada_at TIMESTAMPTZ,
  entregue_at TIMESTAMPTZ,
  lida_at TIMESTAMPTZ,
  respondida_at TIMESTAMPTZ,
  UNIQUE(campanha_id, contato_id)
);

CREATE INDEX idx_campanha_dest_campanha ON campanha_destinatarios(campanha_id);
CREATE INDEX idx_campanha_dest_status ON campanha_destinatarios(status);

-- Execuções (para recorrência)
CREATE TABLE campanha_execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  iniciada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluida_at TIMESTAMPTZ,
  total_enviadas INTEGER NOT NULL DEFAULT 0,
  total_entregues INTEGER NOT NULL DEFAULT 0,
  total_lidas INTEGER NOT NULL DEFAULT 0,
  total_respondidas INTEGER NOT NULL DEFAULT 0,
  total_falhas INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_campanha_exec_campanha ON campanha_execucoes(campanha_id);
```

### Estrutura de Filtros (JSONB)

```json
{
  "origem": ["organico", "campanha"],
  "estado_jornada": ["qualificado", "atendimento_humano"],
  "tags": ["uuid-tag-1", "uuid-tag-2"],
  "instrumento": ["Saxofone", "Trompete"],
  "canal": ["whatsapp"]
}
```

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/campanhas | Lista campanhas |
| GET | /api/campanhas/:id | Detalhes + métricas |
| POST | /api/campanhas | Cria campanha |
| PATCH | /api/campanhas/:id | Edita (só rascunho) |
| DELETE | /api/campanhas/:id | Remove campanha |
| POST | /api/campanhas/:id/preview | Preview destinatários dos filtros |
| POST | /api/campanhas/:id/agendar | Agenda envio |
| POST | /api/campanhas/:id/cancelar | Cancela campanha |
| GET | /api/campanhas/:id/destinatarios | Lista com status de cada envio |

### Worker (BullMQ)

- Job `processar-campanha`: dispara no horário agendado
- Rate limit: ~80 msg/hora (1 msg a cada 45 segundos)
- Atualiza status via webhooks do WhatsApp
- Cria nova execução se tem recorrência

---

## 4. Relatórios

### Decisões
- Relatórios fixos pré-definidos
- Filtros: atalhos rápidos (7d, 30d, 90d) + date picker customizado
- Exportação CSV/Excel

### Relatórios Disponíveis

| Relatório | Métricas |
|-----------|----------|
| **Contatos** | Novos por período, por origem, por canal, crescimento |
| **Conversas** | Total, tempo médio resposta, por status, msgs/dia |
| **Funil** | Contatos por estado da jornada, taxa conversão entre etapas |
| **Campanhas** | Enviadas, entregues, lidas, respondidas, taxa sucesso |
| **Instrumentos** | Distribuição por instrumento desejado, compatibilidade |

### Banco de Dados

Sem tabelas novas - queries agregadas nas tabelas existentes.

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/relatorios/contatos | Métricas de contatos |
| GET | /api/relatorios/conversas | Métricas de conversas |
| GET | /api/relatorios/funil | Métricas do funil |
| GET | /api/relatorios/campanhas | Métricas de campanhas |
| GET | /api/relatorios/instrumentos | Distribuição instrumentos |
| GET | /api/relatorios/:tipo/export | Exporta CSV |

Query params: `?inicio=2025-01-01&fim=2025-01-31` ou `?periodo=7d|30d|90d`

---

## Ordem de Implementação

1. **Tags** (mais simples, base para filtros de campanha)
2. **Templates** (necessário para campanhas)
3. **Campanhas** (depende de tags e templates)
4. **Relatórios** (depende de tudo estar funcionando)

---

## Melhorias MVP (após features)

1. Ativar autenticação Clerk no frontend
2. Testar integração WhatsApp de ponta a ponta
3. Ajustar UI/UX das páginas existentes
