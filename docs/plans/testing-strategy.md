# CRM Filarmonica - Comprehensive Unit Testing Strategy

## 1. Executive Summary

This document provides a comprehensive testing strategy for the CRM Filarmonica project, a monorepo containing:
- **Backend**: Node.js 20 LTS, Fastify 5, TypeScript 5.7 with Clean Architecture
- **Frontend**: React 19, Vite, TanStack Query, Tailwind CSS
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Queue**: BullMQ with Redis

The project implements Clean Architecture in the backend with distinct layers (Domain, Application, Adapters), making it ideal for comprehensive unit testing.

---

## 2. Testing Framework Selection

### Recommended Stack: **Vitest + React Testing Library**

#### Why Vitest?
1. **Better TypeScript Support**: Native ESM support with TypeScript, no babel transformations needed
2. **Fast Execution**: 10-50x faster than Jest for this stack (uses Vite's transform pipeline)
3. **Component API Compatible**: Drop-in Jest replacement with familiar syntax
4. **ESM Native**: Both packages are ESM modules (Node 20 LTS)
5. **Vite Integration**: Seamless integration with existing Vite setup
6. **Great DX**: Smart/watch mode, snapshot testing, coverage reporting built-in

#### Current State
- Vitest 2.1.6 already in both packages
- API uses `vitest` + `test` scripts
- Web uses `vitest` + `test` scripts

#### Supporting Tools
```json
{
  "testing": {
    "framework": "Vitest 2.1.6+",
    "ui-testing": "React Testing Library 15+",
    "mocking": "Vitest (vi.mock, vi.spyOn)",
    "coverage": "Vitest's V8 coverage",
    "test-data": "Custom factories + fixtures"
  }
}
```

---

## 3. Backend Testing Strategy

### Architecture: Clean Architecture Implementation

The API follows Clean Architecture with Clear Separation of Concerns:

```
packages/api/src/modules/{feature}/
├── domain/
│   ├── entities/          # Business logic core
│   ├── value-objects/     # Immutable data structures
│   ├── ports/             # Interfaces (Dependency Inversion)
│   └── events/            # Domain events
├── application/
│   └── {feature}.usecase.ts  # Use cases (orchestration)
├── adapters/
│   ├── {service}.adapter.ts  # External integrations
│   └── {repo}.repository.ts  # Database access
├── {feature}.routes.ts    # REST endpoints (Fastify)
└── index.ts               # Module exports
```

### 3.1 Domain Layer Testing

**Goal**: Test business logic in isolation with 100% coverage

**Key Tests**:
- Entity creation with validation
- Entity state transitions (activate/deactivate)
- Value object immutability
- Persistence round-trip (toPersistence/fromPersistence)

### 3.2 Value Objects Testing

**Goal**: Test immutability and validation logic

**Key Tests**:
- Trigger creation and matching logic
- Condition evaluation
- Action validation

### 3.3 Use Case Testing

**Goal**: Test orchestration logic with mocked ports

**Key Tests**:
- Create/update/delete operations
- Activation/deactivation
- Error handling
- Event publishing

### 3.4 Repository Testing

**Goal**: Integration tests with test database

**Key Tests**:
- CRUD operations
- Pagination and filtering
- Upsert behavior
- Concurrent access

### 3.5 API Routes Testing

**Goal**: Test HTTP endpoints with Fastify injection

**Key Tests**:
- Request validation
- Response format
- Status codes
- Auth middleware

---

## 4. Frontend Testing Strategy

### 4.1 Component Testing

**Goal**: Test user interactions and component behavior, not implementation

**Tools**: React Testing Library + Vitest

**Key Tests**:
- Loading states
- Error states
- User interactions
- Navigation

### 4.2 Hook Testing

**Goal**: Test custom hooks and TanStack Query integration

**Key Tests**:
- Data fetching
- Pagination
- Caching behavior
- Error handling

### 4.3 API Client Testing

**Goal**: Test API layer with fetch mocking

**Key Tests**:
- Request/response handling
- Query parameters
- Error transformation
- Auth headers

---

## 5. Test Organization

### Directory Structure

```
packages/api/src/modules/{feature}/
├── domain/
│   ├── entities/
│   │   └── __tests__/
│   └── value-objects/
│       └── __tests__/
├── application/
│   └── __tests__/
├── adapters/
│   └── __tests__/
└── __tests__/
    └── {feature}.routes.test.ts

packages/web/src/
├── pages/
│   └── __tests__/
├── components/
│   └── __tests__/
├── hooks/
│   └── __tests__/
└── services/
    └── __tests__/
```

### Test Utilities

- **Factories**: Generate consistent test data
- **Custom render**: Wrap components with providers
- **Mock setup**: Centralized mock configurations

---

## 6. Coverage Targets

```
Backend (API):
- Domain Layer:   100% coverage
- Use Cases:       95% coverage
- Repositories:    90% coverage
- Routes:          85% coverage

Frontend (Web):
- Components:      80% coverage
- Hooks:          85% coverage
- Services:        90% coverage
- Utils:           95% coverage
```

### Critical Paths (MUST Test)

**Backend:**
- Automation entity creation with validation
- Trigger matching logic (business rules)
- Use case error handling
- Contact deduplication logic
- Journey state transitions
- Message queue integration

**Frontend:**
- Dashboard data loading and error states
- Contact list filtering and pagination
- Automation form validation
- Query cache invalidation

### What NOT to Test

- Library implementations (TanStack Query, Drizzle, Fastify)
- Third-party integrations without control
- Style/CSS rules
- Private methods

---

## 7. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_crm
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

      redis:
        image: redis:latest
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm install
      - run: npm run test:run -w packages/api
      - run: npm run test:run -w packages/web

      - uses: codecov/codecov-action@v3
```

### Vitest Configuration

**API (packages/api/vitest.config.ts)**:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 85,
      functions: 85,
      branches: 80
    }
  }
})
```

**Web (packages/web/vitest.config.ts)**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 75
    }
  }
})
```

---

## 8. Implementation Order

### Phase 1: Foundation
- Setup Vitest configs in both packages
- Create test utilities and factories
- Test domain layer entities
- Test value objects validation

### Phase 2: Application Logic
- Test use cases with mocked repositories
- Test error handling paths
- Test event publishing

### Phase 3: Integration
- Test repositories with test database
- Test API routes with Fastify injection
- Test database migrations

### Phase 4: Frontend
- Test API client
- Test custom hooks
- Test critical components
- Test form validation

---

## 9. Best Practices Summary

1. **Test Behavior, Not Implementation**
2. **Use Descriptive Test Names**
3. **Arrange-Act-Assert (AAA) Pattern**
4. **Mock External Dependencies**
5. **One Assertion per Test** (when possible)
6. **DRY in Test Setup**: Use `beforeEach()` and factories
7. **Test Error Cases**: Happy paths aren't enough
8. **Avoid Testing Implementation Details**
9. **Keep Tests Fast**: Mocks > real dependencies
10. **Review Coverage Reports**

---

## 10. Quick Reference

### Vitest Common Patterns

```typescript
// Mocking modules
vi.mock('../../services/api')

// Mocking functions
const mockFn = vi.fn()
const mockFn = vi.fn().mockResolvedValue(data)
const mockFn = vi.fn().mockRejectedValue(error)

// Assertions
expect(value).toBe(expectedValue)
expect(value).toEqual(expectedObject)
expect(fn).toHaveBeenCalledWith(arg1, arg2)

// Async testing
await waitFor(() => {
  expect(value).toBe(something)
})
```

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:run -- --coverage

# Run in watch mode
npm test

# Run specific test file
npm test -- automation.entity.test.ts
```
