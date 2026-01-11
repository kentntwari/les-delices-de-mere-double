# Copilot Engineering Instructions

You are assisting in a production-grade, transaction-oriented system
(similar to a banking system) used by restaurant staff (waiters, chefs, administrators).

This system manages pricing and operational data.
Correctness, validation, consistency, and data integrity are critical.

Optimize for correctness, safety, predictability, and maintainability.
Never optimize primarily for developer convenience.

---

## Core Principles

- Correctness > Developer Experience.
- Validation is mandatory at all boundaries.
- Strong separation of concerns.
- Pure Object-Oriented Programming (OOP).
- Explicit flow, explicit types, explicit errors.
- Defensive programming by default.
- Avoid clever shortcuts and implicit behavior.

Treat all user input and external data as untrusted.

---

## Tech Stack

- Nuxt 4
- TypeScript (strict)
- Nitro.js
- Zod (schemas and validation)
- Prisma
- PostgreSQL
- VeeValidate (frontend validation)
- Tailwind CSS (styling)

Do not introduce new libraries without strong justification.

---

## Architecture Overview

The project follows **MVC with strict layering**, plus:

- Factories
- Mappers
- Policies
- Services
- Repositories

Each layer has explicit responsibilities and must not leak concerns across boundaries.

---

## MVC Rules

### Controllers (`/mvc/controllers`)

- Controllers:
  - Only orchestrate requests.
  - Never contain business logic.
  - Never access persistence directly.
  - Always return or throw **custom HTTP Response objects**.
  - Never return raw objects, primitives, or framework-specific responses.

- Controllers:
  - Handle errors locally using `try/catch`.
  - Log errors locally.
  - Map domain/application errors into appropriate custom Response types.
  - Use the provided BaseController error mapping patterns.

- Controllers should:
  - Validate request content type where applicable.
  - Parse request body using provided utilities.
  - Delegate domain logic to services.

The Nuxt server layer is responsible only for adapting Response objects to Nuxt primitives.

---

### Domain / Entities (`/mvc/entities`)

- Entities encapsulate:
  - State
  - Invariants
  - Domain behavior

- Entities must:
  - Protect their own invariants.
  - Never allow invalid state.
  - Avoid framework dependencies when possible.
  - Use classes (not plain objects).

---

### Services (`/mvc/service`)

- Services:
  - Coordinate domain operations.
  - Define transaction boundaries.
  - Call repositories, factories, mappers, and policies.
  - Never return ORM models directly.

- Services must:
  - Wrap all async logic in `try/catch`.
  - Normalize and map errors using BaseService rules.
  - Never leak infrastructure errors upward without mapping.

---

### Factories (`/mvc/factories`)

- Factories:
  - Validate incoming data using Zod schemas.
  - Normalize input if necessary.
  - Construct domain entities safely.
  - Enforce invariants during creation.

- Validation failures must throw ApplicationError with structured context.

Factories are the primary validation boundary for domain construction.

---

### Mappers (`/mvc/mapper`)

- Mappers:
  - Translate between:
    - ORM models
    - Domain entities
    - DTOs
  - Prevent leakage of persistence models into domain or controllers.

- Mapping must be explicit and predictable.
- Avoid implicit casting or partial mapping without intent.

---

### Policies (`/mvc/policies`)

- Policies:
  - Encapsulate authorization logic.
  - Must be explicit, deterministic, and testable.
  - Never access persistence directly.

---

### Repositories (`/mvc/repository`)

- Repositories:
  - Encapsulate Prisma access only.
  - Never expose Prisma models outside repository boundaries without mapping.
  - Wrap all database calls in `try/catch`.
  - Convert database errors into domain-safe error types.

---

---

## Middleware & Authorization

This project uses Nuxt middleware as the primary authorization layer.

### Rules

- Middleware:
  - Reads directly from Policy classes.
  - Decides whether a request is allowed to proceed.
  - Executes before any MVC controller logic runs.
  - Must block unauthorized requests immediately.

- Controllers and Services:
  - Must assume authorization has already been enforced.
  - Must NOT perform permission checks or role checks.
  - Must focus only on orchestration and business logic.

- Policies:
  - Encapsulate permission logic only.
  - Must remain deterministic and side-effect free.
  - Must not access persistence or framework primitives.

- Middleware responsibilities:
  - Identify protected routes.
  - Resolve the authenticated user.
  - Instantiate the correct Policy.
  - Map HTTP methods to policy permissions.
  - Reject unauthorized access using Nuxt errors.

Authorization logic must never leak into controllers, services, or domain logic.

---

## Middleware Coding Standards

- Middleware must:
  - Use explicit permission mapping.
  - Fail fast on unauthorized access.
  - Log authorization failures clearly.
  - Handle service failures defensively.
  - Avoid business logic or domain logic.

- Async middleware code must:
  - Use try/catch for all async calls.
  - Never allow unhandled promise rejections.


## Validation Rules (Non-Negotiable)

- All input must be validated:
  - Frontend: VeeValidate + Zod.
  - Backend: Zod + factories.

- Never trust client input.
- Never bypass validation.
- Domain objects must always remain valid.
- Invalid state must never exist even temporarily.

If validation is missing, add it.

---

## Async & Error Handling Rules

- Use `try/catch` for all async operations.
- Only use `.then()` when it clearly improves readability.
- Never allow unhandled promise rejections.
- Always map errors explicitly at each architectural boundary.
- Preserve error context and source whenever possible.

---

## TypeScript Standards

- Strict typing is mandatory.
- Avoid `any`, unsafe casting, and implicit types.
- Prefer explicit return types for public APIs.
- Domain concepts must be modeled as classes.
- Avoid excessive functional patterns in domain logic.
- Favor clarity over abstraction cleverness.

---

## Database & Transactions

- Treat all mutations as transactional operations.
- Prevent partial writes and inconsistent state.
- Use explicit transactions when multiple writes occur.
- Validate all data before persistence.
- Never persist unchecked or partially validated data.

---

## UI Guidelines (Nuxt + Tailwind)

- Tailwind CSS is the standard for styling.
- Prefer composing UI logic in the **same file** rather than splitting into many small components.
- Keep related logic, template, validation, and styling colocated when reasonable.

Forms must:
- Use explicit schemas.
- Validate on both client and server.
- Display validation errors clearly.
- Block submission on invalid state.

UI should prioritize clarity, reliability, and correctness over abstraction.

---

## Security & Safety

- Never expose internal implementation details.
- Never log sensitive data.
- Validate and sanitize all inputs.
- Assume malformed or hostile input at all boundaries.

---

## Change Discipline

When generating or modifying code:

- Preserve architectural boundaries.
- Do not weaken validation or type safety.
- Avoid refactors that reduce explicitness or safety.
- Prefer incremental, verifiable changes.
- Be conservative with data and transactional logic.
- Flag risks or ambiguity explicitly.

---

## Output Expectations

Generated code must:

- Follow OOP and MVC strictly.
- Respect factories, mappers, services, repositories, and policies.
- Use explicit validation and error handling.
- Use `try/catch` consistently for async logic.
- Return or throw custom Response types in controllers.
- Avoid shortcuts, hacks, and hidden coupling.
