# AGENTS.md

Gatherly is a GenAI event planner for weddings, birthdays and community events. The plan lives in the
browser; deterministic engines calculate budgets, timelines, vendors, health, risks, catering and
run-of-show. Optional Gemini or OpenRouter calls power ideas, parsing and chat.

## Stack

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS and React Hook Form.
- Zod schemas for the plan, intake, API payloads and structured model output.
- Vitest, Testing Library, fast-check and jest-axe for unit and component tests; Playwright for e2e.
- `localStorage` for the versioned plan and preferences; a shell-cache service worker; Basic mode is
  the AI default and fallback.

## Layout

```text
src/app/              App Router pages, error boundaries and API routes
src/features/         domain slices; each exposes its public surface through index.ts
src/components/ui/    shared Button, ButtonLink, Card, Chip, SectionLabel and StatRow
src/lib/              plan schema and store, money, dates, exports and shared utilities
src/lib/ai/           provider selection, Basic/Gemini/OpenRouter adapters and prompts
src/lib/security/     route factory, guards, rate limiting, sanitising and the redacting logger
src/lib/i18n/         en, hi and bn dictionaries
tests/                Vitest suites, Playwright journeys, shared support and fixtures
scripts/              stats, bundle checks, screenshots, live smoke and service-worker stamping
docs/                 architecture, traceability, tour, limitations, outcomes and live verification
public/               manifest, icons and the shell-cache service worker
```

## Conventions

- TypeScript strict. No `any`, `@ts-ignore`, non-null assertions or `eslint-disable`.
- Zod is the source of truth: define the schema first and derive types with `z.infer`.
- Planning engines are pure functions: they receive their inputs, including dates, and never fetch.
- Cross-feature imports go through `features/<name>/index.ts`; `src/lib` may not import a feature.
  ESLint `import/no-restricted-paths` enforces both boundaries.
- Every API route uses `createRoute` for POST or `createGetRoute` for GET from
  `src/lib/security/route.ts`; the factory supplies validation, rate limiting, the body cap,
  timeout, logging and no-store headers.
- Naming (Q3): files and hooks are kebab-case; React components and their files are PascalCase;
  functions are camelCase; module constants are SCREAMING_SNAKE_CASE.
- Money is an integer number of minor units (paise, cents, ...) in every calculation; format only
  through `src/lib/money.ts`.
- Module-level mutable state is confined to the plan store (`src/lib/plan-store.ts` and its
  `src/lib/plan-storage.ts` cache). Rate-limit buckets live inside limiter instances.
- Files stay under 200 lines and functions under 40 where a responsibility can be split; give every
  exported function, type and class a JSDoc block. Comments explain why, not what.
- Structured LLM output is Zod-validated before it reaches the UI.
- No user data is stored on the server; share links use a URL fragment. Never log user text or PII:
  use `src/lib/security/logger.ts`, which redacts.
- Accessibility is part of done: keyboard reachable, visible focus, labelled inputs, `aria-live`
  status, colour never the only signal, and `prefers-reduced-motion` honoured.
- User-facing labels live in `src/lib/i18n/en.ts`, `hi.ts` and `bn.ts`; keep the keys in sync.
  Error boundaries that cannot read the provider stay English and say why in a comment.
- A new dependency needs a one-line reason in the README; there is no UI kit beyond local primitives.

## Tests

- Unit and component tests live under `tests/app`, `tests/features`, `tests/lib`,
  `tests/components` and `tests/scripts`, grouped by the source area they cover. Shared fixtures
  and setup live in `tests/support`.
- Playwright journeys live in `tests/e2e` and run against a production build.
- Cover the happy path, the edge case and the error case; use `fast-check` for money and allocator
  invariants. Test names describe behaviour; no `.only`, `.skip`, real network or real clock.

## Commands

- `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck` and
  `npm run format:check` for the app and static checks; `npm run format` rewrites formatting.
- `npm test`, `npm run test:coverage`, `npm run knip` and `npm run stats` for the suites and checks.
- `npm run check` runs lint, typecheck, format check, coverage, Knip and stats.
- `npm run test:e2e` (or `npm run e2e`) runs the Playwright journeys; install Chromium once with
  `npm run e2e:install`. `npm run audit:lighthouse` and `npm run shots` are optional audit tools.

## Workflow

- Work on one change at a time, keep diffs small and edit files in place.
- Run `npm run check` before committing; if an error survives two attempts, note it instead of hiding it.
- Do not weaken tests, lower coverage or add a dependency to avoid a failing check.
