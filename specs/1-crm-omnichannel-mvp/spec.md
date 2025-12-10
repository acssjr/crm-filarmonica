# Feature Specification: CRM Omnichannel MVP

**Feature Branch**: `1-crm-omnichannel-mvp`
**Created**: 2025-12-09
**Status**: Draft
**Input**: CRM + Plataforma Omnichannel proprietária para Sociedade Filarmônica 25 de Março - MVP focado em WhatsApp, resposta automática, cadastro de contatos e painel administrativo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resposta Automática Instantânea (Priority: P1)

Como pai/mãe interessado em matricular meu filho na escolinha de música, quero receber uma resposta imediata quando entro em contato pelo WhatsApp, para que eu saiba que a Filarmônica ainda funciona e onde fica.

**Why this priority**: Resolve o problema mais crítico identificado - demora nas respostas que causa desistência. Cada mensagem não respondida é um potencial aluno perdido.

**Independent Test**: Pode ser testado enviando uma mensagem ao WhatsApp e verificando se a resposta automática chega em menos de 5 segundos com local e horários.

**Acceptance Scenarios**:

1. **Given** uma pessoa envia "Olá" ou qualquer mensagem inicial, **When** o sistema recebe a mensagem, **Then** responde automaticamente em menos de 5 segundos com mensagem de boas-vindas contendo: confirmação de funcionamento, endereço, horários das aulas (seg/qua/sex 15h-17h), e próximos passos.

2. **Given** uma pessoa pergunta "Onde fica?", **When** o sistema identifica a intenção, **Then** responde com endereço completo e link do Google Maps.

3. **Given** uma pessoa pergunta "Qual o horário?", **When** o sistema identifica a intenção, **Then** responde com os horários das aulas e ensaios.

4. **Given** uma pessoa pergunta "A banda ainda funciona?", **When** o sistema identifica a intenção, **Then** responde confirmando funcionamento, com breve histórico (157 anos) e convite para conhecer.

---

### User Story 2 - Cadastro de Contatos com Origem (Priority: P1)

Como administrador do sistema, quero que todo contato seja automaticamente cadastrado com sua origem rastreada, para que eu possa medir a efetividade de campanhas futuras.

**Why this priority**: Base fundamental do CRM - sem cadastro não há gestão de relacionamento. Rastreamento de origem prepara para investimento em ads.

**Independent Test**: Pode ser testado verificando se cada nova conversa cria um registro de contato com origem correta (orgânico, campanha, indicação).

**Acceptance Scenarios**:

1. **Given** uma nova mensagem chega de um número desconhecido, **When** o sistema processa a mensagem, **Then** cria automaticamente um registro de contato com: telefone, canal (WhatsApp), origem (orgânico por padrão), data/hora do primeiro contato.

2. **Given** um contato existente envia nova mensagem, **When** o sistema processa a mensagem, **Then** associa à conversa existente sem duplicar o contato.

3. **Given** a mensagem vem de um link com parâmetro de campanha (ex: wa.me/...?text=CAMP01), **When** o sistema processa, **Then** registra a origem como a campanha específica.

---

### User Story 3 - Painel Administrativo Básico (Priority: P2)

Como administrador (Antonio, Isabelle ou Maestro), quero visualizar todas as conversas e contatos em um painel web, para gerenciar o atendimento de forma centralizada.

**Why this priority**: Permite visibilidade e controle sobre os contatos. Sem painel, a automação funcionaria mas não haveria gestão humana.

**Independent Test**: Pode ser testado acessando o painel, visualizando lista de contatos e abrindo uma conversa específica.

**Acceptance Scenarios**:

1. **Given** um administrador acessa o painel, **When** faz login, **Then** visualiza dashboard com: total de contatos, conversas ativas, novos contatos hoje.

2. **Given** um administrador está no painel, **When** clica em "Contatos", **Then** vê lista de todos os contatos com: nome, telefone, origem, estado da jornada, data do último contato.

3. **Given** um administrador visualiza um contato, **When** clica nele, **Then** vê histórico completo de mensagens trocadas.

4. **Given** um administrador está em uma conversa, **When** digita uma resposta, **Then** a mensagem é enviada ao contato pelo WhatsApp.

---

### User Story 4 - Coleta de Informações do Interessado (Priority: P2)

Como sistema, quero coletar informações básicas do interessado de forma conversacional, para gerar uma ficha resumo que o Maestro possa consultar.

**Why this priority**: Protege o Maestro de perguntas repetitivas e garante que ele receba alunos qualificados com informações relevantes.

**Independent Test**: Pode ser testado completando o fluxo conversacional e verificando se a ficha do aluno é gerada corretamente.

**Acceptance Scenarios**:

1. **Given** um contato demonstra interesse em matrícula, **When** o sistema inicia coleta de informações, **Then** pergunta: nome do interessado, idade, instrumento desejado (sugerindo graves), experiência musical prévia.

2. **Given** o contato informou os dados, **When** sistema processa as respostas, **Then** gera uma ficha resumo vinculada ao contato.

3. **Given** o contato escolhe saxofone alto, **When** sistema processa, **Then** explica gentilmente a restrição e sugere alternativas (outros saxofones, clarinete, instrumentos de graves).

4. **Given** um administrador acessa a ficha, **When** visualiza, **Then** vê: nome, idade, instrumento, experiência, expectativas, disponibilidade de horário, data de interesse.

---

### User Story 5 - Verificação de Disponibilidade de Horário (Priority: P3)

Como sistema, quero verificar cedo na conversa se o interessado tem disponibilidade no horário das aulas, para evitar frustração posterior.

