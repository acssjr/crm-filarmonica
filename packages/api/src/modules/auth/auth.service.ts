import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { administradores, type Administrador } from '../../db/schema.js'
import { verifyPassword } from '../../lib/password.js'
import { generateTokenPair, type TokenPair } from '../../lib/jwt.js'

export interface LoginResult {
  success: boolean
  admin?: Omit<Administrador, 'senhaHash'>
  tokens?: TokenPair
  error?: string
}

export async function login(email: string, senha: string): Promise<LoginResult> {
  // Find admin by email
  const result = await db
    .select()
    .from(administradores)
    .where(eq(administradores.email, email.toLowerCase()))
    .limit(1)

  const admin = result[0]

  if (!admin) {
    return {
      success: false,
      error: 'Email ou senha incorretos',
    }
  }

  // Verify password
  const isValid = await verifyPassword(senha, admin.senhaHash)

  if (!isValid) {
    return {
      success: false,
      error: 'Email ou senha incorretos',
    }
  }

  // Generate tokens
  const tokens = generateTokenPair({
    sub: admin.id,
    email: admin.email,
    nome: admin.nome,
  })

  // Return admin without password hash
  const { senhaHash: _, ...adminWithoutPassword } = admin

  return {
    success: true,
    admin: adminWithoutPassword,
    tokens,
  }
}

export async function getAdminById(id: string): Promise<Omit<Administrador, 'senhaHash'> | null> {
  const result = await db
    .select({
      id: administradores.id,
      nome: administradores.nome,
      email: administradores.email,
      createdAt: administradores.createdAt,
      updatedAt: administradores.updatedAt,
    })
    .from(administradores)
    .where(eq(administradores.id, id))
    .limit(1)

  return result[0] || null
}
