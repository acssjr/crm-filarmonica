# **Arquitetura Avançada de Testes em Monorepos TypeScript: Um Guia Definitivo para Fastify, React e Clean Architecture**

## **1\. Introdução à Engenharia de Qualidade em Ecossistemas TypeScript**

A evolução do desenvolvimento de software moderno tem convergido para arquiteturas que priorizam a modularidade, a segurança de tipos e a velocidade de feedback. No epicentro dessa transformação, o ecossistema TypeScript consolidou-se como o padrão de facto para o desenvolvimento full-stack, permitindo que equipes compartilhem contratos de dados, lógicas de validação e utilitários entre camadas de servidor e cliente. A adoção de monorepos — repositórios únicos que abrigam múltiplos projetos e bibliotecas — não é apenas uma conveniência de armazenamento, mas uma estratégia arquitetural para impor consistência e facilitar a refatoração em escala. No entanto, a complexidade inerente a um monorepo exige uma infraestrutura de testes rigorosa e profissional, capaz de garantir a integridade do sistema sem sacrificar a velocidade de desenvolvimento.

Este relatório técnico detalha a implementação de uma estrutura de testes de nível empresarial para um projeto TypeScript monorepo, utilizando **Node.js 20** e **Fastify 5** no backend, **React 18** no frontend, e persistência de dados via **Drizzle ORM**. O foco central reside na obtenção de **100% de cobertura de código**, na adesão estrita aos princípios da **Clean Architecture**, na implementação do novo sistema de configuração **ESLint 9 Flat Config**, e na orquestração de um pipeline de **CI/CD** robusto utilizando **Vitest** como runner de testes.

A transição para ferramentas como Vitest e ESLint 9 representa mais do que uma atualização incremental; trata-se de uma mudança de paradigma. O Vitest, construído sobre o Vite, elimina a dicotomia entre o ambiente de desenvolvimento e o de teste, permitindo uma execução nativa de módulos ESM que supera drasticamente a performance de runners legados como o Jest.1 Simultaneamente, o ESLint 9 introduz o "Flat Config", um sistema de configuração que abandona a complexidade implícita de cascatas de arquivos .eslintrc em favor de uma API programável e explícita, essencial para o gerenciamento de regras em monorepos complexos.2

Ao longo deste documento, dissecaremos não apenas o "como" configurar essas ferramentas, mas o "porquê" de cada decisão arquitetural, analisando as implicações de performance, manutenibilidade e escalabilidade. Abordaremos desde a granularidade dos testes unitários em entidades de domínio até a complexidade de testes de integração com bancos de dados efêmeros utilizando PGlite (Postgres em WebAssembly), uma alternativa revolucionária aos containers Docker tradicionais para ambientes de teste.4

## ---

**2\. Fundamentos Arquiteturais: Clean Architecture em TypeScript**

Para atingir uma cobertura de código de 100% que seja sustentável e não apenas uma métrica de vaidade, a arquitetura do software deve ser desenhada para a testabilidade. A Clean Architecture, proposta por Robert C. Martin, fornece o arcabouço teórico necessário, separando o software em camadas concêntricas baseadas na "Regra de Dependência": as dependências de código fonte devem apontar apenas para dentro, em direção às políticas de alto nível.

No contexto de nosso stack (Fastify, Drizzle, React), a aplicação prática da Clean Architecture manifesta-se na segregação rigorosa entre a lógica de negócio (Use Cases/Services) e os detalhes de implementação (Controllers HTTP, Repositórios de Banco de Dados, Interfaces de UI).

### **2.1. A Anatomia das Camadas e Estratégias de Teste**

A aplicação deve ser estruturada de forma que cada camada possua uma estratégia de teste específica, otimizada para suas responsabilidades. Testar tudo como "teste de integração" é um anti-padrão que leva a suítes lentas e frágeis; testar tudo com mocks excessivos leva a uma falsa sensação de segurança.

A tabela abaixo sintetiza a estratégia de teste por camada arquitetural:

| Camada Arquitetural | Componentes Típicos | Responsabilidade | Estratégia de Teste Primária | Ferramentas Chave |
| :---- | :---- | :---- | :---- | :---- |
| **Entidades (Domain)** | Classes, Value Objects, Types | Lógica de negócio pura e invariantes | Testes Unitários Puros | Vitest, TypeScript |
| **Use Cases (Application)** | Services, Command Handlers | Orquestração de fluxo de dados | Testes Unitários com Mocks | Vitest, vi.mock |
| **Interface Adapters** | Controllers (Fastify), Presenters | Conversão de dados (HTTP \<-\> Domínio) | Testes de Integração de Componente | Fastify inject, Vitest |
| **Frameworks & Drivers** | Repositories (Drizzle), External APIs | Persistência e I/O | Testes de Integração de Infraestrutura | Drizzle, PGlite 4 |
| **Frontend UI** | React Components, Hooks | Interação com usuário e estado visual | Testes de Componente (DOM) | Testing Library, Vitest (JSDOM) |

