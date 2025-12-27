import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-min-32-chars!'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

export interface JwtPayload {
  sub: string
  email: string
  nome: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] })
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function generateTokenPair(payload: JwtPayload): TokenPair {
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  // Calculate expiration based on JWT_EXPIRES_IN
  const expiresInMs = parseTimeToMs(JWT_EXPIRES_IN)
  const expiresAt = new Date(Date.now() + expiresInMs)

  return {
    accessToken,
    refreshToken,
    expiresAt,
  }
}

function parseTimeToMs(time: string): number {
  const unit = time.slice(-1)
  const value = parseInt(time.slice(0, -1), 10)

  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 15 * 60 * 1000 // default 15 minutes
  }
}
