# Guia Definitivo de Testes - CRM Filarmônica

## Objetivo

Alcançar **100% de cobertura por arquivo** com testes funcionais, sem warnings, seguindo Clean Architecture, boas práticas de ESLint 9 e TypeScript strict.

---

## 1. Fundamentos: Clean Architecture e Testabilidade

Para atingir 100% de cobertura sustentável, a arquitetura deve ser desenhada para testabilidade. A Clean Architecture separa o software em camadas baseadas na **Regra de Dependência**: dependências apontam apenas para dentro, em direção às políticas de alto nível.

### 1.1 Estratégia de Teste por Camada

| Camada | Componentes | Estratégia de Teste | Ferramentas |
|--------|-------------|---------------------|-------------|
| **Entidades (Domain)** | Entities, Value Objects | Testes Unitários Puros | Vitest |
| **Use Cases (Application)** | Services, Handlers | Unitários com Mocks | Vitest, vi.mock |
| **Interface Adapters** | Controllers, Routes | Integração de Componente | Fastify inject |
| **Infrastructure** | Repositories, APIs | Integração com DB | Drizzle, PGlite |
| **Frontend UI** | Components, Hooks | Testes de Componente | Testing Library |

### 1.2 Isolamento via Inversão de Dependência

```typescript
// ✅ Interface na camada de Domínio/Aplicação
interface IContactRepository {
  save(contact: Contact): Promise<Contact>
  findById(id: string): Promise<Contact | null>
  findAll(filters: ContactFilters): Promise<Contact[]>
}

// ✅ Implementação na camada de Infraestrutura
class DrizzleContactRepository implements IContactRepository {
  constructor(private db: Database) {}

  async save(contact: Contact): Promise<Contact> {
    const [saved] = await this.db.insert(contacts).values(contact).returning()
    return saved
  }
  // ...
}

// ✅ Use Case depende apenas da interface
class CreateContactUseCase {
  constructor(private repository: IContactRepository) {}

  async execute(input: CreateContactInput): Promise<Contact> {
    // Lógica de negócio
    return this.repository.save(contact)
  }
}
```

Esta separação permite:
- Testar Use Cases com mocks (rápido)
- Testar Repositories contra banco real/PGlite (integração)
- Simular cenários de erro sem forçar falhas reais

---

## 2. Estrutura do Projeto

### 2.1 Organização de Arquivos (API)

```
packages/api/src/
├── modules/
│   └── {module}/
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── {entity}.entity.ts
│       │   │   └── {entity}.entity.test.ts      # Unitários
│       │   └── value-objects/
│       │       ├── {vo}.vo.ts
│       │       └── {vo}.vo.test.ts              # Unitários
│       ├── application/
│       │   ├── {usecase}.usecase.ts
│       │   └── {usecase}.usecase.test.ts        # Unitários + Mocks
│       ├── infrastructure/
│       │   ├── {repository}.repository.ts
│       │   └── {repository}.repository.test.ts  # Integração + PGlite
│       ├── {module}.routes.ts
│       └── {module}.routes.test.ts              # Integração + Fastify inject
└── __tests__/
    ├── setup.ts                                  # Setup global
    ├── setup-db.ts                               # PGlite setup
    ├── factories/                                # Fishery factories
    │   ├── index.ts
    │   ├── contact.factory.ts
    │   └── automation.factory.ts
    ├── mocks/                                    # Mocks globais
    └── helpers/                                  # Funções auxiliares
```

### 2.2 Organização de Arquivos (Web)

```
packages/web/src/
├── pages/
│   ├── {Page}.tsx
│   └── {Page}.test.tsx                          # Testes de página
├── components/
│   ├── {Component}/
│   │   ├── {Component}.tsx
│   │   ├── {Component}.test.tsx                 # Testes de componente
│   │   └── index.ts
├── hooks/
│   ├── use{Hook}.ts
│   └── use{Hook}.test.ts                        # Testes de hook
├── services/
│   ├── api.ts
│   └── api.test.ts                              # Testes de serviço
└── __tests__/
    ├── setup.ts                                  # Setup global (jest-dom)
    ├── test-utils.tsx                            # Providers e render helpers
    └── mocks/                                    # MSW handlers, etc.
```