### **2.2. Isolamento via Inversão de Dependência**

Para garantir que a camada de Use Cases possa ser testada sem invocar o banco de dados real (o que violaria o princípio de testes unitários rápidos), utilizamos a Inversão de Dependência. Em TypeScript, isso é implementado definindo interfaces abstratas para os repositórios na camada de Domínio ou Aplicação.

Por exemplo, um IUserRepository define os métodos save e findByEmail. O Use Case RegisterUser depende apenas dessa interface. A implementação concreta DrizzleUserRepository reside na camada de Infraestrutura. Durante os testes do Use Case, injetamos um mock ou um "Fake" em memória que implementa IUserRepository. Durante os testes do Repositório, testamos a implementação concreta contra um banco de dados real (ou PGlite). Essa separação é crucial para atingir 100% de cobertura, pois permite simular cenários de erro de banco de dados (ex: timeouts, violações de constraint) nos testes de Use Case sem precisar forçar o banco de dados real a falhar.6

## ---

**3\. Estruturação do Monorepo e Configuração do Workspace**

A base de uma estrutura de testes profissional começa com a organização do sistema de arquivos e a configuração do gerenciador de pacotes. Assumindo o uso de NPM Workspaces (ou pnpm/yarn equivalentes), a estrutura deve promover o compartilhamento de configurações de teste e linting para evitar duplicação.

### **3.1. Topologia do Sistema de Arquivos**

Uma estrutura de diretórios recomendada para maximizar a eficiência do Vitest e do ESLint é apresentada a seguir. Note a presença de arquivos de configuração tanto na raiz quanto nos pacotes individuais.

/monorepo-root  
├── package.json (Definição dos Workspaces e Scripts Globais)  
├── eslint.config.mjs (Configuração Base do ESLint 9\)  
├── vitest.workspace.ts (Definição do Workspace Vitest)  
├── tsconfig.base.json (Configurações TS compartilhadas)  
├──.github/  
│ └── workflows/ (Pipelines de CI/CD)  
├── packages/  
│ ├── shared-types/ (DTOs, Zod Schemas compartilhados)  
│ ├── test-utils/ (Factories, Mocks globais, Setup de PGlite)  
│ └── eslint-config/ (Regras ESLint reutilizáveis)  
├── apps/  
│ ├── backend/ (Node.js 20, Fastify 5\)  
│ │ ├── src/  
│ │ ├── tests/ (Testes de integração e E2E)  
│ │ ├── drizzle/ (Migrações e Schema)  
│ │ └── vitest.config.ts (Configuração específica do Backend)  
│ └── frontend/ (React 18\)  
│ ├── src/  
│ ├── tests/ (Testes de componentes e hooks)  
│ └── vitest.config.ts (Configuração específica do Frontend com JSDOM)

### **3.2. Vitest Workspaces: Unificando a Execução**

O Vitest introduziu o conceito de Workspaces para permitir que múltiplos projetos com configurações distintas (ex: backend em Node, frontend em JSDOM) sejam executados em uma única passada, mantendo o isolamento. O arquivo vitest.workspace.ts na raiz é o orquestrador.7

TypeScript

// vitest.workspace.ts  
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(\[  
  'apps/\*',  
  'packages/\*',  
\]);

Esta configuração simples instrui o Vitest a procurar arquivos de configuração dentro de cada diretório em apps e packages. A vantagem crítica aqui é a performance: o Vitest pode paralelizar a execução de testes através de diferentes projetos, utilizando threads de worker de forma eficiente, algo essencial quando se busca manter o tempo de CI baixo em monorepos extensos.8 Além disso, permite que o relatório de cobertura seja unificado nativamente em versões mais recentes ou via ferramentas de merge, facilitando a visão global da qualidade do código.

## ---

**4\. Análise Estática Avançada: ESLint 9 e Flat Config**

A versão 9 do ESLint marca uma ruptura com o passado. O sistema "Flat Config" (eslint.config.mjs) elimina a ambiguidade da resolução de dependências e a complexidade de extends aninhados. Para um projeto profissional que busca 100% de conformidade e segurança de tipos, a configuração deve ser explícita e modular.

### **4.1. Migração e Estrutura do eslint.config.mjs**

No novo modelo, a configuração é um array de objetos, onde cada objeto define explicitamente os arquivos aos quais se aplica (files) e as regras correspondentes. Isso resolve o problema clássico de monorepos onde regras de frontend "vazavam" para o backend e vice-versa.

Para suportar **TypeScript strict**, **React**, **Vitest** e **Testing Library**, precisamos compor diversos plugins. Um desafio imediato é que nem todos os plugins migraram nativamente para o Flat Config, exigindo o uso de utilitários de compatibilidade como fixupPluginRules do pacote @eslint/compat.9

