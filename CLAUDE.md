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
make dev              # Lance le projet (utilise local-services pour DB/Redis)
make docker-up        # Lance postgres + redis locaux (si pas local-services)
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

## Ecosysteme de repos

Ce projet fait partie d'un ecosysteme de repos interconnectes :

### `~/Dev/local-services/` — Infrastructure de dev partagee

Services Docker mutualises entre tous les projets de dev :

| Service    | Conteneur        | Port      | Image                  |
| ---------- | ---------------- | --------- | ---------------------- |
| PostgreSQL | `local-postgres` | 5432      | pgvector/pgvector:pg16 |
| MariaDB    | `local-mariadb`  | 3306      | mariadb:11             |
| Redis      | `local-redis`    | 6379      | redis:7-alpine         |
| Minio S3   | `local-minio`    | 9000/9001 | minio/minio            |
| Mailpit    | `local-mailpit`  | 1025/8025 | axllent/mailpit        |
| LiteLLM    | `local-litellm`  | 4001      | berriai/litellm        |
| Caddy      | `local-caddy`    | 80/443    | caddy:2-alpine         |
| Portal     | `local-portal`   | 4000      | custom                 |

**Commande** : `cd ~/Dev/local-services && make up`

**IMPORTANT** : En dev, NE PAS lancer de containers PostgreSQL/Redis dans le projet (`make docker-up`), utiliser ceux de local-services. Le `docker-compose.yml` du projet est un fallback si local-services n'est pas disponible.

### `~/Dev/server-infra/` — Infrastructure de production

Serveur auto-heberge (Debian) avec deploiement automatique :