---

## 3. Configuração ESLint 9 (Flat Config)

### 3.1 Instalar Dependências

```bash
# API (Node/TypeScript)
npm install -D @eslint/js typescript-eslint eslint-plugin-vitest -w @crm-filarmonica/api

# Web (React/TypeScript)
npm install -D @eslint/js typescript-eslint eslint-plugin-vitest eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-testing-library globals -w @crm-filarmonica/web
```

### 3.2 API (`packages/api/eslint.config.js`)

```javascript
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'

export default tseslint.config(
  // 1. Ignorar artefatos
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'drizzle/'],
  },

  // 2. Configurações base
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 3. Parser TypeScript otimizado para monorepo
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true, // Performance em monorepos
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript Strict
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // Qualidade
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // 4. Configuração específica para testes
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,

      // Qualidade de testes
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/valid-expect': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'it' }],

      // Relaxar para testes
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  }
)
```

### 3.3 Web (`packages/web/eslint.config.js`)

```javascript
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import vitest from 'eslint-plugin-vitest'
import testingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'

export default tseslint.config(
  // 1. Ignorar artefatos
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },

  // 2. Configurações base
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Configuração React
  {
    files: ['**/*.tsx', '**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // 4. Configuração para testes
  {
    files: ['**/*.test.tsx', '**/*.test.ts', '**/__tests__/**/*'],
    plugins: {
      vitest,
      'testing-library': testingLibrary,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs['flat/react'].rules,

      // Testing Library
      'testing-library/await-async-queries': 'error',
      'testing-library/await-async-utils': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-container': 'warn',
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/no-dom-import': 'error',
      'testing-library/no-node-access': 'warn',
      'testing-library/prefer-find-by': 'error',
      'testing-library/prefer-presence-queries': 'error',
      'testing-library/prefer-screen-queries': 'error',

      // Vitest
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',

      // Relaxar para testes
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
)
```

---

## 4. Configuração Vitest

### 4.1 API (`packages/api/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    restoreMocks: true,

    // Pool para performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Coverage 100% por arquivo
    coverage: {
      provider: 'v8', // Mais rápido que Istanbul
      enabled: true,
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/index.ts',
        '**/types.ts',
        '**/constants.ts',
        'src/server.ts',
        'src/db/migrate.ts',
        'src/db/seed.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
        perFile: true, // Crítico: 100% em CADA arquivo
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
```

### 4.2 Web (`packages/web/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/__tests__/setup.ts'],
    restoreMocks: true,

    // CSS
    css: true,

    // Coverage 100% por arquivo
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
        perFile: true,
      },
      reportOnFailure: true,
    },

    testTimeout: 10000,
    reporters: ['verbose'],
  },
})
```

### 4.3 Setup do Frontend (`packages/web/src/__tests__/setup.ts`)

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpeza automática após cada teste
afterEach(() => {
  cleanup()
})
```

---

## 5. Testes de Banco de Dados com PGlite

O **PGlite** compila PostgreSQL real para WebAssembly, permitindo executar um banco descartável para cada teste com inicialização em milissegundos.

### 5.1 Instalar PGlite

```bash
npm install -D @electric-sql/pglite -w @crm-filarmonica/api
```

### 5.2 Setup do Banco de Teste (`packages/api/src/__tests__/setup-db.ts`)

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../db/schema'

export type TestDatabase = ReturnType<typeof drizzle<typeof schema>>

/**
 * Cria instância isolada do banco para testes.
 * Executa todas as migrações automaticamente.
 */
