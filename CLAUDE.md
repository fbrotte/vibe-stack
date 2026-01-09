# CLAUDE.md

## Stack

- Monorepo Bun : `apps/web` (React/Vite), `apps/api` (NestJS)
- Validation : Zod uniquement (pas class-validator), schemas dans `packages/shared/src/schemas/`
- API : tRPC par defaut, REST si besoin externe
- ORM : Prisma, schema dans `prisma/schema.prisma`
- State management : Zustand (`stores/auth.store.ts`)
- Data fetching : TanStack Query (via tRPC)
- Tests : Vitest (unitaires et integration)
- Logging : Pino via `LoggerService`
- AI : Module unifie LangChain/LangGraph (`modules/ai/ai.service.ts`) via LiteLLM + Langfuse
- Python : Scripts standalone dans `scripts/python/`, appeles via `pythonService.runScript()`

## Commandes

```bash
make setup            # Installation complete (install + docker + migrate + seed)
make dev              # Lance le projet
make docker-up        # Lance postgres + redis (base)
make docker-up-llm    # Lance base + litellm
make db-migrate       # Migrations Prisma
make db-studio        # Interface BDD
make test             # Lance tous les tests
make test-api         # Tests API uniquement
make test-web         # Tests Web uniquement
make test-cov         # Tests avec coverage
make lint             # Lance ESLint
make format           # Formate le code (Prettier + ESLint)
```

## Conventions

- Nouveaux modules API dans `apps/api/src/modules/`
- Chaque module a son fichier tRPC : `{module}.trpc.ts`
- Schemas Zod partages dans `packages/shared/src/schemas/`
- Tests dans le meme dossier que le fichier teste : `*.spec.ts`
- Composants UI avec shadcn/ui + Tailwind
- State global via Zustand stores dans `apps/web/src/stores/`

## Architecture Frontend

- Auth state : `useAuthStore` (Zustand avec persistance localStorage)
- tRPC client avec refresh token automatique dans `lib/trpc.ts`
- Routes protegees via `ProtectedRoute` component

## Architecture Backend

- `LoggerService` : Injectable Pino logger (global)
- `PrismaService` : Methodes `softDelete()` et `restore()` disponibles
- tRPC error formatter : Erreurs Zod formatees automatiquement
- Auth : JWT access token (15m) + refresh token (7d) en DB

## Module AI (LangChain/LangGraph)

Structure du module `modules/ai/` :

- `ai.service.ts` : Service principal avec appels directs et helpers LangGraph
- `providers/` : Configuration ChatOpenAI (LiteLLM) et PostgresSaver (checkpointer)
- `graphs/` : Dossier pour les StateGraphs LangGraph
- `tools/` : Dossier pour les tools LangChain
- `rag/` : Dossier pour les pipelines RAG
- `memory/` : Dossier pour la gestion memoire

Methodes principales de `AiService` :

- `chatCompletion(params)` : Appel LLM direct avec tracing Langfuse
- `embedding(params)` : Embeddings via LiteLLM
- `getModel()` : Retourne un ChatOpenAI pour LangGraph
- `getCheckpointer()` : Retourne le PostgresSaver pour persistance

Tracing Langfuse (SDK direct, pas de callback) :

- `langfuseService.createTrace()` : Trace parent pour un workflow
- `trace.span()` : Span enfant pour une etape/noeud
- `trace.generation()` : Pour les appels LLM (avec input/output/usage)
- `langfuseService.flush()` : Envoyer les traces (async)

Exemple d'usage LangGraph avec tracing :

```typescript
const model = aiService.getModel()
const checkpointer = aiService.getCheckpointer()
const trace = langfuseService.createTrace({ name: 'my-agent', userId })

const graph = new StateGraph(MessagesAnnotation)
  .addNode('agent', async (state) => {
    const gen = trace.generation({ name: 'llm-call', model: 'gpt-4o' })
    const result = await model.invoke(state.messages)
    gen.end({ output: result.content })
    return result
  })
  .compile({ checkpointer })

await graph.invoke(state)
await langfuseService.flush()
```

## Mode Demo (presentations client)

Pour creer une demo interactive avec fausses donnees (sans backend) :

1. Creer `apps/web/.env` avec `VITE_DEMO_MODE=true`
2. Lancer `cd apps/web && bun run dev`
3. Voir `apps/web/DEMO.md` pour la documentation complete

Structure : `apps/web/src/demo/` contient le systeme de mock data et hooks.

## A eviter

- class-validator (utiliser Zod)
- localStorage direct pour l'auth (utiliser `useAuthStore`)
- Appels LLM directs (passer par AiService)
- Code Python dans NestJS (utiliser les scripts)
- Dependances hors workspace
- Jest (utiliser Vitest)
