# Template Dev

Full-stack TypeScript/Python monorepo template optimized for rapid development with AI coding assistants.

## Quick Start

```bash
git clone <your-repo>
cd my-project
make setup
make dev
```

Le `make setup` crée automatiquement le fichier `.env` avec :

- `COMPOSE_PROJECT_NAME` basé sur le nom du dossier (isolation Docker entre projets)
- Secrets JWT générés aléatoirement

The application will be available at:

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- tRPC: http://localhost:3000/trpc

## Default Credentials

After seeding the database:

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

## Stack

- **Runtime**: Bun (workspace monorepo)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: NestJS + tRPC + Prisma + PostgreSQL
- **Validation**: Zod (shared schemas)
- **AI** (optional): LiteLLM + Langfuse

## Project Structure

```
.
├── apps/
│   ├── web/                    # React + Vite frontend
│   └── api/                    # NestJS backend
├── packages/
│   └── shared/                 # Zod schemas + shared types
├── scripts/
│   └── python/                 # Python standalone scripts
├── prisma/                     # Prisma schema and migrations
├── infrastructure/             # Docker configs
├── docker-compose.yml
├── Makefile
└── CLAUDE.md                   # AI assistant instructions
```

## Features

- **Auth**: JWT access tokens + refresh tokens with role-based access (USER/ADMIN)
- **tRPC**: Type-safe API with automatic type inference
- **Optional services**: LiteLLM, Langfuse, BullMQ queues

## Commands

Run `make help` to see all available commands.

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed conventions, architecture patterns, and AI module documentation.

## License

MIT
