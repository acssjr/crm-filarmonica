import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/e2e/**/*.e2e.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/e2e/setup.ts'],
    restoreMocks: true,

    // E2E tests run sequentially (shared database)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Longer timeouts for E2E
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporters
    reporters: ['verbose'],
  },
})