export async function createTestDatabase(): Promise<{
  db: TestDatabase
  client: PGlite
  cleanup: () => Promise<void>
}> {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  // Aplica migrações reais
  await migrate(db, { migrationsFolder: './drizzle' })

  return {
    db,
    client,
    cleanup: async () => {
      await client.close()
    },
  }
}
```

### 5.3 Exemplo de Teste de Repository

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createTestDatabase, TestDatabase } from '../../__tests__/setup-db'
import { DrizzleContactRepository } from './contact.repository'
import { contactFactory } from '../../__tests__/factories'
import { PGlite } from '@electric-sql/pglite'

describe('DrizzleContactRepository', () => {
  let db: TestDatabase
  let client: PGlite
  let repository: DrizzleContactRepository

  beforeAll(async () => {
    const testDb = await createTestDatabase()
    db = testDb.db
    client = testDb.client
    repository = new DrizzleContactRepository(db)
  })

  afterAll(async () => {
    await client.close()
  })

  beforeEach(async () => {
    // Limpar tabelas entre testes
    await db.delete(schema.contacts)
  })

  describe('save', () => {
    it('deve persistir contato no banco', async () => {
      const contact = contactFactory.build()

      const saved = await repository.save(contact)

      expect(saved.id).toBeDefined()
      expect(saved.nome).toBe(contact.nome)
    })

    it('deve lançar erro em caso de constraint violation', async () => {
      const contact = contactFactory.build({ email: 'duplicado@test.com' })
      await repository.save(contact)

      await expect(repository.save(contact)).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('deve retornar contato existente', async () => {
      const contact = await contactFactory.create({ db })

      const found = await repository.findById(contact.id)

      expect(found).toMatchObject({ id: contact.id, nome: contact.nome })
    })

    it('deve retornar null para ID inexistente', async () => {
      const found = await repository.findById('inexistente')

      expect(found).toBeNull()
    })
  })
})
```

---

## 6. Factories com Fishery

O **Fishery** cria factories tipadas, superior a fixtures estáticas ou faker puro.

### 6.1 Instalar Fishery

```bash
npm install -D fishery @faker-js/faker -w @crm-filarmonica/api
```

### 6.2 Criar Factories (`packages/api/src/__tests__/factories/contact.factory.ts`)

```typescript
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/pt_BR'
import { InferInsertModel } from 'drizzle-orm'
import { contacts } from '../../db/schema'

type ContactInsert = InferInsertModel<typeof contacts>

interface ContactFactoryTransientParams {
  db?: any // Para persistência automática
}

export const contactFactory = Factory.define<ContactInsert, ContactFactoryTransientParams>(
  ({ sequence, transientParams, onCreate }) => {
    // Persistência automática quando db é fornecido
    onCreate(async (contact) => {
      if (transientParams.db) {
        const [inserted] = await transientParams.db
          .insert(contacts)
          .values(contact)
          .returning()
        return inserted
      }
      return contact
    })

    return {
      id: `contact-${sequence}`,
      nome: faker.person.fullName(),
      email: faker.internet.email(),
      telefone: faker.phone.number('5575999######'),
      tipo: 'lead' as const,
      origem: 'whatsapp' as const,
      status: 'ativo' as const,
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
)
```

### 6.3 Factory de Automação (`packages/api/src/__tests__/factories/automation.factory.ts`)

```typescript
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/pt_BR'

interface Automation {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  trigger: {
    tipo: string
    config: Record<string, unknown>
  }
  acoes: Array<{
    tipo: string
    config: Record<string, unknown>
  }>
  condicoes: Array<{
    campo: string
    operador: string
    valor: unknown
  }>
  createdAt: Date
  updatedAt: Date
}

export const automationFactory = Factory.define<Automation>(({ sequence }) => ({
  id: `automation-${sequence}`,
  nome: faker.commerce.productName(),
  descricao: faker.lorem.sentence(),
  ativo: true,
  trigger: {
    tipo: 'novo_contato',
    config: {},
  },
  acoes: [
    {
      tipo: 'enviar_mensagem',
      config: { mensagem: faker.lorem.sentence() },
    },
  ],
  condicoes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}))
```

### 6.4 Índice de Factories (`packages/api/src/__tests__/factories/index.ts`)

```typescript
export { contactFactory } from './contact.factory'
export { automationFactory } from './automation.factory'
```

### 6.5 Uso das Factories

```typescript
import { contactFactory, automationFactory } from '../factories'

// Criar objeto em memória (rápido, para testes unitários)
const contact = contactFactory.build()
const contactComEmail = contactFactory.build({ email: 'custom@test.com' })

// Criar vários objetos
const contacts = contactFactory.buildList(5)

// Criar e persistir no banco (para testes de integração)
const savedContact = await contactFactory.create({ db })

// Sobrescrever campos específicos
const automation = automationFactory.build({
  nome: 'Boas-vindas',
  trigger: { tipo: 'novo_contato', config: { canal: 'whatsapp' } },
})
```