Abaixo, apresentamos uma configuração robusta e comentada para este cenário:

JavaScript

// eslint.config.mjs  
import eslint from '@eslint/js';  
import tseslint from 'typescript-eslint';  
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';  
import reactHooks from 'eslint-plugin-react-hooks';  
import vitest from '@vitest/eslint-plugin';  
import testingLibrary from 'eslint-plugin-testing-library';  
import { fixupPluginRules } from '@eslint/compat';  
import globals from 'globals';

export default tseslint.config(  
  // 1\. Ignorar globalmente artefatos de build e cobertura  
  {  
    ignores: \[  
      '\*\*/dist/\*\*',  
      '\*\*/coverage/\*\*',  
      '\*\*/.drizzle/\*\*',  
      '\*\*/node\_modules/\*\*'  
    \],  
  },

  // 2\. Configurações Base (JavaScript e TypeScript Strict)  
  eslint.configs.recommended,  
 ...tseslint.configs.strictTypeChecked,   
 ...tseslint.configs.stylisticTypeChecked,

  // Configuração do Parser TypeScript para suporte a monorepo  
  {  
    languageOptions: {  
      parserOptions: {  
        projectService: true, // Nova funcionalidade para performance em monorepos   
        tsconfigRootDir: import.meta.dirname,  
      },  
    },  
  },

  // 3\. Regras Específicas para Backend (Fastify/Node)  
  {  
    files: \['apps/backend/\*\*/\*.ts'\],  
    languageOptions: {  
      globals: {...globals.node }, // Apenas globais do Node (process, Buffer, etc.)  
    },  
    rules: {  
      'no-console': \['warn', { allow: \['error'\] }\], // Logs estruturados são preferíveis em produção  
      '@typescript-eslint/no-floating-promises': 'error', // Crítico para evitar erros silenciosos em async/await \[11\]  
      '@typescript-eslint/await-thenable': 'error',  
      '@typescript-eslint/no-misused-promises': 'error',  
    },  
  },

  // 4\. Regras Específicas para Frontend (React)  
  {  
    files: \['apps/frontend/\*\*/\*.tsx', 'apps/frontend/\*\*/\*.ts'\],  
   ...reactRecommended,  
    languageOptions: {  
      globals: {...globals.browser }, // Apenas globais do Browser (window, document, etc.)  
    },  
    plugins: {  
      'react-hooks': fixupPluginRules(reactHooks), // Compatibilidade para plugins legados  
    },  
    rules: {  
     ...reactHooks.configs.recommended.rules,  
      'react/react-in-jsx-scope': 'off', // Desnecessário no React 17+  
      'react/prop-types': 'off', // TypeScript substitui PropTypes  
    },  
    settings: {  
      react: { version: 'detect' },  
    },  
  },

  // 5\. Regras para Arquivos de Teste (Vitest & Testing Library)  
  {  
    files: \['\*\*/\*.test.ts', '\*\*/\*.spec.ts', '\*\*/\*.test.tsx'\],  
    plugins: {  
      vitest,  
      'testing-library': testingLibrary,  
    },  
    rules: {  
     ...vitest.configs.recommended.rules,  
      // Regras de Qualidade de Teste   
      'vitest/expect-expect': 'error', // Garante que todo teste tenha asserção  
      'vitest/no-focused-tests': 'error', // Impede commit de.only  
      'vitest/consistent-test-it': \['error', { fn: 'it' }\],  
        
      // Regras da Testing Library \[13\]  
     ...testingLibrary.configs\['flat/react'\].rules,  
      'testing-library/await-async-queries': 'error',  
      'testing-library/no-await-sync-queries': 'error',  
        
      // Relaxamento controlado para testes  
      '@typescript-eslint/no-explicit-any': 'off', // 'any' às vezes é necessário para mocks complexos  
      '@typescript-eslint/no-non-null-assertion': 'off',  
      '@typescript-eslint/unbound-method': 'off', // Vitest mocks frequentemente disparam isso falso-positivamente  
    },  
  }  
);

### **4.2. Análise de Decisões de Linting**

A escolha de tseslint.configs.strictTypeChecked em vez do recommended padrão é deliberada para um ambiente profissional. Este conjunto de regras ativa verificações que exigem que o linter entenda os tipos de dados, capturando erros lógicos como condições que são sempre verdadeiras/falsas ou promessas que não estão sendo tratadas adequadamente.10 A opção projectService: true é uma inovação recente que permite ao typescript-eslint carregar a configuração do TypeScript de forma mais rápida e inteligente em monorepos, evitando o parsing desnecessário de projetos que não estão sendo editados no momento.

