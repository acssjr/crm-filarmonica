# Tasks: CRM Omnichannel MVP

**Input**: Design documents from `/specs/1-crm-omnichannel-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Includes exact file paths based on monorepo structure

## Path Conventions (Monorepo)

- **Backend**: `packages/api/src/`
- **Frontend**: `packages/web/src/`
- **Shared types**: `packages/shared/src/`
- **Docker**: `docker/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, monorepo structure, dependencies

- [ ] T001 Create monorepo structure with npm workspaces (packages/api, packages/web, packages/shared)
- [ ] T002 Initialize packages/api with Fastify, TypeScript 5.x, and dependencies (drizzle-orm, bullmq, bcrypt, jsonwebtoken)
- [ ] T003 [P] Initialize packages/web with Vite, React 18, TailwindCSS, TanStack Query
- [ ] T004 [P] Initialize packages/shared with TypeScript for shared types
- [ ] T005 [P] Create docker/docker-compose.yml with PostgreSQL 16 and Redis services
- [ ] T006 [P] Create .env.example with all required environment variables (DATABASE_URL, REDIS_URL, WHATSAPP_*, JWT_*)
- [ ] T007 [P] Configure ESLint and Prettier for the monorepo
- [ ] T008 [P] Create .gitignore with Node.js, TypeScript, and environment patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM

- [ ] T009 Create Drizzle schema with all entities in packages/api/src/db/schema.ts (Administrador, Contato, Interessado, Conversa, Mensagem, Evento)
- [ ] T010 Create database migration for initial schema in packages/api/src/db/migrations/
- [ ] T011 Create seed script for 3 administrators in packages/api/src/db/seed.ts

### API Framework

- [ ] T012 Setup Fastify server with plugins in packages/api/src/server.ts
- [ ] T013 [P] Configure CORS, cookie parser, and JSON body parser in packages/api/src/plugins/
- [ ] T014 [P] Create error handling middleware in packages/api/src/plugins/error-handler.ts
- [ ] T015 [P] Create request logging middleware in packages/api/src/plugins/logger.ts

### Authentication

- [ ] T016 Implement JWT utilities (sign, verify, refresh) in packages/api/src/lib/jwt.ts
- [ ] T017 Implement password hashing utilities in packages/api/src/lib/password.ts
- [ ] T018 Create auth middleware for protected routes in packages/api/src/modules/auth/auth.middleware.ts

### Shared Types

- [ ] T019 [P] Define TypeScript types for all entities in packages/shared/src/types/entities.ts
- [ ] T020 [P] Define API request/response types in packages/shared/src/types/api.ts
- [ ] T021 [P] Define enums (Origem, TipoContato, EstadoJornada, etc.) in packages/shared/src/types/enums.ts

### Queue Infrastructure

- [ ] T022 Setup BullMQ with Redis connection in packages/api/src/lib/queue.ts
- [ ] T023 Create base worker configuration in packages/api/src/workers/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Resposta Automatica Instantanea (Priority: P1) MVP

**Goal**: Responder mensagens WhatsApp automaticamente em menos de 5 segundos com boas-vindas, endereco e horarios

**Independent Test**: Enviar mensagem ao WhatsApp e verificar resposta automatica < 5s com local e horarios

### Implementation for User Story 1

#### WhatsApp Integration

- [ ] T024 [US1] Create WhatsApp client for sending messages in packages/api/src/lib/whatsapp-client.ts
- [ ] T025 [US1] Create webhook verification handler (GET) in packages/api/src/modules/whatsapp/webhook.routes.ts
- [ ] T026 [US1] Create webhook receiver handler (POST) in packages/api/src/modules/whatsapp/webhook.routes.ts
- [ ] T027 [US1] Create WhatsApp message queue (whatsapp:incoming) in packages/api/src/modules/whatsapp/message.queue.ts

#### Intent Recognition

- [ ] T028 [US1] Implement keyword-based intent matcher in packages/api/src/lib/intent-matcher.ts
- [ ] T029 [US1] Define intent keywords (saudacao, localizacao, horario, funcionamento) in packages/api/src/lib/intents.ts
- [ ] T030 [US1] Create message templates (boas-vindas, endereco, horarios, funcionamento) in packages/api/src/lib/templates.ts

#### Message Processing Worker

- [ ] T031 [US1] Create WhatsApp message worker in packages/api/src/workers/whatsapp.worker.ts
- [ ] T032 [US1] Implement intent detection and response selection in packages/api/src/modules/whatsapp/processor.ts
- [ ] T033 [US1] Implement message sending with retry logic in packages/api/src/modules/whatsapp/sender.ts

