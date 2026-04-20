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

- **`src/contracts/`** — Interfaces for repositories, cache, and storage providers (dependency inversion)
- **`src/repositories/`** — TypeORM implementations of repository interfaces
- **`src/services/`** — Business logic; receives repository, cache, and storage contracts via constructor
- **`src/controllers/`** — Express handlers; validates DTOs via `plainToClass` + `validate`, calls services, formats responses
- **`src/dtos/`** — class-validator decorated input shapes; use `@Transform` for fields that arrive as strings from multipart/form-data
- **`src/mappers/`** — Entity-to-DTO conversions
- **`src/errors/`** — Custom error classes (`ErrorBase`, `NotFoundError`, `ConflictError`, `BadRequestError`) caught by the global error middleware
- **`src/infra/`** — Redis, RabbitMQ, and storage client wrappers
- **`src/infra/storage/`** — `LocalStorageProvider` implements `IStorageProvider`; saves files to `uploads/{userId}/{statementId}/`; swap for MinIO later without changing services
- **`src/middlewares/upload.middleware.ts`** — multer with `memoryStorage`; fileFilter accepts only jpg/jpeg/png; field name is `images` (array)
- **`src/workers/`** — RabbitMQ consumer processes (separate entry points)
- **`src/infra/database/`** — TypeORM data source config, entities, and migrations

**Worker pattern:** Workers run as separate processes (`src/workers/`). The RabbitMQ consumer includes built-in retry logic (configurable max retries + delay) and a Dead Letter Queue for exhausted retries.

**card_statements flow:**
- `POST /api/cards/:cardId/statements` — multipart/form-data with fields `year_reference`, `month_reference`, `total` (optional) + files under key `images`
- Creates statement (status=pending), saves images to disk, creates `card_statement_images` records, updates status to `sent`, publishes `{ statementId }` to exchange `statements` routing key `process`
- Returns 202 Accepted
- Worker (passo 6 — not yet implemented) consumes, calls LLM, saves to `card_transactions`, updates status to `success` or `needs_review`

**processing_status reference table (no CRUD):**
```
1=pending, 2=sent, 3=processing, 4=success, 5=retry, 6=dlq, 7=needs_review
```
Delete allowed only on status: 1, 4, 6.

**DECIMAL columns:** TypeORM returns MySQL DECIMAL as string by default. Use column `transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null }` to get numbers.

**Environment variables** (see `.env.example`):
```
PORT, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
REDIS_HOST, REDIS_PORT, REDIS_PASS
```

TypeORM `synchronize` is disabled — all schema changes must go through migrations.

## Testing

Tests live in `/test/` (mirroring `src/` structure) and use `.spec.ts` suffix. Services are unit tested with mocked repositories, cache providers, and storage providers. Path alias `@/` maps to `src/`.
