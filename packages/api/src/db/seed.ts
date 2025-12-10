import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcrypt'
import { administradores } from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

const SALT_ROUNDS = 10

async function seed() {
  console.log('Seeding administrators...')

  const admins = [
    { nome: 'Antonio', email: 'antonio@filarmonica25.org.br', senha: 'admin123' },
    { nome: 'Isabelle', email: 'isabelle@filarmonica25.org.br', senha: 'admin123' },
    { nome: 'Maestro', email: 'maestro@filarmonica25.org.br', senha: 'admin123' },
  ]

  for (const admin of admins) {
    const senhaHash = await bcrypt.hash(admin.senha, SALT_ROUNDS)

    await db
      .insert(administradores)
      .values({
        nome: admin.nome,
        email: admin.email,
        senhaHash,
      })
      .onConflictDoNothing({ target: administradores.email })

    console.log(`  Created admin: ${admin.email}`)
  }

  console.log('Seed complete!')
  await client.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
