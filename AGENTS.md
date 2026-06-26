# MatchaChoice — Agent Guide

MatchaChoice turns the consultation you'd give in person into a short, scored question flow that lives on your site — and routes the right person to the right next step.

## Monorepo layout

Turborepo + pnpm workspaces.

- `apps/web` — Next.js (App Router): admin, public renderer, API
- `apps/marketing` — Astro + Starlight: marketing, blog, docs _(planned)_
- `packages/db` — Drizzle schema + migrations (PostgreSQL)
- `packages/auth` — Better Auth config
- `packages/ui` — shadcn/ui components + design tokens (`src/styles/globals.css`)
- `packages/env` — typed env access (`@matchachoice/env/server`)
- `packages/config` — shared tsconfig / tooling

## Stack

Next.js · TypeScript (strict) · PostgreSQL · Drizzle · Better Auth · shadcn/ui · Tailwind v4. Lint/format: Ultracite (Biome). Tests: Vitest + Playwright.

## Commands

- Dev: `pnpm dev`
- Lint/format: `pnpm dlx ultracite fix`
- Run one package: `pnpm --filter @matchachoice/<name> <script>`
- DB workflow: edit `packages/db/src/schema/*` → `pnpm --filter @matchachoice/db db:generate` (creates a migration) → `db:migrate` to apply → `db:studio` to inspect.

## Conventions

- Commits: Conventional Commits (`feat:`, `fix:`, `chore:` …)
- Branches: short-lived `feat/`, `fix/`, `docs/`; squash merge to `main`; `main` is always deployable
- Database:
  - Domain IDs are `uuid` (`defaultRandom`). The auth tables are owned by Better Auth (text IDs) — **do not modify** `schema/auth.ts`.
  - Flexible nested config (question options, visibility/exclusion rules, scoring) is stored as typed `jsonb` via `.$type<…>()`; the shapes live in `packages/db/src/schema/types.ts` and are shared with the scoring engine.
  - Authoring tables → `checks.ts`, runtime tables → `submissions.ts`, re-exported from `schema/index.ts`.

## Scope discipline

v1 (`0.1.0`) is deliberately small. **Do not add** without being asked: AI features, multi-user, multi-language, A/B testing, plugin system, save & resume, PDF export, email result, audit log, SSO. When a product decision is ambiguous, ask rather than guess.

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