#### Edge Cases

- [ ] T034 [US1] Handle non-text messages (audio, image) with gentle info response in packages/api/src/modules/whatsapp/processor.ts
- [ ] T035 [US1] Implement spam protection (no response after 3 contextless messages) in packages/api/src/modules/whatsapp/processor.ts

**Checkpoint**: User Story 1 complete - WhatsApp responds automatically in < 5s

---

## Phase 4: User Story 2 - Cadastro de Contatos com Origem (Priority: P1)

**Goal**: Cadastrar automaticamente todo contato com origem rastreada (organico, campanha, indicacao)

**Independent Test**: Verificar se nova conversa cria registro de contato com origem correta

### Implementation for User Story 2

#### Contact Management

- [ ] T036 [US2] Create contact repository in packages/api/src/modules/contacts/contact.repository.ts
- [ ] T037 [US2] Implement find-or-create contact by phone in packages/api/src/modules/contacts/contact.service.ts
- [ ] T038 [US2] Parse campaign parameter from WhatsApp link (wa.me/?text=CAMP01) in packages/api/src/modules/whatsapp/parser.ts

#### Conversation Management

- [ ] T039 [US2] Create conversation repository in packages/api/src/modules/conversations/conversation.repository.ts
- [ ] T040 [US2] Implement create/get active conversation in packages/api/src/modules/conversations/conversation.service.ts
- [ ] T041 [US2] Implement 24h rule for new conversation creation in packages/api/src/modules/conversations/conversation.service.ts

#### Message Persistence

- [ ] T042 [US2] Create message repository in packages/api/src/modules/messages/message.repository.ts
- [ ] T043 [US2] Save incoming and outgoing messages in packages/api/src/modules/messages/message.service.ts
- [ ] T044 [US2] Implement WhatsApp message ID deduplication in packages/api/src/modules/messages/message.service.ts

#### Event Logging

- [ ] T045 [P] [US2] Create event repository in packages/api/src/modules/events/event.repository.ts
- [ ] T046 [P] [US2] Log first contact, message received, message sent events in packages/api/src/modules/events/event.service.ts

**Checkpoint**: User Story 2 complete - Contacts auto-registered with origin tracking

---

## Phase 5: User Story 3 - Painel Administrativo Basico (Priority: P2)

**Goal**: Visualizar conversas e contatos em painel web com dashboard e chat

**Independent Test**: Acessar painel, ver lista de contatos, abrir conversa e enviar mensagem

### Backend API for Admin Panel

#### Auth Endpoints

- [ ] T047 [US3] Implement login endpoint (POST /auth/login) in packages/api/src/modules/auth/auth.routes.ts
- [ ] T048 [US3] Implement logout endpoint (POST /auth/logout) in packages/api/src/modules/auth/auth.routes.ts
- [ ] T049 [US3] Implement me endpoint (GET /auth/me) in packages/api/src/modules/auth/auth.routes.ts

#### Dashboard Endpoints

- [ ] T050 [US3] Implement dashboard stats endpoint (GET /dashboard/stats) in packages/api/src/modules/dashboard/dashboard.routes.ts
- [ ] T051 [US3] Create dashboard service with aggregation queries in packages/api/src/modules/dashboard/dashboard.service.ts

#### Contact Endpoints

- [ ] T052 [US3] Implement list contacts endpoint (GET /contacts) with pagination and filters in packages/api/src/modules/contacts/contact.routes.ts
- [ ] T053 [US3] Implement get contact detail endpoint (GET /contacts/:id) in packages/api/src/modules/contacts/contact.routes.ts
- [ ] T054 [US3] Implement update contact endpoint (PATCH /contacts/:id) in packages/api/src/modules/contacts/contact.routes.ts

#### Conversation Endpoints

- [ ] T055 [US3] Implement list active conversations endpoint (GET /conversations) in packages/api/src/modules/conversations/conversation.routes.ts
- [ ] T056 [US3] Implement get conversation with messages endpoint (GET /conversations/:id) in packages/api/src/modules/conversations/conversation.routes.ts
- [ ] T057 [US3] Implement list contact conversations endpoint (GET /contacts/:id/conversations) in packages/api/src/modules/conversations/conversation.routes.ts

#### Message Endpoints

- [ ] T058 [US3] Implement list messages endpoint (GET /conversations/:id/messages) with pagination in packages/api/src/modules/messages/message.routes.ts
- [ ] T059 [US3] Implement send manual message endpoint (POST /conversations/:id/messages) in packages/api/src/modules/messages/message.routes.ts

### Frontend Admin Panel

