# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot reload) — run inside the api container
docker exec -it api-scancard npm run dev

# Type check only
docker exec -it api-scancard npm run typecheck

# Workers (run inside their respective containers via docker compose, or locally for debug)
npm run worker:statement-processor   # OpenAI Vision consumer
npm run worker:dlq                   # DLQ consumer

# Tests
npm test                             # Run unit tests
npm run test:integration             # Run integration tests (requires Docker infra running)

# Database migrations — always run inside Docker
docker exec api-scancard npm run migration:run
npm run migration:generate           # Auto-generate from entity changes
npm run migration:create             # Create empty migration file
npm run migration:revert             # Revert last migration
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
- **`src/infra/storage/`** — `LocalStorageProvider` implements `IStorageProvider`; saves files to `$UPLOAD_DIR/{userId}/{statementId}/`; swap for MinIO later without changing services
- **`src/middlewares/upload.middleware.ts`** — multer with `memoryStorage`; fileFilter accepts only jpg/jpeg/png; field name is `images` (array)
- **`src/workers/`** — RabbitMQ consumer processes (separate entry points)
- **`src/infra/database/`** — TypeORM data source config, entities, and migrations

**Worker pattern:** Workers run as separate Docker Compose services. The RabbitMQ consumer (`src/infra/message-broker/consumer.ts`) includes built-in retry logic with configurable max retries + delay, sets `x-last-error` header on each retry, and triggers an optional `onRetry` callback (used to increment `jobs.retries`). Exhausted retries go to the Dead Letter Queue.

**card_statements full flow:**
- `POST /api/cards/:cardId/statements` — multipart/form-data with `year_reference`, `month_reference`, `total` (optional) + files under key `images`
- Creates statement (status=1 pending), saves images to `$UPLOAD_DIR/{userId}/{statementId}/`, creates `card_statement_images` records, updates status to `2=sent`
- Creates a `jobs` record and publishes `{ statementId }` to exchange `events` routing key `statement-ai-process`
- `worker-statement-processor-ai` consumes `events.statement-ai-process`, calls OpenAI Vision (`gpt-4.1-mini`), saves to `card_transactions`, writes to `audit_logs`, updates both `card_statements.status_id` and `jobs.status_id` atomically
- `worker-dlq` consumes `queue.dlq.all`, sets status to `6=dlq` on both tables, creates `fail_jobs` and `audit_logs` records
- **TODO:** send alert email to `DEVELOPER_EMAIL` via Nodemailer in `dlq.worker.ts`

**processing_status reference table (no CRUD):**
```
1=pending, 2=sent, 3=processing, 4=success, 5=retry, 6=dlq, 7=needs_review, 8=error (audit_logs only), 9=invalid_image
```
Delete on card_statements allowed only on status: 1, 4, 6, 7, 9.

**Worker env vars:**
```
RABBITMQ_STATEMENT_AI_MAX_RETRIES   # default 3
RABBITMQ_STATEMENT_AI_RETRY_DELAY   # default 5000 (ms)
OPENAI_API_KEY
```

**needs_review logic:** compares `statement.total` against `SUM(parcel_value)` extracted from the statement. Tolerance: R$10. If diff > 10 → status `7=needs_review`, otherwise `4=success`.

**uploads volume:** `UPLOAD_DIR=/uploads` is a named Docker volume (`uploads_data`) shared between `api`, `worker-statement-processor-ai`, and `worker-dlq`. Files saved by the API are readable by workers.

**DECIMAL columns:** TypeORM returns MySQL DECIMAL as string by default. Use column `transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null }` to get numbers.

**Environment variables** (see `.env.example`):
```
PORT, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
REDIS_HOST, REDIS_PORT, REDIS_PASS,
UPLOAD_DIR,
JWT_SECRET, JWT_EXPIRES_IN,
OPENAI_API_KEY,
RABBITMQ_STATEMENT_AI_MAX_RETRIES, RABBITMQ_STATEMENT_AI_RETRY_DELAY
```

TypeORM `synchronize` is disabled — all schema changes must go through migrations.

## Testing

Tests live in `/test/` (mirroring `src/` structure) and use `.spec.ts` suffix. Services are unit tested with mocked repositories, cache providers, and storage providers. Path alias `@/` maps to `src/`.

Integration tests live in `test/integration/` and use real MySQL + Redis (Docker Compose must be running). Config: `jest.integration.config.js`. Setup file: `test/integration/jest.setup.ts` (loads `.env.test`). Shared helpers:
- `test/integration/helpers/db.ts` — `initDB`, `closeDB`, `cleanupUser`, `cleanupCard`, `forceStatementStatus`
- `test/integration/helpers/auth.ts` — `createUserAndGetToken` (register + login, returns token + cleanup fn)

Swagger UI is available at `/api/doc` when the server is running.
