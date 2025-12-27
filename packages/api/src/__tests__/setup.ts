/**
 * Setup global para testes
 */

import { beforeEach, vi } from 'vitest'

// Reset mocks antes de cada teste
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock console.error para não poluir output dos testes
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