#### Setup & Layout

- [ ] T060 [US3] Setup React Router with protected routes in packages/web/src/main.tsx
- [ ] T061 [US3] Create auth context and provider in packages/web/src/contexts/AuthContext.tsx
- [ ] T062 [US3] Create API client with cookie auth in packages/web/src/services/api.ts
- [ ] T063 [US3] Create base layout with sidebar navigation in packages/web/src/components/Layout.tsx

#### Auth Pages

- [ ] T064 [P] [US3] Create login page in packages/web/src/pages/Login.tsx
- [ ] T065 [P] [US3] Create login form component in packages/web/src/components/auth/LoginForm.tsx

#### Dashboard

- [ ] T066 [US3] Create dashboard page in packages/web/src/pages/Dashboard.tsx
- [ ] T067 [P] [US3] Create stats cards component (total contatos, conversas ativas, novos hoje) in packages/web/src/components/dashboard/StatsCards.tsx
- [ ] T068 [P] [US3] Create origin chart component in packages/web/src/components/dashboard/OriginChart.tsx
- [ ] T069 [P] [US3] Create journey state chart component in packages/web/src/components/dashboard/JourneyChart.tsx

#### Contacts

- [ ] T070 [US3] Create contacts list page in packages/web/src/pages/Contacts.tsx
- [ ] T071 [P] [US3] Create contact table component with filters in packages/web/src/components/contacts/ContactTable.tsx
- [ ] T072 [P] [US3] Create contact detail drawer component in packages/web/src/components/contacts/ContactDetail.tsx

#### Conversations

- [ ] T073 [US3] Create conversation page in packages/web/src/pages/Conversation.tsx
- [ ] T074 [P] [US3] Create conversation list sidebar in packages/web/src/components/conversations/ConversationList.tsx
- [ ] T075 [P] [US3] Create message thread component in packages/web/src/components/conversations/MessageThread.tsx
- [ ] T076 [P] [US3] Create message input component in packages/web/src/components/conversations/MessageInput.tsx

**Checkpoint**: User Story 3 complete - Admin panel functional with login, dashboard, contacts, and chat

---

## Phase 6: User Story 4 - Coleta de Informacoes do Interessado (Priority: P2)

**Goal**: Coletar nome, idade, instrumento, experiencia de forma conversacional e gerar ficha

**Independent Test**: Completar fluxo conversacional e verificar ficha gerada

### Implementation for User Story 4

#### State Machine

- [ ] T077 [US4] Implement journey state machine in packages/api/src/modules/journey/state-machine.ts
- [ ] T078 [US4] Define state transitions and triggers in packages/api/src/modules/journey/transitions.ts
- [ ] T079 [US4] Create journey handler for each state in packages/api/src/modules/journey/handlers/

#### Collection Prompts

- [ ] T080 [P] [US4] Create name collection handler (coletando_nome) in packages/api/src/modules/journey/handlers/name.handler.ts
- [ ] T081 [P] [US4] Create age collection handler (coletando_idade) in packages/api/src/modules/journey/handlers/age.handler.ts
- [ ] T082 [P] [US4] Create instrument collection handler (coletando_instrumento) in packages/api/src/modules/journey/handlers/instrument.handler.ts
- [ ] T083 [P] [US4] Create experience collection handler (coletando_experiencia) in packages/api/src/modules/journey/handlers/experience.handler.ts

#### Saxophone Restriction

- [ ] T084 [US4] Create saxophone alto handler (verificando_saxofone) with gentle explanation in packages/api/src/modules/journey/handlers/saxophone.handler.ts
- [ ] T085 [US4] Define alternative instrument suggestions (sax baritono, sax tenor, clarinete, graves) in packages/api/src/lib/instruments.ts

#### Prospect Management

- [ ] T086 [US4] Create prospect repository in packages/api/src/modules/prospects/prospect.repository.ts
- [ ] T087 [US4] Implement create prospect from collected data in packages/api/src/modules/prospects/prospect.service.ts
- [ ] T088 [US4] Log ficha_gerada event when prospect created in packages/api/src/modules/prospects/prospect.service.ts

#### Admin Prospect View

- [ ] T089 [US4] Implement list prospects endpoint (GET /prospects) in packages/api/src/modules/prospects/prospect.routes.ts
- [ ] T090 [US4] Implement get prospect detail endpoint (GET /prospects/:id) in packages/api/src/modules/prospects/prospect.routes.ts
- [ ] T091 [US4] Create prospect list page in packages/web/src/pages/Prospects.tsx
- [ ] T092 [P] [US4] Create prospect card component in packages/web/src/components/prospects/ProspectCard.tsx
- [ ] T093 [P] [US4] Create prospect detail modal in packages/web/src/components/prospects/ProspectDetail.tsx

