# Mise a jour Vibe-Stack Template - Plan de travail

> Cree le 2026-02-18 apres analyse de l'ecosysteme complet

## Contexte

La template vibe-stack doit etre mise a jour pour :
1. Documenter l'ecosysteme de repos associes (local-services, server-infra, vibe-stack-modules)
2. Integrer les ameliorations d'architecture faites dans Merendella
3. Assurer la compatibilite avec local-services (reverse proxy Caddy)

---

## A. Documentation ecosysteme dans CLAUDE.md

### A1. Ajouter la section "Ecosysteme de repos"
Documenter dans CLAUDE.md les repos freres et leur role :

- **`~/Dev/local-services/`** : Infrastructure de dev partagee
  - PostgreSQL 16 + pgvector (port 5432)
  - MariaDB 11 (port 3306)
  - Redis 7 (port 6379)
  - Minio S3 (port 9000/9001)
  - Mailpit (port 1025/8025)
  - LiteLLM proxy (port 4001)
  - Caddy reverse proxy (port 80)
  - Portal de gestion (port 4000)
  - **Commande** : `cd ~/Dev/local-services && make up`
  - **Implication** : En dev, NE PAS lancer de containers PostgreSQL/Redis dans le projet, utiliser ceux de local-services

- **`~/Dev/server-infra/`** : Infrastructure de production (serveur auto-heberge)
  - PostgreSQL partage entre projets
  - LiteLLM proxy (modeles Anthropic, OpenAI, Gemini)
  - Caddy reverse proxy avec SSL Let's Encrypt
  - GitHub Actions self-hosted runner
  - Backup automatise (cron 3h, retention 7j)
  - **Pattern deployment** : Push main -> runner pull -> rebuild -> restart
  - **Template Caddyfile** : `/trpc/*` et `/api/*` -> backend, reste -> frontend

- **`~/Dev/vibe-stack-modules/`** : Modules reutilisables a importer dans les projets
  - 6 modules disponibles :
    - `magic-link` : Auth par magic link (backend NestJS + frontend React + Prisma)
    - `editor-tabs` : Systeme d'onglets type IDE avec DnD (Zustand + dnd-kit)
    - `langgraph-debug` : Panel de debug pour prompts LangGraph
    - `mail-discovery` : Auto-decouverte de config mail (ISPDB/autoconfig/SRV)
    - `resource-actions` : Systeme d'actions contextuelles par type de ressource
    - `app-ux-defaults` : Hooks UX (disable context menu natif, etc.)
  - **Structure standard** : `backend/`, `frontend/` ou `hooks/`, `shared/`, `prisma/`
  - **Installation** : Copier le module dans le projet et adapter les imports

### A2. Ajouter la section "Integration local-services"
Instructions pour que chaque nouveau projet soit compatible Caddy :

- Variables `.env` : URLs relatives (`VITE_API_URL="/api"`, `VITE_TRPC_URL="/trpc"`)
- Config `vite.config.ts` : `host: true`, `allowedHosts: true`, proxy `/api` et `/trpc`
- CORS dans `main.ts` : `origin: true` en dev
- Middleware tRPC : Suppression du double `Transfer-Encoding: chunked`
- Enregistrement dans le Portal local-services

