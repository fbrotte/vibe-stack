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
- LLM : Via LiteLLM (`modules/llm/llm.service.ts`)
- Python : Scripts standalone dans `scripts/python/`, appeles via `pythonService.runScript()`

## Commandes

```bash
make dev              # Lance le projet
make docker-up        # Lance postgres + redis
make db-migrate       # Migrations Prisma
make db-studio        # Interface BDD
make test             # Lance tous les tests
make test-api         # Tests API uniquement
make test-web         # Tests Web uniquement
make test-cov         # Tests avec coverage
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

## A eviter

- class-validator (utiliser Zod)
- localStorage direct pour l'auth (utiliser `useAuthStore`)
- Appels LLM directs (passer par LiteLLM)
- Code Python dans NestJS (utiliser les scripts)
- Dependances hors workspace
- Jest (utiliser Vitest)
