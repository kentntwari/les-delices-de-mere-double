# Les Delices De Mere Double

This repository is now an npm-workspaces Turborepo monorepo.

## Workspace Layout

```text
apps/
	web/      Nuxt application
	worker/   TypeScript worker scaffold with BullMQ
packages/
	db/       Prisma schema, generation, and database client
	shared/   MVC layer, shared types, Zod schemas, and shared utilities
```

## Setup

Install all workspace dependencies from the repository root:

```bash
npm install
```

The root `postinstall` runs Prisma generation for `@repo/db` and Nuxt prepare
for `@repo/web`.

## Common Commands

Run the web app and worker dev tasks through Turbo:

```bash
npm run dev
```

Run the full workspace typecheck:

```bash
npm run typecheck
```

Build every package through Turbo:

```bash
npm run build
```

Preview the Nuxt app:

```bash
npm run preview
```

Regenerate Prisma client only:

```bash
npm run db:generate
```

## Package Notes

- `@repo/web` depends on `@repo/shared` and `@repo/db`.
- `@repo/worker` is scaffolded with `BullMQ` and ready for queue implementation.
- `@repo/shared` owns the migrated MVC code and shared validation/contracts.
- `@repo/db` owns Prisma and exports the shared database client entry point.
