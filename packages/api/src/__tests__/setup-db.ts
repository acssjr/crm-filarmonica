/**
 * Setup para testes de integração com PGlite
 * Cria banco PostgreSQL in-memory para testes
 */

import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema.js'

export type TestDatabase = ReturnType<typeof drizzle<typeof schema>>

interface TestDatabaseResult {
  db: TestDatabase
  client: PGlite
  cleanup: () => Promise<void>
}

/**
 * Cria instância isolada do banco para testes.
 * Cria as tabelas necessárias manualmente (sem migrations).
 */
export async function createTestDatabase(): Promise<TestDatabaseResult> {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  // Criar enums
  await client.exec(`
    DO $$ BEGIN
      CREATE TYPE origem AS ENUM ('organico', 'campanha', 'indicacao');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE tag_cor AS ENUM ('gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE tipo_contato AS ENUM ('desconhecido', 'responsavel', 'interessado_direto');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE estado_jornada AS ENUM (
        'inicial', 'boas_vindas', 'coletando_nome', 'coletando_idade',
        'coletando_instrumento', 'verificando_saxofone', 'coletando_experiencia',
        'coletando_disponibilidade', 'incompativel', 'qualificado', 'atendimento_humano'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE canal AS ENUM ('whatsapp', 'instagram', 'messenger');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  // Criar tabela contatos
  await client.exec(`
    CREATE TABLE IF NOT EXISTS contatos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      telefone VARCHAR(20) NOT NULL UNIQUE,
      nome VARCHAR(200),
      tipo tipo_contato NOT NULL DEFAULT 'desconhecido',
      origem origem NOT NULL DEFAULT 'organico',
      origem_campanha VARCHAR(50),
      canal canal NOT NULL DEFAULT 'whatsapp',
      estado_jornada estado_jornada NOT NULL DEFAULT 'inicial',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Criar tabela tags
  await client.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome VARCHAR(50) NOT NULL UNIQUE,
      cor tag_cor NOT NULL DEFAULT 'gray',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Criar tabela contato_tags
  await client.exec(`
    CREATE TABLE IF NOT EXISTS contato_tags (
      contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (contato_id, tag_id)
    )
  `)

  return {
    db,
    client,
    cleanup: async () => {
      await client.close()
    },
  }
}

/**
 * Limpa todas as tabelas do banco de teste
 */
export async function clearTables(client: PGlite): Promise<void> {
  await client.exec(`
    TRUNCATE TABLE contato_tags CASCADE;
    TRUNCATE TABLE contatos CASCADE;
    TRUNCATE TABLE tags CASCADE;
  `)
}
