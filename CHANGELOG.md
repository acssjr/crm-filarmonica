# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.3.0] - 2025-12-27

### Added
- **Módulo de Tags**: CRUD completo para organização e segmentação de contatos
- **Módulo de Templates**: Gerenciamento de modelos de mensagens WhatsApp
- **Módulo de Campanhas**: Sistema de envio em massa com agendamento
- **Módulo de Relatórios**: Dashboard de analytics com métricas e gráficos
- **Proteção contra Spam**: Rate limiting e controles para WhatsApp
- **Migrações Drizzle**: Sistema de migrações do banco de dados
- **Adaptadores de Canal**: Abstração para múltiplos canais de comunicação

### Changed
- Schema do banco de dados expandido com novas tabelas
- Integração de autenticação Clerk no middleware
- Páginas do frontend com funcionalidade CRUD completa
- Serviço de API centralizado com endpoints tipados

## [0.2.0] - 2025-12-26

### Added
- **Redesign Completo**: Nova interface com Untitled UI design system
- **Autenticação Clerk**: Substituição do sistema de auth customizado
- **Painel Admin**: Interface completa de administração

### Changed
- Migração de Docker para Supabase/Upstash
- Atualização do sistema de roteamento

### Removed
- Docker e docker-compose (migrado para serviços gerenciados)

## [0.1.0] - 2025-12-20

### Added
- **Fundação do Monorepo**: Estrutura npm workspaces
- **Backend Fastify**: API REST com validação Zod
- **Frontend React**: SPA com Vite e TailwindCSS
- **Tipos Compartilhados**: Package shared para types
- **WhatsApp Integration**: Webhook e processamento de mensagens
- **Journey Service**: Máquina de estados para coleta de dados
- **BullMQ Workers**: Processamento assíncrono de mensagens

### Technical
- Drizzle ORM para acesso ao banco
- PostgreSQL via Supabase
- Redis via Upstash
- TanStack Query para gerenciamento de estado

---

## Tipos de Mudanças

- `Added` para novas funcionalidades
- `Changed` para mudanças em funcionalidades existentes
- `Deprecated` para funcionalidades que serão removidas
- `Removed` para funcionalidades removidas
- `Fixed` para correções de bugs
- `Security` para vulnerabilidades

[Unreleased]: https://github.com/acssjr/crm-filarmonica/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/acssjr/crm-filarmonica/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/acssjr/crm-filarmonica/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/acssjr/crm-filarmonica/releases/tag/v0.1.0