---

## 7. Padrões de Teste

### 7.1 Estrutura AAA (Arrange-Act-Assert)

```typescript
it('deve criar automação com trigger válido', () => {
  // Arrange (Preparar)
  const input = automationFactory.build({
    nome: 'Boas-vindas',
    trigger: { tipo: 'novo_contato', config: {} },
  })

  // Act (Agir)
  const automation = Automation.create(input)

  // Assert (Verificar)
  expect(automation.nome).toBe('Boas-vindas')
  expect(automation.ativo).toBe(true)
  expect(automation.trigger.tipo).toBe('novo_contato')
})
```

### 7.2 Nomenclatura de Testes

```typescript
describe('Automation Entity', () => {
  // Agrupar por funcionalidade
  describe('create', () => {
    it('deve criar automação com dados válidos', () => {})
    it('deve lançar erro quando nome está vazio', () => {})
    it('deve lançar erro quando não há ações', () => {})
  })

  describe('activate', () => {
    it('deve ativar automação inativa', () => {})
    it('deve manter estado quando já está ativa', () => {})
  })

  describe('edge cases', () => {
    it('deve tratar caracteres especiais no nome', () => {})
    it('deve tratar arrays vazios de condições', () => {})
  })
})
```

### 7.3 Mocking com Factory Functions

```typescript
// ✅ Factory function para mocks reutilizáveis
const createMockRepository = (overrides: Partial<IContactRepository> = {}) => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

it('deve salvar automação', async () => {
  const repository = createMockRepository()
  const useCase = new CreateAutomationUseCase(repository)

  await useCase.execute(input)

  expect(repository.save).toHaveBeenCalledWith(
    expect.objectContaining({ nome: input.nome })
  )
})
```

### 7.4 Testando Controllers Fastify (inject)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../../app'
import { ContactService } from './contact.service'

vi.mock('./contact.service')

describe('ContactController', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  it('deve retornar 201 ao criar contato', async () => {
    vi.mocked(ContactService.prototype.create).mockResolvedValue({
      id: '1',
      nome: 'João',
      email: 'joao@test.com',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      payload: { nome: 'João', email: 'joao@test.com' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: '1' })
  })

  it('deve retornar 500 em erro inesperado', async () => {
    vi.mocked(ContactService.prototype.create).mockRejectedValue(
      new Error('Erro Fatal')
    )

    const response = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      payload: { nome: 'João', email: 'joao@test.com' },
    })

    expect(response.statusCode).toBe(500)
  })
})
```

### 7.5 Testando Hooks React

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'
import { AuthProvider } from '../context/AuthContext'

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('deve realizar login e atualizar estado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()

    await act(async () => {
      await result.current.login('user@test.com', 'password')
    })

    await waitFor(() => {
      expect(result.current.user).toMatchObject({ email: 'user@test.com' })
    })
  })
})
```

---

## 8. Cobertura 100%: Estratégias

### 8.1 Testar Todos os Branches

```typescript
// Código
function validateAge(age: number | null): string {
  if (age === null) return 'Idade não informada'
  if (age < 0) return 'Idade inválida'
  if (age < 18) return 'Menor de idade'
  if (age >= 18 && age < 60) return 'Adulto'
  return 'Idoso'
}

// Testes - cobrir TODOS os branches
describe('validateAge', () => {
  it('deve retornar "Idade não informada" quando null', () => {
    expect(validateAge(null)).toBe('Idade não informada')
  })

  it('deve retornar "Idade inválida" quando negativo', () => {
    expect(validateAge(-1)).toBe('Idade inválida')
  })

  it('deve retornar "Menor de idade" quando < 18', () => {
    expect(validateAge(17)).toBe('Menor de idade')
  })

  it('deve retornar "Adulto" quando >= 18 e < 60', () => {
    expect(validateAge(18)).toBe('Adulto')
    expect(validateAge(59)).toBe('Adulto')
  })

  it('deve retornar "Idoso" quando >= 60', () => {
    expect(validateAge(60)).toBe('Idoso')
  })
})
```

