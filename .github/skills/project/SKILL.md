---
name: "restaurant-transactions-architecture"
description: "Nuxt + TypeScript restaurant transactions app with OOP MVC, Zod validation, factories, mappers, and policies."
tags:
  - nuxt
  - typescript
  - oop
  - mvc
  - zod
  - tailwind
  - transactions
---

# Skill: Restaurant Transactions App (Nuxt + TypeScript + OOP MVC)

You are assisting in a restaurant transactions application where restaurants manage menu items and customer orders.

## Domain Modeling Expectations

- Core domains:
  - **Menu items** (e.g., `MenuItem`, `MenuCategory`).
  - **Orders** (e.g., `Order`, `OrderItem`).
  - **Restaurants** (e.g., `Restaurant`, `Table`, `Staff`, if needed).
- Use classes and value objects to represent domain concepts:
  - Domain entities live under a `domain/` directory (e.g., `domain/menu/MenuItem.ts`, `domain/orders/Order.ts`).
  - Value objects encapsulate reusable concepts like `Money`, `Quantity`, `TableNumber`, `OrderStatus`.

When adding or changing domain logic:
- Keep entities focused on behavior and invariants.
- Use factories (`MenuItemFactory`, `OrderFactory`) to create entities from raw input or DTOs.
- Use policies (`OrderDiscountPolicy`, `OrderCancellationPolicy`) to express rules clearly.

## Controllers, Services, and Repositories

- Controllers:
  - Live in `server/api` (backend) or `pages/` (frontend route handlers, where appropriate).
  - Handle request parsing, validation, and mapping to application services.
  - Return only a typed `Response` object (or similar) representing success or specific errors.
- Services (application/use-case layer):
  - Live in `application/` or `services/`.
  - Perform orchestration such as “create order”, “add menu item”, “close order”.
  - Coordinate repositories, factories, and policies.
- Repositories:
  - Represent persistence boundaries (e.g., `IMenuItemRepository`, `IOrderRepository`).
  - Have interfaces in `domain` and concrete implementations in `infrastructure`.

When generating new features, follow this sequence:
1. Define or update the domain entities and value objects.
2. Add or update factories, mappers, and policies.
3. Implement or extend application services/use cases.
4. Wire controllers to services and map errors to `Response` types.
5. Wire UI (Nuxt pages/components) to controllers or API endpoints.

## Zod Validation

- Use Zod for:
  - Request validation (e.g., `CreateMenuItemSchema`, `CreateOrderSchema`).
  - DTO shapes (`MenuItemDTO`, `OrderDTO`).
- Co-locate schemas with the layer they validate:
  - HTTP request/response: near controllers or route handlers.
  - Domain or application input: near factories or services.

For new input flows:
1. Define a Zod schema and infer a TypeScript type from it.
2. Use that type in controllers, services, or factories.
3. On the frontend, re-use or mirror schemas when possible to reduce duplication.

## UI and Component Composition

- Use `.vue` single‑file components with `<script setup lang="ts">`.
- It is acceptable to have up to ~500 lines per `.vue` file if:
  - Logic remains cohesive for a single screen or flow (e.g., “Create Order”, “Edit Menu Item”).
  - Sections are organized clearly with comments and consistent naming.
- Prefer:
  - Local composition using composables and well‑named functions inside the same file.
  - Extraction into separate components only when:
    - The section is reused in multiple places, or
    - The file becomes conceptually messy rather than just long.

For forms (menu items, orders):
- Use Tailwind utility classes for layout and styling.
- Use Zod validation with error messages surfaced in the UI.
- Keep state and handlers close to the template in the same file.

## Error Handling and Response Mapping

- Handle errors locally: validate early, catch exceptions where they occur, and transform them to typed domain or application errors.
- Controllers:
  - Map errors to a `Response` type that includes:
    - `status` (e.g., `success`, `validation_error`, `domain_error`, `not_found`, `server_error`).
    - `httpStatus` when appropriate (e.g., 400, 404, 500).
    - `message` and optional `details`.
- Domain / application:
  - Prefer explicit error types or `Result` objects over returning `null` or `undefined` for failures.
  - Avoid leaking infrastructure‑specific errors (DB drivers, fetch errors) out of the infrastructure layer.

When generating code for new flows:
1. Define expected domain and application‑level failure modes.
2. Implement error types or result types.
3. Map those to HTTP `Response` cases in controllers.
4. Surface user‑friendly messages in the UI.

## Coding Style Nudges

When completing code or suggesting implementations:

- Prefer named classes and interfaces over anonymous types for important domain concepts.
- Use explicit types for function parameters and return types in services, controllers, and repositories.
- Use `async/await` consistently for async operations.
- Keep methods small:
  - If a method exceeds ~20–30 lines and does multiple things, consider splitting it into smaller private methods.
- Avoid “God” controllers or services that know about everything; split responsibilities into focused services when they diverge.

If a user’s code or request is ambiguous, propose a structure that:
- Maintains clear domains (menu, orders, restaurants).
- Keeps validation explicit and close to input boundaries.
- Keeps UI composition manageable within single files before extracting components.
