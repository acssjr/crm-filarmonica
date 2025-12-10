# Feature Specification: Atendimento Compartilhado e Mídia

**Feature Branch**: `2-atendimento-compartilhado`
**Created**: 2025-12-10
**Status**: Draft
**Prerequisites**: MVP completo (1-crm-omnichannel-mvp)
**Input**: Relatório técnico "Integração WhatsApp API com CRMs 2025" + Requisitos de atendimento compartilhado

## Contexto

Este spec evolui o CRM para um **sistema de atendimento compartilhado** onde múltiplos atendentes (Antonio, Isabelle, Maestro) podem:
1. Ver e responder conversas em tempo real
2. Enviar/receber mídias (áudio, imagem, documento, localização)
3. Ter controle sobre janela de 24h e templates
4. Operar com compliance LGPD

Baseado em plataformas consolidadas: Chatwoot, Zendesk, Intercom.

---

## User Scenarios & Testing

### User Story 6 - Atendimento Compartilhado em Tempo Real (Priority: P1)

Como atendente (Antonio, Isabelle ou Maestro), quero ver novas mensagens em tempo real e poder assumir conversas, para que múltiplas pessoas possam atender simultaneamente sem conflito.

**Why this priority**: Core do sistema de atendimento. Sem isso, não há colaboração.

**Acceptance Scenarios**:

1. **Given** uma nova mensagem chega no WhatsApp, **When** qualquer atendente está logado no painel, **Then** vê a mensagem aparecer instantaneamente (< 1s) sem refresh.

2. **Given** uma conversa sem atendente atribuído, **When** atendente clica em "Assumir", **Then** a conversa é atribuída a ele e outros veem quem está atendendo.

3. **Given** uma conversa está sendo atendida por Isabelle, **When** Antonio visualiza, **Then** vê indicador "Atendido por Isabelle" e pode apenas observar (ou solicitar transferência).

4. **Given** Isabelle está digitando resposta, **When** Antonio visualiza a conversa, **Then** vê indicador "Isabelle está digitando...".

5. **Given** uma conversa fica 30min sem resposta do atendente, **When** o sistema verifica, **Then** libera automaticamente para fila geral.

---

### User Story 7 - Envio e Recebimento de Mídia (Priority: P1)

Como atendente, quero enviar e receber áudios, imagens, documentos e localização pelo painel, para ter a mesma experiência do WhatsApp nativo.

**Why this priority**: Essencial para atendimento completo. Muitos pais enviam áudios.

**Acceptance Scenarios**:

1. **Given** um contato envia uma imagem, **When** o sistema processa, **Then** a imagem aparece inline na conversa com preview e opção de download.

2. **Given** um contato envia um áudio, **When** o sistema processa, **Then** o áudio aparece com player inline para reprodução direta.

3. **Given** um contato envia um documento (PDF), **When** o sistema processa, **Then** aparece com ícone, nome do arquivo e botão de download.

4. **Given** um atendente quer enviar uma imagem, **When** arrasta ou seleciona arquivo, **Then** aparece preview com opção de caption antes de enviar.

5. **Given** um atendente quer enviar localização da Filarmônica, **When** clica no botão de localização, **Then** envia pin com endereço pré-configurado.

6. **Given** um atendente quer gravar áudio, **When** segura botão de microfone, **Then** grava e envia áudio como no WhatsApp nativo.

---

### User Story 8 - Controle de Janela de 24h e Templates (Priority: P1)

Como sistema, quero controlar a janela de 24h do WhatsApp e oferecer templates quando necessário, para evitar erros de envio e otimizar custos.

**Why this priority**: Crítico para compliance com WhatsApp e controle de custos.

**Acceptance Scenarios**:

1. **Given** uma conversa está dentro da janela de 24h, **When** atendente visualiza, **Then** vê indicador verde "Janela aberta: 14h restantes" e pode enviar mensagens livres.

2. **Given** a janela de 24h expirou, **When** atendente tenta enviar mensagem livre, **Then** sistema bloqueia e exibe: "Janela fechada. Selecione um template para reabrir."

3. **Given** a janela está fechada, **When** atendente seleciona um template, **Then** sistema envia o template e reabre janela de 24h.

4. **Given** atendente quer enviar template, **When** clica no botão de templates, **Then** vê lista de templates aprovados com preview e variáveis para preencher.

5. **Given** um template tem variáveis {{1}} {{2}}, **When** atendente seleciona, **Then** sistema pede para preencher cada variável antes de enviar.

---

### User Story 9 - Compliance LGPD (Priority: P2)

Como sistema, quero registrar consentimento e permitir exclusão de dados, para estar em conformidade com a LGPD.

**Why this priority**: Obrigatório para operação legal no Brasil.

**Acceptance Scenarios**:

1. **Given** um novo contato envia primeira mensagem, **When** sistema responde, **Then** inclui no fluxo inicial: "Ao continuar, você concorda com nossa política de privacidade [link]" e registra opt-in.

2. **Given** um contato solicita seus dados, **When** atendente processa, **Then** pode exportar todos os dados do contato em JSON/PDF.

3. **Given** um contato solicita exclusão de dados, **When** atendente confirma, **Then** sistema anonimiza: telefone→hash, nome→"Removido", mensagens→"[Conteúdo removido por solicitação]".

4. **Given** um administrador acessa contato, **When** visualiza, **Then** vê status de opt-in com data e fonte.

---

### User Story 10 - Notificações e Status de Leitura (Priority: P2)

Como atendente, quero ver quando o cliente leu minha mensagem e receber notificações de novas mensagens, para saber quando agir.