### 8.2 Testar Casos de Erro

```typescript
describe('sendWhatsApp', () => {
  it('deve lançar erro quando telefone está vazio', async () => {
    await expect(sendWhatsApp('', 'Olá')).rejects.toThrow('Telefone é obrigatório')
  })

  it('deve lançar erro quando mensagem está vazia', async () => {
    await expect(sendWhatsApp('5575999999999', '')).rejects.toThrow(
      'Mensagem é obrigatória'
    )
  })

  it('deve lançar erro quando API falha', async () => {
    vi.mocked(whatsappClient.send).mockRejectedValue(new Error('API Error'))

    await expect(sendWhatsApp('5575999999999', 'Olá')).rejects.toThrow(
      'Falha ao enviar mensagem'
    )
  })

  it('deve enviar mensagem com sucesso', async () => {
    vi.mocked(whatsappClient.send).mockResolvedValue(undefined)

    await expect(sendWhatsApp('5575999999999', 'Olá')).resolves.toBeUndefined()
    expect(whatsappClient.send).toHaveBeenCalledWith('5575999999999', 'Olá')
  })
})
```

### 8.3 Testar Edge Cases

```typescript
describe('edge cases', () => {
  // Strings
  it('deve tratar string vazia', () => {})
  it('deve tratar string com espaços', () => {})
  it('deve tratar string muito longa', () => {})
  it('deve tratar caracteres especiais', () => {})
  it('deve tratar caracteres Unicode (acentos)', () => {})

  // Números
  it('deve tratar zero', () => {})
  it('deve tratar números negativos', () => {})
  it('deve tratar Infinity', () => {})
  it('deve tratar NaN', () => {})

  // Arrays
  it('deve tratar array vazio', () => {})
  it('deve tratar array com um elemento', () => {})
  it('deve tratar array com muitos elementos', () => {})

  // Objetos
  it('deve tratar objeto vazio', () => {})
  it('deve tratar propriedades undefined', () => {})
  it('deve tratar propriedades null', () => {})
})
```

---

## 9. Evitar Warnings Comuns

### 9.1 Unused Variables

```typescript
// ❌ Warning: 'result' is declared but never used
const result = await useCase.execute(input)
expect(mock.save).toHaveBeenCalled()

// ✅ Usar underscore
const _result = await useCase.execute(input)
expect(mock.save).toHaveBeenCalled()

// ✅ Ou fazer asserção no resultado
const result = await useCase.execute(input)
expect(result.success).toBe(true)
```

### 9.2 Floating Promises

```typescript
// ❌ Warning: Unhandled promise
it('should work', () => {
  useCase.execute(input) // Promise não aguardada
})

// ✅ Sempre aguardar promises
it('should work', async () => {
  await useCase.execute(input)
})
```

### 9.3 Type Assertions

```typescript
// ❌ Warning: Unexpected any
const data = response.body as any

// ✅ Definir tipo específico
interface ResponseBody {
  data: Contact[]
  pagination: { total: number }
}
const data = response.body as ResponseBody
```

### 9.4 Literal Types

```typescript
// ❌ Warning: Type 'string' is not assignable
const contact = { tipo: 'lead' }

// ✅ Usar as const
const contact = { tipo: 'lead' as const }

// ✅ Ou satisfies
const contact = { tipo: 'lead' } satisfies { tipo: 'lead' | 'cliente' }
```

---

## 10. CI/CD com GitHub Actions

### 10.1 Pipeline Completo (`.github/workflows/ci.yml`)

```yaml
name: Quality Gate & CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  # Job 1: Verificações Estáticas
  static-checks:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      - name: Linting
        run: npm run lint

      - name: Type Check
        run: npm run typecheck

  # Job 2: Testes (Matriz Paralela)
  test:
    name: Test ${{ matrix.workspace }}
    needs: static-checks
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        workspace: ['@crm-filarmonica/api', '@crm-filarmonica/web']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      - name: Run Tests with Coverage
        run: npm run test:coverage -w ${{ matrix.workspace }}

      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ strategy.job-index }}
          path: packages/*/coverage/

  # Job 3: Gate de Cobertura
  coverage-gate:
    name: Coverage Enforcement
    needs: test
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4

      - name: Download Coverage
        uses: actions/download-artifact@v4
        with:
          path: all-coverage

      - name: Coverage Report
        uses: davelosert/vitest-coverage-report-action@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          json-summary-path: |
            all-coverage/coverage-0/coverage-summary.json
            all-coverage/coverage-1/coverage-summary.json
```

