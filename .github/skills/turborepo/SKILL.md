---
name: turborepo
description:
  "Use when converting a project into a Turborepo monorepo, reviewing Turbo
  workspace architecture, splitting apps and packages, defining package
  boundaries, moving Prisma or shared code, creating worker packages, or
  validating monorepo migration plans for TypeScript, Nuxt, and Node.js
  projects."
tags:
  - turborepo
  - monorepo
  - typescript
  - nuxt
  - prisma
  - workspaces
---

# Skill: Turborepo Monorepo Migration

Use this skill when evaluating or implementing a migration from a single-package
repository to a Turborepo monorepo.

## Objectives

- Establish a reproducible workspace layout.
- Keep runtime boundaries explicit.
- Avoid importing server-only or database-only code into browser bundles.
- Preserve package-local ownership of framework and infrastructure concerns.
- Make installation, generation, build, and dev flows work from the repo root.

## Preferred Layout

For a Nuxt + TypeScript + Prisma application, prefer a layout such as:

```text
apps/
  web/
  worker/
packages/
  shared/
  db/
```

- `apps/web`: owns Nuxt app code, Nuxt config, public assets, server routes, and
  frontend dependencies.
- `apps/worker`: owns standalone TypeScript worker/runtime code, worker-only
  dependencies, and queue consumers.
- `packages/shared`: owns reusable contracts, Zod schemas, DTOs, domain-layer
  utilities, and code that can be safely consumed by multiple packages.
- `packages/db`: owns Prisma schema, Prisma generation, database client
  creation, and database-only helpers.

## Boundary Rules

- Keep Prisma ownership inside the db package.
- Keep Nuxt ownership inside the web app.
- Do not let browser-facing code import Prisma, repositories, controllers, or
  other server-only modules.
- Shared packages must not depend backward on app packages.
- If shared exports both browser-safe and server-only modules, expose them
  through explicit subpath exports instead of a single broad barrel.

## Dependency Placement

- Put `turbo` in the root `devDependencies` even if it is installed globally.
- Put Nuxt and UI dependencies in `apps/web`.
- Put `bullmq` in `apps/worker`.
- Put `prisma` and `@prisma/client` in `packages/db`.
- Put cross-runtime libraries such as `zod` in the shared package when the
  shared package owns schemas.

## TypeScript Guidance

- Keep the repo root TypeScript config generic and workspace-oriented.
- Keep framework-specific TypeScript configs inside the owning app/package.
- Use package exports and, when needed, workspace path aliases that match those
  exports.
- Remove frontend dependencies on database-only types by introducing shared
  contracts where needed.

## Turbo Guidance

- Root scripts should proxy workspace tasks through Turbo.
- Define pipelines for at least `build`, `dev`, and `typecheck`.
- If one package generates artifacts required by another package, model that
  dependency explicitly in scripts and task ordering.
- Do not rely on implicit root postinstall side effects that assume a
  single-package repository.

## Prisma Guidance

- Move `prisma/schema.prisma` into the db package.
- Make Prisma generation run from the db package.
- Export a single database client entry point from the db package.
- Avoid duplicate generated-client locations unless there is a specific
  deployment requirement.

## Migration Review Checklist

When reviewing a plan or implementation, verify all of the following:

1. The root is a workspace orchestrator, not the old app package in disguise.
2. The current application has been moved into an app package with local config
   ownership.
3. Prisma has one clear owning package.
4. Shared code no longer depends backward on app-specific or repository-specific
   types.
5. Client-safe code does not import Prisma or server-only modules.
6. Worker code is isolated in its own package with only the dependencies it
   needs.
7. Root scripts, install hooks, and Turbo tasks are reproducible on another
   machine.
8. Imports are package-based or export-based, not tied to the old repository
   root layout.
9. Validation includes install, generate, build, and package-scoped checks.

## Common Failures

- Keeping the old app at the repo root and only adding Turbo around it.
- Moving folders without fixing import direction.
- Letting a shared package import repositories, Prisma clients, or framework
  adapters.
- Reusing a Nuxt root tsconfig as the monorepo root tsconfig.
- Assuming a global Turbo binary instead of declaring Turbo in the repo.
- Exposing one giant shared barrel that accidentally pulls server-only code into
  frontend builds.

## Review Output Expectations

When using this skill to review a monorepo plan:

1. Flag boundary violations first.
2. Flag reproducibility issues second.
3. Flag missing validation steps third.
4. Approve the plan only if package ownership, import direction, and task
   orchestration are coherent.
