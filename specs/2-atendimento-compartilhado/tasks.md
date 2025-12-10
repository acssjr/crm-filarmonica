# Tasks: Atendimento Compartilhado e Mídia

**Input**: spec.md, relatório "Integração WhatsApp API com CRMs 2025"
**Prerequisites**: MVP completo (1-crm-omnichannel-mvp)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 9: Infraestrutura de Mídia (CRÍTICO - BLOQUEANTE)

**Purpose**: Storage e processamento de arquivos de mídia

### Object Storage

- [ ] T110 [US7] Setup MinIO container in docker-compose.yml (or configure S3)
- [ ] T111 [US7] Create storage client in packages/api/src/lib/storage.ts
- [ ] T112 [US7] Implement upload/download/presigned-url methods

### Media Processing

- [ ] T113 [US7] Create MediaFile entity in packages/api/src/db/schema.ts
- [ ] T114 [US7] Create media repository in packages/api/src/modules/media/media.repository.ts
- [ ] T115 [US7] Create media service with download-from-whatsapp logic in packages/api/src/modules/media/media.service.ts
- [ ] T116 [US7] Implement thumbnail generation for images (sharp library)
- [ ] T117 [US7] Update message schema: add media_type, media_url, media_mime, thumbnail_url

### WhatsApp Media Integration

- [ ] T118 [US7] Update webhook handler to detect media messages (image/audio/document/location)
- [ ] T119 [US7] Implement Graph API media download in packages/api/src/lib/whatsapp-client.ts
- [ ] T120 [US7] Create media processing job in packages/api/src/workers/media.worker.ts
- [ ] T121 [US7] Update message processor to queue media downloads

**Checkpoint**: Media receiving infrastructure complete

---

## Phase 10: Envio de Mídia pelo Painel

**Purpose**: Permitir atendentes enviarem mídia

### Backend

- [ ] T122 [US7] Create media upload endpoint (POST /api/media/upload) in packages/api/src/modules/media/media.routes.ts
- [ ] T123 [US7] Implement send-image via WhatsApp API in packages/api/src/lib/whatsapp-client.ts
- [ ] T124 [US7] Implement send-audio via WhatsApp API
- [ ] T125 [US7] Implement send-document via WhatsApp API
- [ ] T126 [US7] Implement send-location via WhatsApp API (pre-configured coordinates)
- [ ] T127 [US7] Update POST /conversations/:id/messages to handle media attachments

### Frontend

- [ ] T128 [P] [US7] Create MediaUploader component in packages/web/src/components/conversations/MediaUploader.tsx
- [ ] T129 [P] [US7] Create ImagePreview component with caption input
- [ ] T130 [P] [US7] Create AudioRecorder component (MediaRecorder API)
- [ ] T131 [P] [US7] Create LocationPicker component (sends Filarmônica address)
- [ ] T132 [US7] Create MediaMessage component for displaying received media in MessageThread
- [ ] T133 [US7] Add attachment button to MessageInput with dropdown (image/audio/document/location)

**Checkpoint**: Full media send/receive working

---

## Phase 11: WebSocket e Tempo Real

**Purpose**: Atualizações instantâneas no painel

### Backend WebSocket

- [ ] T134 [US6] Install and configure Socket.io in packages/api/src/server.ts
- [ ] T135 [US6] Create WebSocket authentication middleware (verify JWT from cookie)
- [ ] T136 [US6] Create event emitter service in packages/api/src/lib/realtime.ts
- [ ] T137 [US6] Emit 'conversation:new_message' when message saved
- [ ] T138 [US6] Emit 'message:status_change' when status webhook received

### Frontend WebSocket

- [ ] T139 [US6] Create WebSocket context in packages/web/src/contexts/SocketContext.tsx
- [ ] T140 [US6] Connect Socket.io client on auth success
- [ ] T141 [US6] Update ConversationList to receive new messages in real-time
- [ ] T142 [US6] Update MessageThread to append new messages without refresh
- [ ] T143 [US6] Show typing indicator when receiving 'user:typing' event

**Checkpoint**: Real-time updates working

---

## Phase 12: Atribuição de Conversas

**Purpose**: Permitir que atendentes assumam conversas

### Database Changes

- [ ] T144 [US6] Add atendente_id, atribuida_em columns to conversas table
- [ ] T145 [US6] Create migration for new columns

### Backend

- [ ] T146 [US6] Create assign conversation endpoint (POST /conversations/:id/assign)
- [ ] T147 [US6] Create unassign/release endpoint (POST /conversations/:id/release)
- [ ] T148 [US6] Create transfer endpoint (POST /conversations/:id/transfer)
- [ ] T149 [US6] Implement auto-release job (30min timeout) in packages/api/src/jobs/release-stale.job.ts
- [ ] T150 [US6] Emit 'conversation:assigned' event on assignment

### Frontend

- [ ] T151 [US6] Show "Assumir" button on unassigned conversations
- [ ] T152 [US6] Show "Atendido por {nome}" badge on assigned conversations
- [ ] T153 [US6] Show "Transferir" button when viewing own conversation
- [ ] T154 [US6] Filter conversations: "Minhas", "Não atribuídas", "Todas"

**Checkpoint**: Conversation assignment working

---

## Phase 13: Janela de 24h e Templates

**Purpose**: Controle de janela e templates do WhatsApp

### Database Changes