---

## 11. Checklists

### 11.1 Antes de Commitar

- [ ] `npm run lint` passa sem erros
- [ ] `npm run typecheck` passa sem erros
- [ ] `npm run test:run` passa 100%
- [ ] `npm run test:coverage` atinge thresholds (100% por arquivo)
- [ ] Sem `console.log` nos testes
- [ ] Sem `.only` ou `.skip` esquecidos
- [ ] Nomes de testes em português e descritivos
- [ ] Cada teste testa UMA coisa
- [ ] Mocks resetados no `beforeEach`

### 11.2 Code Review

- [ ] Testes cobrem happy path
- [ ] Testes cobrem error paths
- [ ] Testes cobrem edge cases
- [ ] Asserções são específicas (não apenas `toBeDefined()`)
- [ ] Mocks não escondem bugs reais
- [ ] Testes são independentes (ordem não importa)
- [ ] Factories usadas em vez de fixtures hardcoded

---

## 12. Comandos Úteis

```bash
# Executar testes em modo watch
npm run test -w @crm-filarmonica/api

# Executar testes uma vez
npm run test:run -w @crm-filarmonica/api

# Gerar relatório de coverage
npm run test:coverage -w @crm-filarmonica/api

# Executar testes de um arquivo específico
npm run test -- src/modules/contacts/contact.entity.test.ts -w @crm-filarmonica/api

# Executar testes que correspondem a um padrão
npm run test -- --grep="deve criar" -w @crm-filarmonica/api

# Ver coverage de um módulo específico
npm run test:coverage -- --coverage.include="src/modules/automations/**" -w @crm-filarmonica/api

# Lint com fix automático
npm run lint -- --fix -w @crm-filarmonica/api
```

---

## 13. Prompt para Criar Novos Testes

Use este prompt ao criar novos testes:

```
Crie testes completos para o arquivo {ARQUIVO}.

Requisitos:
1. Usar Vitest com TypeScript
2. Seguir padrão AAA (Arrange-Act-Assert)
3. Cobrir 100% do código:
   - Happy paths (casos de sucesso)
   - Error paths (casos de erro)
   - Edge cases (casos limite)
   - Todos os branches de if/else/switch
4. Usar Fishery factories para criar dados de teste
5. Usar mocks tipados para dependências
6. Nomenclatura em português:
   - describe: nome da unidade testada
   - it: "deve {comportamento esperado}"
7. Sem warnings de ESLint/TypeScript:
   - Sem imports não utilizados
   - Sem variáveis não utilizadas (usar _ prefix)
   - Tipos explícitos em vez de any
   - Usar "as const" para literais
8. Incluir testes de imutabilidade se aplicável
9. Incluir testes de validação de entrada

Estrutura esperada:
/**
 * Testes para {Componente}
 * Testa: {lista do que é testado}
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { componentFactory } from '../factories'
// ... imports

describe('{Componente}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('{funcionalidade}', () => {
    it('deve {comportamento} quando {condição}', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

---

## Referências

1. [Vitest vs Jest - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
2. [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
3. [PGlite - Postgres in WebAssembly](https://github.com/electric-sql/pglite)
4. [Drizzle + PGlite](https://orm.drizzle.team/docs/get-started/pglite-new)
5. [Fishery - Test Data Factories](https://github.com/thoughtbot/fishery)
6. [Vitest Coverage](https://vitest.dev/guide/coverage.html)
7. [Vitest Workspaces](https://vitest.dev/guide/projects)
8. [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
9. [Fastify Testing](https://fastify.dev/docs/v1.14.x/Documentation/Testing/)
10. [Clean Architecture Testing](https://tech.raisa.com/from-chaos-to-confidence-a-practical-guide-to-unit-testing-in-clean-architecture-2/)
