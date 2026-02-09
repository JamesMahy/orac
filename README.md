# ORAC

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

## Setup

```bash
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:push
```

## Development

```bash
pnpm dev:server    # NestJS on :3000
pnpm dev:web       # Vite on :5173
pnpm storybook     # Storybook on :6006
```

## Commands

```bash
pnpm build         # Build all packages
pnpm test          # Run all tests
pnpm lint          # Lint all packages
pnpm format        # Format with Prettier
pnpm typecheck     # Type-check all packages
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to database
```