Para os testes, a regra vitest/expect-expect é fundamental. Em grandes bases de código, é comum desenvolvedores escreverem testes que executam código mas esquecem de fazer asserções, criando "testes zumbis" que passam sempre, independentemente da lógica estar correta ou não. Esta regra previne tal degeneração da suíte de testes.12

## ---

**5\. Infraestrutura de Testes com Vitest: Performance e Cobertura**

O Vitest destaca-se pela sua compatibilidade quase total com a API do Jest, mas com uma arquitetura fundamentalmente diferente baseada em ESM (ECMAScript Modules). Isso elimina a necessidade de transpilação complexa (Babel/ts-jest) antes da execução dos testes, resultando em inicialização quase instantânea.

### **5.1. Provedores de Cobertura: V8 vs. Istanbul**

Para atingir a meta de 100% de cobertura, a escolha do provedor de instrumentação é crítica. O Vitest oferece duas opções principais: v8 e istanbul.

Recomendamos fortemente o uso do **Provedor V8** (coverage.provider: 'v8') para este projeto.14

* **Mecanismo:** Utiliza a funcionalidade de cobertura de código nativa do motor V8 do Node.js.  
* **Vantagens:** Extremamente rápido, pois não requer a reescrita (instrumentação) do código fonte JavaScript. O código é executado "como está".  
* **Precisão:** Com as melhorias recentes no mapeamento de source maps, a precisão do V8 em TypeScript agora rivaliza com o Istanbul.

O uso do Istanbul introduz overhead significativo de processamento e memória, o que pode tornar a execução de testes em CI proibitivamente lenta à medida que o monorepo cresce.

### **5.2. Configuração de Cobertura Estrita por Arquivo**

A meta de "100% de cobertura" é frequentemente mal interpretada como uma média global. No entanto, uma média global de 100% pode esconder arquivos críticos com 0% se houver arquivos de configuração ou utilitários triviais inflando a média. A abordagem profissional exige **100% de cobertura por arquivo** (perFile: true). Isso obriga que cada unidade de código entregue seja testada.15

**Configuração do Backend (apps/backend/vitest.config.ts):**

TypeScript

import { defineConfig } from 'vitest/config';  
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({  
  plugins: \[tsconfigPaths()\],  
  test: {  
    environment: 'node', // Ambiente Node.js para Backend  
    globals: true,  
    restoreMocks: true, // Garante isolamento entre testes  
    coverage: {  
      provider: 'v8',  
      enabled: true,  
      include: \['src/\*\*/\*.ts'\],  
      // Exclusões vitais para evitar falsos positivos  
      exclude:,  
      thresholds: {  
        lines: 100,  
        functions: 100,  
        branches: 100,  
        statements: 100,  
        perFile: true // A regra de ouro para qualidade rigorosa   
      },  
      reporter: \['text', 'json-summary', 'json', 'html'\],  
      reportOnFailure: true, // Garante feedback visual mesmo em falha  
    },  
  },  
});

A flag perFile: true no Vitest altera a validação dos thresholds. Em vez de calcular a soma total de linhas cobertas dividida pelo total de linhas do projeto, ele itera sobre cada arquivo individualmente. Se *qualquer* arquivo estiver abaixo de 100%, o teste falha. Isso cria uma cultura de disciplina imediata: nenhum código novo entra sem teste.

## ---

**6\. Estratégias de Teste Backend: Fastify e Drizzle**

O backend, construído com Fastify e Drizzle, apresenta desafios específicos de integração. A seguir, detalhamos como aplicar a Clean Architecture e testar cada componente.

### **6.1. Testando Repositórios com PGlite (Isolamento de Banco de Dados)**

Tradicionalmente, testes de integração de banco de dados exigem containers Docker (ex: Testcontainers) para subir instâncias reais do PostgreSQL. Embora robusto, isso introduz latência (spin-up time de segundos) e dependência do daemon Docker.

Para um ciclo de feedback rápido, recomendamos o uso do **PGlite** (@electric-sql/pglite). O PGlite compila o PostgreSQL real para WebAssembly (WASM), permitindo executar uma instância completa do Postgres dentro do processo Node.js. Isso permite criar um banco de dados descartável para *cada arquivo de teste* ou até *cada caso de teste*, com tempo de inicialização na ordem de milissegundos.4

**Implementação do Mock de Banco de Dados (apps/backend/tests/setup-db.ts):**

TypeScript

import { PGlite } from '@electric-sql/pglite';  
import { drizzle } from 'drizzle-orm/pglite';  
import { migrate } from 'drizzle-orm/pglite/migrator';  
import \* as schema from '../src/drizzle/schema';

/\*\*  
 \* Cria uma instância isolada do banco de dados para testes.  
 \* Executa todas as migrações automaticamente.  
 \*/  
export async function createTestDatabase() {  
  const client \= new PGlite();  
  const db \= drizzle(client, { schema });  
    
  // Aplica as migrações existentes na pasta drizzle  
  // Isso garante que o teste rode contra a estrutura real do banco  
  await migrate(db, { migrationsFolder: './drizzle' });

  return { db, client };  
}

