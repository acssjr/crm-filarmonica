import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/__tests__/setup.ts'],
    restoreMocks: true,

    // Pool para performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Coverage - foco nos módulos testados
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      include: [
        // Módulos testados
        'src/modules/automations/**/*.ts',
        'src/modules/contacts/**/*.ts',
        'src/modules/tags/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/index.ts',
        // Excluir adapters (precisam de integração completa)
        'src/modules/automations/adapters/**',
        'src/modules/automations/automation.routes.ts',
        'src/modules/automations/automation.scheduler.ts',
        'src/modules/automations/automation.events.ts',
        // Excluir ports (são interfaces)
        'src/modules/automations/domain/ports/**',
        // Excluir usecases ainda não testados
        'src/modules/automations/application/execute-automation.usecase.ts',
        'src/modules/automations/application/run-scheduled-automations.usecase.ts',
        // Excluir domain events (são factories simples)
        'src/modules/automations/domain/events/**',
        // Excluir repositories (testados em integração)
        'src/modules/contacts/contact.repository.ts',
        'src/modules/tags/tag.repository.ts',
        // Excluir routes (testadas com mocks)
        'src/modules/contacts/contact.routes.ts',
        'src/modules/tags/tag.routes.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      reportOnFailure: true,
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose'],
  },
})