**Checkpoint**: User Story 4 complete - Conversational data collection with prospect cards

---

## Phase 7: User Story 5 - Verificacao de Disponibilidade de Horario (Priority: P3)

**Goal**: Verificar disponibilidade seg/qua/sex 15h-17h cedo na conversa

**Independent Test**: Responder que nao tem disponibilidade e verificar marcacao como incompativel

### Implementation for User Story 5

- [ ] T094 [US5] Create availability collection handler (coletando_disponibilidade) in packages/api/src/modules/journey/handlers/availability.handler.ts
- [ ] T095 [US5] Implement compatible/incompatible transition logic in packages/api/src/modules/journey/transitions.ts
- [ ] T096 [US5] Create incompatible handler with graceful message in packages/api/src/modules/journey/handlers/incompatible.handler.ts
- [ ] T097 [US5] Log horario_incompativel event in packages/api/src/modules/events/event.service.ts
- [ ] T098 [US5] Add compatibility filter to prospects list in packages/web/src/pages/Prospects.tsx

**Checkpoint**: User Story 5 complete - Availability verification with incompatible marking

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Docker & Deployment

- [ ] T099 [P] Create docker/api.Dockerfile for production build
- [ ] T100 [P] Create docker/web.Dockerfile for production build
- [ ] T101 [P] Create docker/docker-compose.prod.yml with nginx reverse proxy
- [ ] T102 Add npm scripts for db:migrate, db:seed, build, start in package.json

### Validation & Security

- [ ] T103 Add Zod validation schemas for all API endpoints in packages/api/src/modules/*/schemas.ts
- [ ] T104 Implement rate limiting on webhook endpoint in packages/api/src/plugins/rate-limit.ts
- [ ] T105 Add request ID tracking for debugging in packages/api/src/plugins/request-id.ts

### Monitoring

- [ ] T106 [P] Add health check endpoint (GET /health) in packages/api/src/server.ts
- [ ] T107 [P] Add queue status endpoint for monitoring in packages/api/src/modules/admin/queue.routes.ts

### Documentation

- [ ] T108 [P] Validate quickstart.md steps work end-to-end
- [ ] T109 [P] Add API documentation comments for OpenAPI generation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - WhatsApp webhook and response
- **User Story 2 (P1)**: Can start after Foundational - Contact persistence (integrates with US1 worker)
- **User Story 3 (P2)**: Can start after Foundational - Admin panel (uses US1+US2 data)
- **User Story 4 (P2)**: Depends on US1+US2 - Conversational flow with state machine
- **User Story 5 (P3)**: Depends on US4 - Adds availability check to journey

### Within Each User Story

- Models/repositories before services
- Services before routes/endpoints
- Backend before frontend components
- Core implementation before integrations

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Within US3: Backend API endpoints can parallel with unrelated frontend components
- Within US4: All state handlers marked [P] can run in parallel
- US1 and US2 can mostly be developed in parallel (shared worker integration point)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T009-T011 (database) complete:
# Launch in parallel:
Task: T013 Configure CORS and plugins
Task: T014 Create error handling middleware
Task: T015 Create logging middleware
Task: T019 Define entity types
Task: T020 Define API types
Task: T021 Define enums
```

## Parallel Example: User Story 3 Frontend

```bash
# After T060-T063 (frontend setup) complete:
# Launch in parallel:
Task: T064 Create login page
Task: T065 Create login form component

# After dashboard page (T066) created:
Task: T067 Create stats cards
Task: T068 Create origin chart
Task: T069 Create journey chart
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (WhatsApp auto-response)
4. Complete Phase 4: User Story 2 (Contact tracking)
5. **STOP and VALIDATE**: Test WhatsApp integration end-to-end
6. Deploy MVP

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 + US2 -> WhatsApp responding + contacts tracked (MVP!)
3. Add US3 -> Admin panel to view and manage (First complete product)
4. Add US4 -> Conversational data collection (Enhanced CRM)
5. Add US5 -> Availability filtering (Full feature set)
6. Polish -> Production ready

---

## Notes

- **SLA**: WhatsApp response MUST be < 5 seconds (FR-004)
- **Queue**: BullMQ for async processing, webhook responds 200 immediately
- **State Machine**: Journey states drive conversational flow
- **Graves Priority**: Suggest tuba, bombardino, trombone, sax baritono/tenor
- **Sax Alto**: Explain restriction gently, offer alternatives
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
