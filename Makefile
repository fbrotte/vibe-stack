.PHONY: help setup dev dev-api dev-web docker-up docker-up-llm docker-up-observability docker-up-full docker-down docker-reset db-migrate db-seed db-studio db-reset logs clean env-check generate-secret test test-api test-web test-cov

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Complete project setup (install + docker + migrate + seed)
	@echo "Setting up the project..."
	bun install
	@$(MAKE) docker-up
	@sleep 5
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo "Setup complete! Run 'make dev' to start developing"

dev: ## Start frontend + backend in development mode
	@echo "Starting development servers..."
	@bun run dev

dev-api: ## Start backend only
	@echo "Starting API server..."
	@cd apps/api && bun run dev

dev-web: ## Start frontend only
	@echo "Starting web server..."
	@cd apps/web && bun run dev

docker-up: ## Start Docker services (postgres + redis)
	@echo "Starting Docker services..."
	docker-compose up -d postgres redis
	@echo "Services started"

docker-up-llm: ## Start Docker services with LiteLLM
	@echo "Starting Docker services with LiteLLM..."
	docker-compose --profile llm up -d
	@echo "Services started with LiteLLM"

docker-up-observability: ## Start Docker services with Langfuse
	@echo "Starting Docker services with Langfuse..."
	docker-compose --profile observability up -d
	@echo "Services started with Langfuse"

docker-up-full: ## Start all Docker services (postgres + redis + litellm + langfuse)
	@echo "Starting all Docker services..."
	docker-compose --profile full up -d
	@echo "All services started"

docker-down: ## Stop all Docker services
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "Services stopped"

docker-reset: ## Stop services and remove volumes
	@echo "Resetting Docker (removing volumes)..."
	docker-compose down -v
	@echo "Docker reset complete"

db-migrate: ## Run Prisma migrations
	@echo "Running database migrations..."
	bunx prisma migrate dev
	@echo "Migrations complete"

db-seed: ## Seed the database
	@echo "Seeding database..."
	bunx tsx prisma/seed.ts
	@echo "Seeding complete"

db-studio: ## Open Prisma Studio
	@echo "Opening Prisma Studio..."
	bunx prisma studio

db-reset: ## Reset database (migrate + seed)
	@echo "Resetting database..."
	bunx prisma migrate reset --force
	@echo "Database reset complete"

logs: ## Show Docker logs
	docker-compose logs -f

clean: ## Clean node_modules and dist folders
	@echo "Cleaning project..."
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist packages/*/dist
	@echo "Clean complete"

env-check: ## Check if .env file exists
	@if [ ! -f .env ]; then \
		echo ".env file not found!"; \
		echo "Run: cp .env.example .env"; \
		exit 1; \
	else \
		echo ".env file exists"; \
	fi

generate-secret: ## Generate random secrets for JWT
	@echo "JWT_SECRET=\"$$(openssl rand -base64 32)\""
	@echo "JWT_REFRESH_SECRET=\"$$(openssl rand -base64 32)\""

test: ## Run all tests
	@echo "Running all tests..."
	@cd apps/api && bun run test
	@cd apps/web && bun run test
	@echo "All tests complete"

test-api: ## Run API tests
	@echo "Running API tests..."
	@cd apps/api && bun run test

test-web: ## Run Web tests
	@echo "Running Web tests..."
	@cd apps/web && bun run test

test-cov: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@cd apps/api && bun run test:cov
	@cd apps/web && bun run test:cov