- **Caddy** : Reverse proxy avec SSL automatique Let's Encrypt
- **PostgreSQL** : Partage entre projets (1 database par projet, pgvector)
- **Redis** : Partage, password protege
- **LiteLLM** : Proxy LLM (Anthropic, OpenAI)
- **GitHub Actions Runner** : Self-hosted, sert tous les repos
- **Backup** : Cron automatise (3h, retention 7j)
- **Network Docker** : `server-infra` (tous les containers du projet s'y connectent)
- **Pattern deployment** : Push main → runner pull → docker build → restart
- **Template Caddyfile** : `/trpc/*` → API (streaming), `/api/*` → API, `/uploads/*` → API, reste → frontend

### `~/Dev/vibe-stack-modules/` — Modules reutilisables

Modules a copier dans les projets selon les besoins :

| Module            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `magic-link`      | Auth par magic link (backend + frontend + Prisma)    |
| `editor-tabs`     | Systeme d'onglets type IDE avec DnD (Zustand + dnd-kit) |
| `langgraph-debug` | Panel de debug pour prompts LangGraph                |
| `mail-discovery`  | Auto-decouverte de config mail (ISPDB/autoconfig/SRV)|
| `resource-actions` | Actions contextuelles par type de ressource         |
| `app-ux-defaults` | Hooks UX (disable context menu natif, etc.)          |

- **Structure standard** : `backend/`, `frontend/` ou `hooks/`, `shared/`, `prisma/`
- **Installation** : Copier le module dans le projet et adapter les imports
- **Guide** : Voir `~/Dev/vibe-stack-modules/CONTRIBUTING.md`

## Integration local-services (Caddy reverse proxy)

Pour que le projet soit accessible via `{projet}.localhost` avec le reverse proxy Caddy de local-services :

### Configuration requise

1. **`.env`** — URLs relatives (Caddy route directement vers le backend) :
   ```bash
   PORT="3000"
   VITE_PORT="3001"
   VITE_API_URL="/api"
   VITE_TRPC_URL="/trpc"
   ```

2. **`vite.config.ts`** — Accepter les connexions Caddy :
   - `loadEnv()` pour charger les variables au niveau config
   - Ports configurables via `.env` (`VITE_PORT`, `PORT`)
   - `host: true` et `allowedHosts: true`
   - Proxy `/api` et `/trpc` vers le backend

3. **`main.ts`** — CORS ouvert en dev :
   ```typescript
   app.enableCors({ origin: true, credentials: true })
   ```

4. **`trpc.router.ts`** — Middleware anti-double `Transfer-Encoding: chunked` :
   - Caddy + tRPC streaming = double header chunked = 502
   - Le middleware supprime `Transfer-Encoding` avant le premier write

5. **Portal local-services** — Enregistrer le projet avec `frontend_port` et `backend_port`

### Flux des requetes

```
{projet}.localhost        → Caddy → Vite (:VITE_PORT)     # statiques
{projet}.localhost/trpc/* → Caddy → NestJS (:PORT)         # tRPC (bypass Vite)
{projet}.localhost/api/*  → Caddy → NestJS (:PORT)         # REST API
```

## Deployment production

### Pattern standard

1. **`docker-compose.prod.yml`** : API + Web connectes au network `server-infra`
   - API utilise `server-postgres` et `server-redis` (pas de DB locale)
   - Web sert les fichiers statiques via Nginx

2. **Dockerfiles multi-stage** :
   - `Dockerfile.api` : deps → build → prod-deps → runtime (node:22-alpine)
   - `Dockerfile.web` : build (bun + vite) → runtime (nginx:alpine)

3. **GitHub Actions** (`.github/workflows/deploy.yml`) :
   - Trigger : push sur `main` ou manual dispatch
   - Runner : self-hosted sur le serveur
   - Steps : pull → build → deploy → migrate → tag version

4. **Caddyfile production** (dans `server-infra/caddy/Caddyfile`) :
   ```
   monprojet.mondomaine.com {
     handle /trpc/* {
       reverse_proxy monprojet-api:3000 {
         flush_interval -1    # streaming tRPC
       }
     }
     handle /api/* {
       reverse_proxy monprojet-api:3000
     }
     handle /uploads/* {
       reverse_proxy monprojet-api:3000
     }
     handle {
       reverse_proxy monprojet-web:80
     }
   }
   ```

### Deployer un nouveau projet

1. Sur le serveur : `cd ~/server-infra && make add-project` (cree la DB + le Caddyfile)
2. Cloner le repo dans `~/projects/{nom}/`
3. Configurer `.env.prod`
4. Enregistrer le GitHub runner sur le repo
5. Push sur `main` → deploiement automatique

## Conventions

- Nouveaux modules API dans `apps/api/src/modules/`
- Structure standard d'un module backend :
  - `{module}.service.ts` (business logic)
  - `{module}.trpc.ts` (routes tRPC)
  - `{module}.module.ts` (NestJS module)
  - `__tests__/{module}.spec.ts` (tests Vitest)
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
- `PrismaService` : Methodes `softDelete()` et `restore()` disponibles, gestion `onModuleInit`/`onModuleDestroy`
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

## Verification du code

**IMPORTANT** : Le type-checking TypeScript (`tsc --noEmit`) peut consommer trop de memoire sur les gros projets (>8GB, crash OOM) a cause des types complexes de LangChain/LangGraph.

Pour verifier le code :

- **Utiliser `make lint`** : ESLint est leger et detecte les erreurs importantes
- **Eviter `bunx tsc --noEmit`** : Risque de crash OOM sur gros projets
- **`make dev` fonctionne** : tsx compile a la volee sans probleme

## Migrations Prisma

**IMPORTANT** : Regles strictes pour eviter les problemes de drift.

### A faire

- Toujours utiliser `bunx prisma migrate dev --name description_migration` pour creer une migration
- Creer une NOUVELLE migration pour tout changement de schema, meme pour corriger une erreur
- Tester la migration localement avant de commit

### A NE JAMAIS faire

- **JAMAIS modifier un fichier de migration deja applique** (execute via `migrate dev`)
  - Avant execution : on peut modifier/supprimer librement
  - Apres execution : le checksum est enregistre, toute modif = drift
- **JAMAIS utiliser `prisma db push`** en dev ou prod (modifie la base sans migration)
- **JAMAIS utiliser `prisma migrate reset`** sauf cas extreme en dev local avec accord explicite

### Pourquoi

Prisma stocke un checksum de chaque migration. Si le fichier change apres application, Prisma detecte un "drift" et refuse les nouvelles migrations. Le probleme se propage a tous les environnements.

## A eviter

- class-validator (utiliser Zod)
- localStorage direct pour l'auth (utiliser `useAuthStore`)
- Appels LLM directs (passer par AiService)
- Code Python dans NestJS (utiliser les scripts)
- Dependances hors workspace
- Jest (utiliser Vitest)
- `tsc --noEmit` pour type-checking (utiliser `make lint`)
