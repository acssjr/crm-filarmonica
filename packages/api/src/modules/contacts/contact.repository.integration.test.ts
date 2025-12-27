/**
 * Testes de integração para Contact Repository com PGlite
 * Testa: operações reais de banco de dados
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq, desc, like, or, sql, and } from 'drizzle-orm'
import * as schema from '../../db/schema.js'

// Criar tabelas e tipos
async function setupDatabase(client: PGlite) {
  await client.exec(`
    DO $$ BEGIN
      CREATE TYPE origem AS ENUM ('organico', 'campanha', 'indicacao');
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
    );
  `)
}

describe('Contact Repository Integration', () => {
  let client: PGlite
  let db: ReturnType<typeof drizzle<typeof schema>>

  beforeAll(async () => {
    client = new PGlite()
    db = drizzle(client, { schema })
    await setupDatabase(client)
  })

  afterAll(async () => {
    await client.close()
  })

  beforeEach(async () => {
    await client.exec('TRUNCATE TABLE contatos CASCADE')
  })

  describe('insert', () => {
    it('deve inserir contato no banco', async () => {
      const [inserted] = await db
        .insert(schema.contatos)
        .values({
          telefone: '+5575999123456',
          nome: 'João Silva',
          origem: 'organico',
          canal: 'whatsapp',
          estadoJornada: 'inicial',
        })
        .returning()

      expect(inserted.id).toBeDefined()
      expect(inserted.telefone).toBe('+5575999123456')
      expect(inserted.nome).toBe('João Silva')
    })

    it('deve gerar UUID automaticamente', async () => {
      const [inserted] = await db
        .insert(schema.contatos)
        .values({ telefone: '+5575999000001' })
        .returning()

      expect(inserted.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('deve usar valores padrão', async () => {
      const [inserted] = await db
        .insert(schema.contatos)
        .values({ telefone: '+5575999000002' })
        .returning()

      expect(inserted.tipo).toBe('desconhecido')
      expect(inserted.origem).toBe('organico')
      expect(inserted.canal).toBe('whatsapp')
      expect(inserted.estadoJornada).toBe('inicial')
    })

    it('deve lançar erro para telefone duplicado', async () => {
      await db.insert(schema.contatos).values({ telefone: '+5575999000003' })

      await expect(
        db.insert(schema.contatos).values({ telefone: '+5575999000003' })
      ).rejects.toThrow()
    })
  })

  describe('select', () => {
    it('deve buscar contato por telefone', async () => {
      await db.insert(schema.contatos).values({
        telefone: '+5575999111111',
        nome: 'Maria',
      })

      const result = await db
        .select()
        .from(schema.contatos)
        .where(eq(schema.contatos.telefone, '+5575999111111'))
        .limit(1)

      expect(result).toHaveLength(1)
      expect(result[0].nome).toBe('Maria')
    })

    it('deve retornar lista vazia quando não encontra', async () => {
      const result = await db
        .select()
        .from(schema.contatos)
        .where(eq(schema.contatos.telefone, '+5575999999999'))

      expect(result).toHaveLength(0)
    })

    it('deve buscar por nome parcial', async () => {
      await db.insert(schema.contatos).values([
        { telefone: '+5575999000010', nome: 'João Silva' },
        { telefone: '+5575999000011', nome: 'João Santos' },
        { telefone: '+5575999000012', nome: 'Maria Silva' },
      ])

      const result = await db
        .select()
        .from(schema.contatos)
        .where(like(schema.contatos.nome, '%João%'))

      expect(result).toHaveLength(2)
    })

    it('deve ordenar por updatedAt desc', async () => {
      await db.insert(schema.contatos).values([
        { telefone: '+5575999000020', nome: 'Primeiro' },
      ])

      // Aguarda 10ms para garantir diferença de timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      await db.insert(schema.contatos).values([
        { telefone: '+5575999000021', nome: 'Segundo' },
      ])

      const result = await db
        .select()
        .from(schema.contatos)
        .orderBy(desc(schema.contatos.updatedAt))

      expect(result[0].nome).toBe('Segundo')
      expect(result[1].nome).toBe('Primeiro')
    })
  })

  describe('update', () => {
    it('deve atualizar contato', async () => {
      const [inserted] = await db
        .insert(schema.contatos)
        .values({ telefone: '+5575999222222', nome: 'Original' })
        .returning()

      const [updated] = await db
        .update(schema.contatos)
        .set({ nome: 'Atualizado', updatedAt: new Date() })
        .where(eq(schema.contatos.id, inserted.id))
        .returning()

      expect(updated.nome).toBe('Atualizado')
    })

    it('deve atualizar estado da jornada', async () => {
      const [inserted] = await db
        .insert(schema.contatos)
        .values({ telefone: '+5575999333333' })
        .returning()

      const [updated] = await db
        .update(schema.contatos)
        .set({ estadoJornada: 'qualificado' })
        .where(eq(schema.contatos.id, inserted.id))
        .returning()

      expect(updated.estadoJornada).toBe('qualificado')
    })
  })

  describe('count', () => {
    it('deve contar contatos por origem', async () => {
      await db.insert(schema.contatos).values([
        { telefone: '+5575999400001', origem: 'organico' },
        { telefone: '+5575999400002', origem: 'organico' },
        { telefone: '+5575999400003', origem: 'campanha' },
      ])

      const result = await db
        .select({
          origem: schema.contatos.origem,
          count: sql<number>`count(*)`,
        })
        .from(schema.contatos)
        .groupBy(schema.contatos.origem)

      const organico = result.find(r => r.origem === 'organico')
      const campanha = result.find(r => r.origem === 'campanha')

      expect(Number(organico?.count)).toBe(2)
      expect(Number(campanha?.count)).toBe(1)
    })

    it('deve contar total de contatos', async () => {
      await db.insert(schema.contatos).values([
        { telefone: '+5575999500001' },
        { telefone: '+5575999500002' },
        { telefone: '+5575999500003' },
      ])

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.contatos)

      expect(Number(result[0]?.count)).toBe(3)
    })
  })

  describe('pagination', () => {
    it('deve paginar resultados', async () => {
      // Inserir 5 contatos
      for (let i = 1; i <= 5; i++) {
        await db.insert(schema.contatos).values({
          telefone: `+557599960000${i}`,
          nome: `Contato ${i}`,
        })
      }

      // Página 1 (limit 2)
      const page1 = await db
        .select()
        .from(schema.contatos)
        .limit(2)
        .offset(0)

      expect(page1).toHaveLength(2)

      // Página 2 (limit 2)
      const page2 = await db
        .select()
        .from(schema.contatos)
        .limit(2)
        .offset(2)

      expect(page2).toHaveLength(2)

      // Página 3 (limit 2)
      const page3 = await db
        .select()
        .from(schema.contatos)
        .limit(2)
        .offset(4)

      expect(page3).toHaveLength(1)
    })
  })

  describe('filters', () => {
    beforeEach(async () => {
      await db.insert(schema.contatos).values([
        { telefone: '+5575999700001', nome: 'João', origem: 'organico', estadoJornada: 'inicial' },
        { telefone: '+5575999700002', nome: 'Maria', origem: 'campanha', estadoJornada: 'qualificado' },
        { telefone: '+5575999700003', nome: 'José', origem: 'organico', estadoJornada: 'qualificado' },
      ])
    })

    it('deve filtrar por origem', async () => {
      const result = await db
        .select()
        .from(schema.contatos)
        .where(eq(schema.contatos.origem, 'organico'))

      expect(result).toHaveLength(2)
    })

    it('deve filtrar por estadoJornada', async () => {
      const result = await db
        .select()
        .from(schema.contatos)
        .where(eq(schema.contatos.estadoJornada, 'qualificado'))

      expect(result).toHaveLength(2)
    })

    it('deve combinar filtros com AND', async () => {
      const result = await db
        .select()
        .from(schema.contatos)
        .where(
          and(
            eq(schema.contatos.origem, 'organico'),
            eq(schema.contatos.estadoJornada, 'qualificado')
          )
        )

      expect(result).toHaveLength(1)
      expect(result[0].nome).toBe('José')
    })

    it('deve buscar por nome OU telefone', async () => {
      const result = await db
        .select()
        .from(schema.contatos)
        .where(
          or(
            like(schema.contatos.nome, '%João%'),
            like(schema.contatos.telefone, '%700002%')
          )
        )

      expect(result).toHaveLength(2)
    })
  })
})
