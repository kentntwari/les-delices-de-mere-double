# Copilot Skills Profile

This file describes the technical skills, architectural competencies, and coding
expectations for the AI assistant operating in this repository.

The assistant should actively apply these skills when generating, refactoring,
or reviewing code.

---

## Core Engineering Skills

- Strong Object-Oriented Programming (OOP)
  - Class-based domain modeling
  - Encapsulation of invariants and behavior
  - Explicit constructors and methods
  - Avoidance of anemic models

- MVC Architecture Discipline
  - Controllers as orchestration only
  - Services as coordination and transaction boundaries
  - Domain entities as business logic carriers
  - Infrastructure isolated behind repositories

- Transaction-Oriented System Design
  - Banking-style correctness mindset
  - Defensive data handling
  - Consistency-first thinking
  - Explicit state transitions

---

## TypeScript & Language Mastery

- Advanced TypeScript (strict mode)
  - Explicit typing for public APIs
  - Safe generics
  - Avoidance of `any` and unsafe casting
  - Structural typing awareness

- Async Programming
  - Consistent use of async/await with try/catch
  - Error propagation discipline
  - Promise safety and determinism
  - Avoidance of unhandled rejections

---

## Validation & Data Integrity

- Zod schema design
  - Strict schemas
  - Clear error surfaces
  - DTO validation
  - Schema reuse between frontend and backend

- Multi-layer validation strategy
  - Frontend: VeeValidate + Zod
  - Backend: Zod + factories + domain invariants
  - Zero-trust input handling

- Domain invariants enforcement
  - No invalid state allowed
  - Defensive constructors
  - Explicit normalization

---

## Backend Architecture Skills

- Nitro.js server architecture
- MVC orchestration patterns
- Layered error mapping
- Custom error types and response mapping
- Repository pattern with Prisma
- Explicit transaction handling
- Infrastructure isolation

- Error modeling
  - ApplicationError
  - NetworkError
  - DatabaseError
  - Layer-specific mapping strategies

---

## Authorization & Security Skills

- Policy-based authorization design
- Nuxt middleware orchestration
- HTTP method → permission mapping
- Fail-fast authorization strategies
- Separation of authorization from business logic
- Defensive security posture

---

## Data Mapping & Transformation

- Mapper pattern implementation
- Entity ↔ DTO ↔ Model transformations
- Safe model projection
- Explicit field mapping
- Avoidance of implicit data coupling

---

## Factory & Construction Patterns

- Factory-driven domain construction
- Validation-first creation flows
- Safe build patterns
- Normalization pipelines
- Error-safe construction

---

## Database & Persistence Skills

- Prisma ORM usage
- PostgreSQL relational modeling
- Transaction integrity awareness
- Error wrapping and mapping
- Query safety and predictability

---

## Frontend Engineering Skills

- Nuxt 4 application structure
- Tailwind CSS composition
- Colocated UI composition (single-file emphasis)
- Form-driven workflows
- Validation-driven UX design
- Error state handling
- Accessibility awareness

---

## Middleware & Request Lifecycle

- Nuxt middleware patterns
- Authentication orchestration
- Policy evaluation pipelines
- Route protection strategies
- Fail-fast request blocking
- Safe async middleware execution

---

## Testing & Verification Mindset

- Validation audits
- Error-path verification
- Boundary testing awareness
- Deterministic behavior design
- Predictable failure modes

(Testing framework integration may be added later.)

---

## Code Quality & Maintainability

- Readability-first code generation
- Explicit naming
- Small, focused methods
- Clear dependency boundaries
- Avoidance of tight coupling
- Long-term maintainability thinking

---

## UX & Product Thinking

- Transaction safety UX
- Clear user feedback
- Error visibility
- Predictable workflows
- Low cognitive load interfaces
- Operational reliability focus

---

## Documentation & Communication

- Self-documenting code
- Clear intent signaling
- Structured error context
- Explicit assumptions
- Conservative change reasoning
