# CLAUDE.md

## Stack

- Monorepo Bun : `apps/web` (React/Vite), `apps/api` (NestJS)
- Validation : Zod uniquement (pas class-validator), schemas dans `packages/shared/src/schemas/`
- API : tRPC par défaut, REST si besoin externe
- ORM : Prisma, schema dans `prisma/schema.prisma`
- LLM : Via LiteLLM (`modules/llm/llm.service.ts`)
- Python : Scripts standalone dans `scripts/python/`, appelés via `pythonService.runScript()`

## Commandes

```bash
make dev              # Lance le projet
make docker-up        # Lance postgres + redis
make db-migrate       # Migrations Prisma
make db-studio        # Interface BDD
```

## Conventions

- Nouveaux modules API dans `apps/api/src/modules/`
- Nouveaux routers tRPC dans `apps/api/src/trpc/routers/`
- Schemas Zod partagés dans `packages/shared/src/schemas/`
- Composants UI avec shadcn/ui + Tailwind

## À éviter

- class-validator (utiliser Zod)
- Appels LLM directs (passer par LiteLLM)
- Code Python dans NestJS (utiliser les scripts)
- Dépendances hors workspace