Esta abordagem satisfaz a necessidade de testar consultas SQL reais (incluindo triggers, views e constraints) sem o overhead de IO de rede ou containers.

### **6.2. Testando Controllers Fastify (Injeção de Dependência)**

O Fastify possui um recurso nativo chamado inject (baseado na biblioteca light-my-way), que simula uma requisição HTTP internamente, sem passar pela pilha de rede do sistema operacional. Isso é muito mais rápido e estável que bibliotecas como supertest.17

Para testar controllers e atingir 100% de cobertura, devemos isolar o controller da camada de serviço. Se testarmos o controller junto com o serviço e o banco de dados (teste ponta-a-ponta), será muito difícil simular erros específicos (ex: falha de conexão, erro desconhecido) para cobrir os ramos de tratamento de erro do controller.

**Exemplo de Teste de Controller com Mock de Serviço:**

TypeScript

// apps/backend/src/modules/user/user.controller.test.ts  
import { describe, it, expect, vi, beforeEach } from 'vitest';  
import { buildApp } from '../../app';  
import { UserService } from './user.service';

// Mockamos a classe de serviço inteira  
vi.mock('./user.service');

describe('UserController', () \=\> {  
  let app: any;

  beforeEach(async () \=\> {  
    // Factory function que constrói o app Fastify  
    app \= await buildApp();  
  });

  it('deve retornar 201 e o ID do usuário ao criar com sucesso', async () \=\> {  
    // Configura o comportamento do mock  
    vi.mocked(UserService.prototype.createUser).mockResolvedValue({  
      id: 1,  
      email: 'teste@exemplo.com',  
      name: 'Teste'  
    });

    const response \= await app.inject({  
      method: 'POST',  
      url: '/users',  
      payload: { email: 'teste@exemplo.com', password: '123' }  
    });

    expect(response.statusCode).toBe(201);  
    expect(response.json()).toEqual(expect.objectContaining({ id: 1 }));  
  });

  it('deve retornar 500 se o serviço lançar erro inesperado', async () \=\> {  
    // Simula um erro que seria difícil de reproduzir com banco real  
    vi.mocked(UserService.prototype.createUser).mockRejectedValue(new Error('Erro Fatal'));

    const response \= await app.inject({  
      method: 'POST',  
      url: '/users',  
      payload: { email: 'teste@exemplo.com', password: '123' }  
    });

    expect(response.statusCode).toBe(500);  
  });  
});

A capacidade de simular o erro 500 é crucial para a métrica de "branches: 100%". Sem mocks, o código de tratamento de exceções globais do Fastify raramente seria exercitado nos testes.

## ---

**7\. Estratégias de Teste Frontend: React 18 e Testing Library**

O desenvolvimento com React 18 introduziu conceitos de concorrência que, embora transparentes na maioria dos casos, exigem que os testes sejam robustos quanto à assincronidade. A Testing Library é a ferramenta padrão, pois foca no teste do comportamento do usuário em vez da implementação interna (como o estado do componente).

### **7.1. Configuração do Ambiente JSDOM**

Diferente do backend, o frontend precisa de um ambiente que simule o navegador. O jsdom é o padrão da indústria, mas deve ser configurado corretamente no Vitest.

**Configuração do Frontend (apps/frontend/vitest.config.ts):**

TypeScript

import { defineConfig } from 'vitest/config';  
import react from '@vitejs/plugin-react';  
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({  
  plugins: \[react(), tsconfigPaths()\],  
  test: {  
    environment: 'jsdom', // Simulação de Browser  
    globals: true,  
    setupFiles: \['./src/tests/setup.ts'\], // Arquivo crítico para matchers do DOM  
    coverage: {  
      provider: 'v8',  
      include: \['src/components/\*\*/\*.tsx', 'src/hooks/\*\*/\*.ts', 'src/pages/\*\*/\*.tsx'\],  
      exclude: \['src/main.tsx', 'src/vite-env.d.ts'\],  
      thresholds: {  
        branches: 100,  
        functions: 100,  
        lines: 100,  
        statements: 100,  
        perFile: true  
      },  
    },  
  },  
});

**Arquivo de Setup (apps/frontend/src/tests/setup.ts):**

TypeScript

import '@testing-library/jest-dom'; // Estende o expect com matchers como.toBeInTheDocument()  
import { cleanup } from '@testing-library/react';  
import { afterEach } from 'vitest';

// Limpeza automática do DOM virtual após cada teste para evitar vazamentos de memória e estado  
afterEach(() \=\> {  
  cleanup();  
});

### **7.2. Testando Hooks Customizados e Contexto**