**Why this priority**: Evita que contatos incompatíveis avancem no processo e descubram a incompatibilidade tarde demais.

**Independent Test**: Pode ser testado respondendo que não tem disponibilidade e verificando se o sistema informa corretamente.

**Acceptance Scenarios**:

1. **Given** um contato demonstra interesse, **When** sistema coleta informações, **Then** pergunta se tem disponibilidade seg/qua/sex das 15h às 17h.

2. **Given** contato confirma disponibilidade, **When** sistema processa, **Then** continua o fluxo normalmente e marca como compatível.

3. **Given** contato informa que não tem disponibilidade, **When** sistema processa, **Then** agradece o interesse, informa que pode entrar em contato se horários mudarem, e marca como incompatível.

---

### Edge Cases

- O que acontece quando a API do WhatsApp está fora do ar? Sistema deve registrar mensagens pendentes e processar quando voltar.
- Como o sistema lida com mensagens de áudio ou imagem? Informa gentilmente que só processa texto por enquanto.
- O que acontece se o mesmo número ligar de canais diferentes? No MVP (só WhatsApp), não se aplica.
- Como tratar spam ou mensagens inadequadas? Não responde automaticamente após 3 mensagens sem contexto.

## Requirements *(mandatory)*

### Functional Requirements

**Integração WhatsApp:**
- **FR-001**: Sistema DEVE receber mensagens do WhatsApp Business API em tempo real
- **FR-002**: Sistema DEVE enviar mensagens de resposta pelo WhatsApp Business API
- **FR-003**: Sistema DEVE processar mensagens de texto (áudio/imagem informam limitação)

**Resposta Automática:**
- **FR-004**: Sistema DEVE responder mensagens em menos de 5 segundos
- **FR-005**: Sistema DEVE identificar intenções básicas: saudação, localização, horários, funcionamento
- **FR-006**: Sistema DEVE usar templates de mensagem configuráveis e humanizados
- **FR-007**: Sistema NUNCA deve enviar mensagens com tom robótico ou frio

**Gestão de Contatos:**
- **FR-008**: Sistema DEVE criar registro de contato automaticamente na primeira mensagem
- **FR-009**: Sistema DEVE identificar contatos existentes pelo número de telefone
- **FR-010**: Sistema DEVE registrar origem do contato (orgânico, campanha, indicação)
- **FR-011**: Sistema DEVE registrar estado da jornada do contato

**Coleta de Informações:**
- **FR-012**: Sistema DEVE coletar: nome do interessado, idade, instrumento desejado, experiência
- **FR-013**: Sistema DEVE sugerir instrumentos de graves como opção prioritária
- **FR-014**: Sistema DEVE explicar restrição do saxofone alto quando selecionado
- **FR-015**: Sistema DEVE verificar disponibilidade de horário (seg/qua/sex 15h-17h)
- **FR-016**: Sistema DEVE gerar ficha resumo do interessado

**Painel Administrativo:**
- **FR-017**: Sistema DEVE autenticar administradores (Antonio, Isabelle, Maestro)
- **FR-018**: Sistema DEVE exibir dashboard com métricas básicas
- **FR-019**: Sistema DEVE listar todos os contatos com filtros e busca
- **FR-020**: Sistema DEVE exibir histórico de conversas por contato
- **FR-021**: Sistema DEVE permitir envio de mensagens manuais pelo painel
- **FR-022**: Sistema DEVE exibir ficha resumo do interessado

### Key Entities

- **Contato**: Pessoa que entra em contato (pai/mãe ou interessado direto). Atributos: nome, telefone, tipo (responsável/interessado_direto), origem, canal, estado_jornada, timestamps.

- **Interessado**: Pessoa que vai estudar (pode ser filho do contato). Atributos: nome, idade, instrumento_desejado, experiencia_musical, expectativas, disponibilidade_horario, contato_responsavel.

- **Conversa**: Agrupa mensagens de um contato. Atributos: contato, canal, status (ativa/encerrada), timestamps.

- **Mensagem**: Cada mensagem trocada. Atributos: conversa, direcao (entrada/saida), conteudo, tipo (texto/automatica/manual), enviado_por, timestamp.

- **Administrador**: Usuário do painel. Atributos: nome, email, senha_hash.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das mensagens recebem resposta automática em menos de 5 segundos
- **SC-002**: 100% dos novos contatos são cadastrados automaticamente com origem rastreada
- **SC-003**: Administradores conseguem visualizar e responder conversas em menos de 1 minuto após acesso
- **SC-004**: 90% dos contatos que demonstram interesse têm ficha resumo gerada
- **SC-005**: Tempo médio para responder perguntas sobre local e horário reduzido de horas para segundos
- **SC-006**: Zero mensagens perdidas ou não registradas no sistema
- **SC-007**: Maestro consegue visualizar ficha do aluno antes da primeira aula sem precisar perguntar informações básicas

## Assumptions

- WhatsApp Business API estará configurado e funcional
- Domínio e hospedagem estarão disponíveis para o painel web
- Os 3 administradores terão acesso a dispositivos com internet
- Horário das aulas permanecerá fixo (seg/qua/sex 15h-17h) durante o MVP
- Não haverá necessidade de integração com outros sistemas no MVP

## Out of Scope (MVP)

- Integração com Instagram e Facebook (V1)
- Engajamento automatizado para lista de espera (V2)
- Gestão de turmas e sazonalidade (V2)
- Relatórios para Ads e ROI (V2)
- Notificações push
- App mobile