**Why this priority**: Melhora eficiência do atendimento.

**Acceptance Scenarios**:

1. **Given** uma mensagem foi enviada, **When** cliente recebe, **Then** aparece ✓ (enviado).

2. **Given** uma mensagem foi enviada, **When** cliente abre o WhatsApp, **Then** aparece ✓✓ (entregue).

3. **Given** uma mensagem foi enviada, **When** cliente lê, **Then** aparece ✓✓ azul (lido).

4. **Given** atendente está em outra aba, **When** nova mensagem chega em conversa atribuída, **Then** recebe notificação do browser.

5. **Given** atendente está offline, **When** nova mensagem chega, **Then** vê badge com contador ao retornar.

---

## Requirements

### Functional Requirements

**Atendimento Compartilhado:**
- **FR-023**: Sistema DEVE atualizar conversas em tempo real via WebSocket
- **FR-024**: Sistema DEVE permitir atribuição de conversa a atendente específico
- **FR-025**: Sistema DEVE mostrar indicador de "digitando" entre atendentes
- **FR-026**: Sistema DEVE liberar conversa automaticamente após timeout (30min)
- **FR-027**: Sistema DEVE permitir transferência de conversa entre atendentes

**Mídia:**
- **FR-028**: Sistema DEVE receber e exibir imagens (JPEG, PNG, WEBP)
- **FR-029**: Sistema DEVE receber e reproduzir áudios (OGG, MP3, AAC)
- **FR-030**: Sistema DEVE receber e disponibilizar documentos (PDF, DOC, XLS)
- **FR-031**: Sistema DEVE enviar imagens com caption opcional
- **FR-032**: Sistema DEVE enviar áudios gravados pelo browser
- **FR-033**: Sistema DEVE enviar localização pré-configurada
- **FR-034**: Sistema DEVE armazenar mídia em Object Storage (S3/MinIO)
- **FR-035**: Sistema DEVE gerar thumbnails para imagens

**Janela 24h e Templates:**
- **FR-036**: Sistema DEVE rastrear timestamp da última mensagem do cliente
- **FR-037**: Sistema DEVE calcular e exibir tempo restante da janela
- **FR-038**: Sistema DEVE bloquear mensagens livres fora da janela
- **FR-039**: Sistema DEVE manter catálogo de templates aprovados
- **FR-040**: Sistema DEVE permitir preenchimento de variáveis de template
- **FR-041**: Sistema DEVE categorizar mensagens (service/utility/marketing)

**Compliance LGPD:**
- **FR-042**: Sistema DEVE registrar opt-in com timestamp e fonte
- **FR-043**: Sistema DEVE permitir exportação de dados do contato
- **FR-044**: Sistema DEVE permitir anonimização de dados
- **FR-045**: Sistema DEVE criptografar dados sensíveis em repouso

**Notificações:**
- **FR-046**: Sistema DEVE receber webhooks de status (sent/delivered/read)
- **FR-047**: Sistema DEVE atualizar status das mensagens em tempo real
- **FR-048**: Sistema DEVE enviar Web Push notifications

### Key Entities (Novas/Modificadas)

- **Contato** (modificado): +opt_in_status, +opt_in_at, +opt_in_source, +anonimizado

- **Conversa** (modificado): +atendente_id, +atribuida_em, +window_expires_at, +billing_category

- **Mensagem** (modificado): +media_type, +media_url, +media_mime, +thumbnail_url, +template_name

- **Template**: name, category (utility/marketing/auth), status (approved/pending/rejected), body, variables[], language, last_synced_at

- **MediaFile**: id, message_id, original_url, storage_url, mime_type, size_bytes, thumbnail_url, created_at

---

## Technical Architecture (Baseado no Relatório)

### Gestão de Mídia

```
[WhatsApp Webhook]
    → [Worker: Download media via Graph API]
    → [Upload to MinIO/S3]
    → [Generate thumbnail if image]
    → [Save MediaFile record with storage_url]
    → [Update message.media_url]
```

### Janela de 24h (State Machine)

```
Estado: JANELA_ABERTA
  - last_customer_message_at < 24h
  - Pode enviar: texto, mídia, templates
  - Custo: GRATUITO (service conversation)

Estado: JANELA_FECHADA
  - last_customer_message_at >= 24h
  - Pode enviar: APENAS templates
  - Custo: Por categoria (utility $0.008, marketing $0.0625)

Transições:
  - Cliente envia msg → JANELA_ABERTA (24h)
  - Template enviado → JANELA_ABERTA (24h)
  - Timeout 24h → JANELA_FECHADA
```

### WebSocket para Real-Time

```
Eventos emitidos:
  - conversation:new_message
  - conversation:assigned
  - conversation:typing
  - conversation:status_update
  - message:status_change (sent→delivered→read)

Canais:
  - user:{user_id} - notificações pessoais
  - conversation:{conv_id} - atualizações da conversa
  - global - novas conversas não atribuídas
```

---

## Success Criteria

- **SC-008**: Mensagens aparecem no painel em < 1s após chegada no webhook
- **SC-009**: 100% das mídias recebidas são armazenadas e visualizáveis
- **SC-010**: Zero tentativas de envio fora da janela sem template
- **SC-011**: 100% dos contatos têm status de opt-in registrado
- **SC-012**: Atendentes veem status de leitura em < 2s após atualização

---

## Out of Scope (Esta Fase)

- Chatbot com IA/LLM para respostas automáticas avançadas
- Integração com Instagram/Facebook Messenger
- Relatórios de custos detalhados por categoria
- Múltiplos números de WhatsApp (multi-tenant)
- App mobile para atendentes
