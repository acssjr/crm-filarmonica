/**
 * Vitest Setup for API Tests
 */
import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables for testing
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.NODE_ENV = 'test'

// Global test setup
beforeAll(() => {
  // Suppress console logs during tests unless explicitly needed
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Extend expect with custom matchers if needed
// expect.extend({})