Para atingir 100% de cobertura, frequentemente precisamos testar Hooks customizados complexos ou Providers de Contexto que contêm lógica de autenticação ou gerenciamento de estado global. A função renderHook da Testing Library é essencial aqui.

**Exemplo: Testando um AuthHook:**

TypeScript

// apps/frontend/src/hooks/useAuth.test.tsx  
import { renderHook, act, waitFor } from '@testing-library/react';  
import { useAuth } from './useAuth';  
import { AuthProvider } from '../context/AuthContext';

describe('useAuth Hook', () \=\> {  
  // Wrapper necessário para fornecer o Contexto ao Hook isolado  
  const wrapper \= ({ children }: { children: React.ReactNode }) \=\> (  
    \<AuthProvider\>{children}\</AuthProvider\>  
  );

  it('deve realizar login e atualizar estado', async () \=\> {  
    const { result } \= renderHook(() \=\> useAuth(), { wrapper });

    expect(result.current.user).toBeNull();

    // Todas as atualizações de estado devem ser envolvidas em act()  
    // React 18 é rigoroso quanto a isso para garantir consistência no batching  
    await act(async () \=\> {  
      await result.current.login('user@test.com', 'password');  
    });

    await waitFor(() \=\> {  
        expect(result.current.user).toEqual(expect.objectContaining({ email: 'user@test.com' }));  
    });  
  });  
});

A utilização de act e waitFor é mandatória para lidar com as atualizações assíncronas de estado do React 18, prevenindo warnings de "state update on unmounted component" e garantindo que as asserções ocorram somente após o ciclo de renderização estabilizar.

## ---

**8\. Padrões de Geração de Dados: Factories Robustas**

Hardcoding de objetos literais em testes ("fixtures" estáticas) é um dos maiores obstáculos para a manutenção de testes em larga escala. À medida que o schema do banco de dados ou as interfaces TypeScript evoluem, atualizar centenas de arquivos de teste que instanciam objetos manualmente torna-se inviável.

A solução profissional é o padrão **Object Mother** ou **Test Data Factory**. Recomendamos a biblioteca **Fishery** 19 por sua integração tipada com TypeScript, superior a soluções legadas como faker puro.

### **8.1. Implementação com Fishery e Drizzle**

Podemos criar factories que não apenas geram dados tipados, mas também conhecem como persisti-los no banco de dados de teste (PGlite) automaticamente.

TypeScript

// packages/test-utils/factories/user.factory.ts  
import { Factory } from 'fishery';  
import { db } from '../db-connection'; // Instância do PGlite  
import { users } from 'apps/backend/src/drizzle/schema';  
import { InferInsertModel } from 'drizzle-orm';

type UserInsert \= InferInsertModel\<typeof users\>;