- [ ] T155 [US8] Add window_expires_at column to conversas
- [ ] T156 [US8] Create templates table (name, category, status, body, variables, language)
- [ ] T157 [US8] Add billing_category column to mensagens (service/utility/marketing)

### Backend - Janela

- [ ] T158 [US8] Update conversation service to calculate window_expires_at on customer message
- [ ] T159 [US8] Create window validation middleware in packages/api/src/modules/conversations/window.middleware.ts
- [ ] T160 [US8] Block free-form messages when window closed (return 400 with template requirement)
- [ ] T161 [US8] Create GET /conversations/:id/window-status endpoint

### Backend - Templates

- [ ] T162 [US8] Create template repository in packages/api/src/modules/templates/template.repository.ts
- [ ] T163 [US8] Create GET /templates endpoint to list approved templates
- [ ] T164 [US8] Create POST /conversations/:id/messages/template endpoint to send template
- [ ] T165 [US8] Implement template variable substitution
- [ ] T166 [US8] Sync templates from WhatsApp API (manual trigger or scheduled)

### Frontend - Janela

- [ ] T167 [US8] Create WindowStatus component showing "Janela aberta: Xh restantes" or "Janela fechada"
- [ ] T168 [US8] Disable message input when window closed, show "Selecione um template"
- [ ] T169 [US8] Add visual countdown/indicator to WindowStatus

### Frontend - Templates

- [ ] T170 [US8] Create TemplateSelector modal in packages/web/src/components/conversations/TemplateSelector.tsx
- [ ] T171 [US8] Show template preview with variable placeholders
- [ ] T172 [US8] Create TemplateVariableForm for filling {{1}}, {{2}} etc
- [ ] T173 [US8] Add "Enviar Template" button to MessageInput (visible when window closed)

**Checkpoint**: Window control and templates working

---

## Phase 14: Compliance LGPD

**Purpose**: Registro de consentimento e direitos do titular

### Database Changes

- [ ] T174 [US9] Add opt_in_status, opt_in_at, opt_in_source columns to contatos
- [ ] T175 [US9] Add anonimizado boolean column to contatos

### Backend

- [ ] T176 [US9] Update contact creation to set opt_in on first message
- [ ] T177 [US9] Create GET /contacts/:id/export endpoint (returns all data as JSON)
- [ ] T178 [US9] Create POST /contacts/:id/anonymize endpoint
- [ ] T179 [US9] Implement anonymization logic: hash phone, clear PII, mark messages
- [ ] T180 [US9] Add privacy policy link to welcome message template

### Frontend

- [ ] T181 [US9] Show opt-in status badge on contact detail
- [ ] T182 [US9] Add "Exportar Dados" button on contact detail
- [ ] T183 [US9] Add "Anonimizar" button with confirmation modal
- [ ] T184 [US9] Show "[Dados removidos]" for anonymized contacts

**Checkpoint**: LGPD compliance features complete

---

## Phase 15: Status de Mensagem e Notificações

**Purpose**: Ticks de leitura e notificações push

### Backend - Status

- [ ] T185 [US10] Update webhook to process status updates (sent/delivered/read)
- [ ] T186 [US10] Update message status in database on webhook
- [ ] T187 [US10] Emit 'message:status_change' via WebSocket

### Frontend - Status

- [ ] T188 [US10] Create MessageStatus component (✓, ✓✓, ✓✓ blue)
- [ ] T189 [US10] Update MessageBubble to show status for outbound messages
- [ ] T190 [US10] Animate status transitions (fade in ticks)

### Web Push Notifications

- [ ] T191 [US10] Setup Web Push (VAPID keys) in packages/api/src/lib/push.ts
- [ ] T192 [US10] Create push subscription endpoint (POST /push/subscribe)
- [ ] T193 [US10] Store push subscriptions in database
- [ ] T194 [US10] Send push notification on new message in assigned conversation
- [ ] T195 [US10] Create service worker for push in packages/web/public/sw.js
- [ ] T196 [US10] Request notification permission on login
- [ ] T197 [US10] Show unread badge counter in browser tab title

**Checkpoint**: Status and notifications complete

---

## Dependencies

### Phase Dependencies

- **Phase 9 (Mídia)**: Can start immediately after MVP
- **Phase 10 (Envio Mídia)**: Depends on Phase 9
- **Phase 11 (WebSocket)**: Can start in parallel with Phase 9
- **Phase 12 (Atribuição)**: Depends on Phase 11
- **Phase 13 (Janela/Templates)**: Can start in parallel with Phase 10
- **Phase 14 (LGPD)**: Can start in parallel with Phase 13
- **Phase 15 (Status)**: Depends on Phase 11

### Recommended Order

1. **Phase 9 + Phase 11** (parallel) - Mídia básica + WebSocket
2. **Phase 10 + Phase 12** (parallel) - Envio mídia + Atribuição
3. **Phase 13** - Janela e Templates (crítico para produção)
4. **Phase 14 + Phase 15** (parallel) - LGPD + Notificações

---

## Notes

- **MinIO**: Para desenvolvimento local, usar MinIO. Em produção, migrar para S3.
- **Socket.io**: Preferido sobre raw WebSocket por reconexão automática e rooms.
- **Templates**: Devem ser criados no Meta Business Manager e sincronizados.
- **LGPD**: Anonimização é irreversível. Implementar confirmação dupla.
- **Custos**: Mensagens de service (dentro da janela) são gratuitas. Priorizar.