### A3. Ajouter la section "Deployment production"
Pattern de deploiement standard :
- docker-compose.prod.yml avec full stack
- Dockerfiles multi-stage (API + Web)
- GitHub Actions workflow pour self-hosted runner
- Pattern Caddy production (SSL auto, /trpc/* et /api/*)

---

## B. Changements d'architecture (inspires de Merendella)

### B1. Mise a jour vite.config.ts
- [ ] Charger les variables `.env` via `loadEnv()` au niveau de la config
- [ ] Rendre les ports configurables via `.env` (`VITE_PORT`, `PORT`)
- [ ] Ajouter `host: true` et `allowedHosts: true`
- [ ] Ajouter les proxies `/api` et `/trpc` vers le backend

### B2. Mise a jour du client tRPC
- [ ] Rendre l'URL tRPC configurable via `VITE_TRPC_URL` (defaut: `/trpc`)
- [ ] Verifier que le httpBatchStreamLink est correctement configure

### B3. Mise a jour main.ts (NestJS)
- [ ] CORS avec `origin: true` en dev
- [ ] S'assurer que les endpoints health check sont en place

### B4. Middleware tRPC anti-double-chunked
- [ ] Ajouter le middleware qui supprime `Transfer-Encoding` dans `trpc.router.ts`
- [ ] Documenter pourquoi ce middleware existe (probleme Caddy + tRPC streaming)

### B5. Variables d'environnement
- [ ] Mettre a jour `.env.example` avec les nouvelles variables :
  - `VITE_PORT` (port frontend)
  - `PORT` (port backend)
  - `VITE_API_URL` (URL API relative)
  - `VITE_TRPC_URL` (URL tRPC relative)
  - Variables local-services (DATABASE_URL, REDIS_URL, S3_*, MAIL_*)
  - Variables LiteLLM (`LITELLM_BASE_URL`, `LITELLM_MASTER_KEY`)

### B6. Mise a jour Makefile
- [ ] Verifier que `make setup` couvre le workflow avec local-services
- [ ] Distinguer `make docker-up` (services locaux propres) vs `make dev` (utilise local-services)
- [ ] Ajouter `make docker-up-llm` si pertinent

### B7. Docker production
- [ ] Verifier/ajouter `docker-compose.prod.yml`
- [ ] Verifier/ajouter `Dockerfile.api` (multi-stage: deps -> build -> prod-deps -> runtime)
- [ ] Verifier/ajouter `Dockerfile.web` (multi-stage: build -> nginx runtime)
- [ ] Template `.github/workflows/deploy.yml` pour self-hosted runner

---

## C. Ameliorations globales (patterns Merendella)

### C1. Pattern module backend
- [ ] Verifier que la structure module standard est bien documentee :
  - `{module}.service.ts` (business logic)
  - `{module}.trpc.ts` (routes tRPC)
  - `{module}.module.ts` (NestJS module)
  - `__tests__/{module}.spec.ts` (tests Vitest)

### C2. PrismaService enrichi
- [ ] Verifier que `softDelete()` et `restore()` sont disponibles dans PrismaService
- [ ] Verifier que la gestion `onModuleInit`/`onModuleDestroy` est correcte

### C3. Type checking
- [ ] Documenter le warning sur `tsc --noEmit` qui peut OOM sur gros projets
- [ ] Recommander `make lint` (ESLint) plutot que tsc direct

### C4. Migration rules
- [ ] Documenter les regles strictes de migration Prisma dans CLAUDE.md :
  - Ne jamais modifier une migration appliquee
  - Ne jamais utiliser `prisma db push` en production
  - Toujours creer une nouvelle migration pour les changements

---

## Ordre d'execution recommande

```
Phase 1 - Documentation CLAUDE.md        ~30 min
  A1 (ecosysteme repos)
  A2 (integration local-services)
  A3 (deployment production)

Phase 2 - Changements code                ~1-2h
  B1 (vite.config.ts)
  B2 (client tRPC)
  B3 (main.ts CORS)
  B4 (middleware anti-chunked)
  B5 (.env.example)
  B6 (Makefile)

Phase 3 - Docker production               ~30 min
  B7 (docker-compose.prod, Dockerfiles, CI)

Phase 4 - Patterns et conventions          ~15 min
  C1-C4 (documentation patterns)
```

---

## Notes

- Ne pas copier la logique metier de Merendella (mail, spaces, AI) dans la template
- Garder la template legere : fournir les fondations et la documentation
- Les modules specifiques sont dans vibe-stack-modules et s'importent au besoin
- Tester que la template fonctionne avec et sans local-services