export const userFactory \= Factory.define\<UserInsert\>(({ sequence, onCreate }) \=\> {  
  // Define o comportamento ao chamar.create()  
  onCreate(async (user) \=\> {  
    const \[inserted\] \= await db.insert(users).values(user).returning();  
    return inserted;  
  });

  return {  
    id: sequence,  
    email: \`user-${sequence}@exemplo.com\`,  
    name: 'Usuário Padrão',  
    passwordHash: 'hash\_seguro',  
    createdAt: new Date(),  
    updatedAt: new Date(),  
  };  
});

**Uso nos Testes:**

TypeScript

// Cria objeto em memória (sem ir ao DB) \- Rápido para testes de Use Case  
const userModel \= userFactory.build({ name: 'Nome Específico' });

// Cria e persiste no DB \- Necessário para testes de Repositório/Integração  
const savedUser \= await userFactory.create();

Este padrão desacopla os testes da estrutura exata dos dados. Se adicionarmos um campo obrigatório age à tabela users, basta atualizar a definição na userFactory em um único lugar, e todos os testes que usam a factory continuarão passando (assumindo que o campo age tem um valor default válido na factory).

## ---

**9\. Pipeline de CI/CD: Orquestração e Gates de Qualidade**

A infraestrutura local é inútil sem um pipeline de Integração Contínua que aplique as regras de forma draconiana. Utilizaremos **GitHub Actions** para orquestrar o processo. O objetivo é falhar rápido em caso de erros e otimizar o tempo de execução através de paralelismo.

### **9.1. Estratégia de Matriz e Paralelismo**

Em um monorepo, rodar testes sequencialmente (Backend depois Frontend) duplica o tempo de espera. A estratégia de **Matrix** do GitHub Actions permite disparar jobs paralelos para cada workspace.20

### **9.2. Workflow de CI Completo (.github/workflows/ci.yml)**

Este workflow implementa caching inteligente, execução paralela, merge de relatórios de cobertura e feedback automático em Pull Requests.

YAML

name: Quality Gate & CI

on:  
  pull\_request:  
    branches: \[main\]  
  push:  
    branches: \[main\]

jobs:  
  \# Job 1: Verificações Estáticas (Lint e Tipos) \- Executa rápido  
  static-checks:  
    name: Static Analysis  
    runs-on: ubuntu-latest  
    steps:  
      \- uses: actions/checkout@v4  
      \- uses: actions/setup-node@v4  
        with:  
          node-version: 20  
          cache: 'npm'  
      \- run: npm ci  
        
      \# Verifica formatação e regras do ESLint 9  
      \- name: Linting  
        run: npm run lint  
        
      \# Verifica integridade dos tipos TypeScript  
      \# Crucial: Vitest não verifica tipos por padrão, este passo é obrigatório  
      \- name: Type Check  
        run: npm run type-check \# Executa "tsc \--noEmit \-b" na raiz

  \# Job 2: Testes Automatizados (Matriz Paralela)  
  test:  
    name: Test ${{ matrix.workspace }}  
    needs: static-checks  
    runs-on: ubuntu-latest  
    strategy:  
      fail-fast: false \# Não cancela outros jobs se um falhar (queremos ver todos os erros)  
      matrix:  
        workspace: \['apps/backend', 'apps/frontend'\]  
      
    steps:  
      \- uses: actions/checkout@v4  
      \- uses: actions/setup-node@v4  
        with:  
          node-version: 20  
          cache: 'npm'  
        
      \- run: npm ci  
        
      \# Executa Vitest com geração de relatórios JSON para processamento posterior  
      \- name: Run Vitest Coverage  
        run: |  
          npm run test:coverage \-w ${{ matrix.workspace }} \-- \\  
            \--reporter=json-summary \\  
            \--reporter=json \\  
            \--outputFile.json=./coverage/coverage-final.json \\  
            \--outputFile.json-summary=./coverage/coverage-summary.json  
        
      \# Upload dos artefatos de cobertura para o próximo job  
      \- name: Upload Coverage Artifact  
        uses: actions/upload-artifact@v4  
        with:  
          name: coverage-${{ strategy.job\_index }} \# Nome único para cada slice da matriz  
          path: ${{ matrix.workspace }}/coverage/

  \# Job 3: Gate de Cobertura e Reporte  
  coverage-gate:  
    name: Coverage Enforcement  
    needs: test  
    runs-on: ubuntu-latest  
    if: always() \# Executa mesmo se os testes falharem (para reportar onde falhou)  
    steps:  
      \- uses: actions/checkout@v4  
        
      \# Baixa todos os artefatos gerados pela matriz  
      \- name: Download All Coverage Artifacts  
        uses: actions/download-artifact@v4  
        with:  
          path: all-coverage  
        
      \# Usa a action 'vitest-coverage-report' para comentar no PR  
      \# Em monorepos, precisamos apontar para múltiplos arquivos de resumo \[21\]  
      \- name: Vitest Coverage Report  
        uses: davelosert/vitest-coverage-report-action@v2  
        with:  
          github-token: ${{ secrets.GITHUB\_TOKEN }}  
          \# Caminhos dinâmicos baseados no download do artifact  
          json-summary-path: |  
            all-coverage/coverage-0/coverage-summary.json  
            all-coverage/coverage-1/coverage-summary.json  
          json-final-path: |  
            all-coverage/coverage-0/coverage-final.json  
            all-coverage/coverage-1/coverage-final.json

### **9.3. Análise do Workflow**

1. **Fail Fast no Type Check:** A checagem de tipos (tsc) é separada e executada antes dos testes. Se houver erro de tipagem, não gastamos ciclos de CPU rodando testes.  
2. **Paralelismo:** Backend e Frontend rodam em máquinas virtuais separadas. Se o backend demorar 2 min e o frontend 3 min, o tempo total é \~3 min, não 5 min.  
3. **Artefatos:** A passagem de dados entre jobs (upload/download artifact) é essencial para coletar as métricas de cobertura geradas nas máquinas efêmeras e consolidá-las em um relatório unificado no final.22  
4. **Feedback Visual:** A action davelosert/vitest-coverage-report-action lê os JSONs gerados e posta um comentário detalhado no PR, mostrando a evolução da cobertura e alertando sobre arquivos que não atingiram a meta.

## ---

**10\. Conclusão**

A configuração de uma estrutura de testes profissional para um monorepo TypeScript moderno exige uma orquestração meticulosa de ferramentas de ponta. Ao adotar **Vitest** com o provedor **V8**, eliminamos gargalos de performance. A integração de **PGlite** revoluciona os testes de banco de dados, permitindo validações de integração com a velocidade de testes unitários. O **ESLint 9 Flat Config** e o **TypeScript Strict** formam uma barreira estática impenetrável contra erros comuns, enquanto o pipeline de **CI/CD** com matrizes garante que a escalabilidade do projeto não comprometa o tempo de entrega.

A adesão a 100% de cobertura por arquivo, suportada por uma **Clean Architecture** que isola logicamente os componentes, transforma a suíte de testes de um custo operacional em um ativo estratégico, permitindo refatorações agressivas e evolução contínua do sistema com total confiança.

#### **Referências citadas**

1. Vitest vs Jest | Better Stack Community, acessado em dezembro 27, 2025, [https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)  
2. Configuration Files \- ESLint \- Pluggable JavaScript Linter, acessado em dezembro 27, 2025, [https://eslint.org/docs/latest/use/configure/configuration-files](https://eslint.org/docs/latest/use/configure/configuration-files)  
3. Switching to ESLint's Flat Config Format \- Nx, acessado em dezembro 27, 2025, [https://nx.dev/docs/technologies/eslint/guides/flat-config](https://nx.dev/docs/technologies/eslint/guides/flat-config)  
4. \[TUTORIAL\]: Using in-memory Postgres when testing with vitest \#4205 \- GitHub, acessado em dezembro 27, 2025, [https://github.com/drizzle-team/drizzle-orm/issues/4205](https://github.com/drizzle-team/drizzle-orm/issues/4205)  
5. How to Test Your Node.js & Postgres App Using Drizzle & PGlite \- DEV Community, acessado em dezembro 27, 2025, [https://dev.to/benjamindaniel/how-to-test-your-nodejs-postgres-app-using-drizzle-pglite-38h](https://dev.to/benjamindaniel/how-to-test-your-nodejs-postgres-app-using-drizzle-pglite-38h)  
6. From Chaos to Confidence: A Practical Guide to Unit Testing in Clean Architecture, acessado em dezembro 27, 2025, [https://tech.raisa.com/from-chaos-to-confidence-a-practical-guide-to-unit-testing-in-clean-architecture-2/](https://tech.raisa.com/from-chaos-to-confidence-a-practical-guide-to-unit-testing-in-clean-architecture-2/)  
7. Test Projects | Guide \- Vitest, acessado em dezembro 27, 2025, [https://vitest.dev/guide/projects](https://vitest.dev/guide/projects)  
8. Improving Performance | Vitest 2 Docs \- GetBook, acessado em dezembro 27, 2025, [https://www.getbook.com/en/book/vitest-2/guide/improving-performance](https://www.getbook.com/en/book/vitest-2/guide/improving-performance)  
9. Plugin Migration to Flat Config \- ESLint \- Pluggable JavaScript Linter, acessado em dezembro 27, 2025, [https://eslint.org/docs/latest/extend/plugin-migration-flat-config](https://eslint.org/docs/latest/extend/plugin-migration-flat-config)  
10. Getting Started \- typescript-eslint, acessado em dezembro 27, 2025, [https://typescript-eslint.io/getting-started/](https://typescript-eslint.io/getting-started/)  
11. eslint plugin for vitest \- GitHub, acessado em dezembro 27, 2025, [https://github.com/vitest-dev/eslint-plugin-vitest](https://github.com/vitest-dev/eslint-plugin-vitest)  
12. Coverage | Guide \- Vitest, acessado em dezembro 27, 2025, [https://vitest.dev/guide/coverage.html](https://vitest.dev/guide/coverage.html)  
13. Command Line Interface | Guide \- Vitest, acessado em dezembro 27, 2025, [https://v2.vitest.dev/guide/cli](https://v2.vitest.dev/guide/cli)  
14. Get Started with Drizzle and PGlite \- Drizzle ORM \- PostgreSQL, acessado em dezembro 27, 2025, [https://orm.drizzle.team/docs/get-started/pglite-new](https://orm.drizzle.team/docs/get-started/pglite-new)  
15. Testing | Fastify, acessado em dezembro 27, 2025, [https://fastify.dev/docs/v1.14.x/Documentation/Testing/](https://fastify.dev/docs/v1.14.x/Documentation/Testing/)  
16. Preparing Fastify for Testing \- Jonas Galvez, acessado em dezembro 27, 2025, [https://hire.jonasgalvez.com.br/2023/jan/31/fastify-testing/](https://hire.jonasgalvez.com.br/2023/jan/31/fastify-testing/)  
17. thoughtbot/fishery: A library for setting up JavaScript objects as test data \- GitHub, acessado em dezembro 27, 2025, [https://github.com/thoughtbot/fishery](https://github.com/thoughtbot/fishery)  
18. Optimizing GitHub Actions with Matrix Builds for Concurrent Testing Across Multiple Environments · community · Discussion \#148131, acessado em dezembro 27, 2025, [https://github.com/orgs/community/discussions/148131](https://github.com/orgs/community/discussions/148131)  
19. Store and share data with workflow artifacts \- GitHub Docs, acessado em dezembro 27, 2025, [https://docs.github.com/en/actions/tutorials/store-and-share-data](https://docs.github.com/en/actions/tutorials/store-and-share-data)