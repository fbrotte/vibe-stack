# Template Dev

Full-stack TypeScript/Python monorepo template optimized for rapid development with AI coding assistants.

## Stack

- **Runtime**: Bun (workspace monorepo)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: NestJS + tRPC + REST (Swagger)
- **ORM**: Prisma + PostgreSQL
- **Cache/Queue**: Redis + BullMQ (optional)
- **Validation**: Zod (shared between frontend and backend)
- **Auth**: JWT + Refresh tokens
- **LLM**: LiteLLM (optional, Docker profile)
- **Observability**: Langfuse (optional, Docker profile)
- **Python**: Standalone scripts callable from NestJS

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) & Docker Compose
- Python 3.9+ (for Python scripts)

## Quick Start

```bash
# Clone the repository
git clone <your-repo>
cd template-dev

# Copy environment variables
cp .env.example .env

# Generate JWT secrets
make generate-secret
# Copy the output to your .env file

# Complete setup (install + docker + migrate + seed)
make setup

# Start development
make dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- tRPC: http://localhost:3000/trpc

## Default Credentials

After seeding the database:
- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

## Available Commands

Run `make help` to see all available commands:

```bash
make dev              # Start frontend + backend
make dev-api          # Start backend only
make dev-web          # Start frontend only

make docker-up        # Start postgres + redis
make docker-up-llm    # Start with LiteLLM
make docker-up-full   # Start all services

make db-migrate       # Run Prisma migrations
make db-seed          # Seed database
make db-studio        # Open Prisma Studio
make db-reset         # Reset database

make clean            # Clean node_modules and dist
```

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
│   ├── postgres/
│   └── litellm/
├── docker-compose.yml
├── Makefile
└── package.json                # Root workspace config
```

## Features

### Authentication
- JWT access tokens + refresh tokens
- Protected routes in frontend and backend
- Role-based access control (USER/ADMIN)

### tRPC
- Type-safe API calls from frontend to backend
- Automatic type inference
- Shared Zod schemas for validation

### Optional Services

#### LiteLLM
Unified API gateway for multiple LLM providers (OpenAI, Anthropic, etc.):
```bash
make docker-up-llm
```
Configure in `litellm.config.yaml` and set API keys in `.env`.

#### Langfuse
LLM observability and monitoring:
```bash
make docker-up-observability
```
Access at http://localhost:3001

#### BullMQ
Queue management (commented by default):
1. Uncomment QueueModule in `apps/api/src/app.module.ts`
2. Set `QUEUE_ENABLED=true` in `.env`

### Python Scripts

Add standalone Python scripts in `scripts/python/`:
```python
# scripts/python/my_script.py
import sys
import json

input_data = json.loads(sys.argv[1])
result = {"success": True, "data": input_data}
print(json.dumps(result))
```

Call from NestJS:
```typescript
const result = await this.pythonService.runScript('my_script.py', { foo: 'bar' });
```

## Development Workflow

1. **Local Development**: Backend and frontend run locally with hot reload
2. **Docker Services**: Only infrastructure (postgres, redis) runs in Docker
3. **API Development**: Use tRPC for internal APIs, REST for external/public APIs
4. **Validation**: Define Zod schemas in `packages/shared`, use on both sides
5. **Database**: Make changes in `prisma/schema.prisma`, run `make db-migrate`

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET`: Generate with `make generate-secret`
- `LITELLM_BASE_URL` / `LITELLM_MASTER_KEY`: For LLM features
- `QUEUE_ENABLED`: Enable/disable BullMQ

## License

MIT
