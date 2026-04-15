# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash

# Development (hot reload)
docker exec -it df9db11be110 npm run dev

# Type check only
docker exec -it df9db11be110 npm run typecheck

# Start compiled app
docker exec -it df9db11be110 npm run start

# Run worker process (worker created just by tests)
docker exec -it df9db11be110 npm run worker:luan 

# Tests
npm test                                        # Run all tests once

# Database migrations
npm run migration:generate   # Auto-generate from entity changes (data-source: src/infra/database/data-source.ts)
npm run migration:create     # Create empty migration file
npm run migration:run        # Apply pending migrations
npm run migration:revert     # Revert last migration
```

## Architecture

This is a TypeScript/Express REST API with MySQL (TypeORM), Redis caching, and RabbitMQ async processing. All infrastructure (MySQL, Redis, RabbitMQ) runs via Docker Compose.

**Request flow:**
```
Routes → Controllers → Services → Repositories → Database/Cache
```

- **`src/contracts/`** — Interfaces for repositories and cache provider (dependency inversion)
- **`src/repositories/`** — TypeORM implementations of repository interfaces
- **`src/services/`** — Business logic; receives repository and cache contracts via constructor
- **`src/controllers/`** — Express handlers; validates DTOs, calls services, formats responses
- **`src/dtos/`** — class-validator decorated input shapes
- **`src/mappers/`** — Entity-to-DTO conversions
- **`src/errors/`** — Custom error classes (`ErrorBase`, `NotFoundError`, `ConflictError`, `BadRequestError`) caught by the global error middleware
- **`src/infra/`** — Redis and RabbitMQ client wrappers
- **`src/workers/`** — RabbitMQ consumer processes (separate entry points)
- **`src/database/`** — TypeORM data source config, entities, and migrations

**Worker pattern:** Workers run as separate processes (`src/workers/`). The RabbitMQ consumer includes built-in retry logic (configurable max retries + delay) and a Dead Letter Queue for exhausted retries.

**Environment variables** (see `.env.example`):
```
PORT, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
REDIS_HOST, REDIS_PORT, REDIS_PASS
```

TypeORM `synchronize` is disabled — all schema changes must go through migrations.

## Testing

Tests live in `/test/` (mirroring `src/` structure) and use `.spec.ts` suffix. Services are unit tested with mocked repositories and cache providers. Path alias `@/` maps to `src/`.
