# Gatherly

Gatherly is a calm, global event-planning companion for weddings, birthdays and community
gatherings. It turns budgets, dates, vendor questions, contingencies and the "what should we do
next?" feeling into one warm workspace.

Everything that decides a number - budget allocation, backward milestones, vendor coverage, the
health score, risks, the run-of-show, catering estimates - is computed **in the browser** from the
answers you give. AI is optional, isolated behind guarded routes, and clearly labelled when it is
in use. Without a network, or without an API key, the plan still works.

---

## How Gatherly answers the challenge

The brief asks for _"a GenAI-powered planning assistant that helps users organize weddings,
birthdays and community events with budgets, timelines, vendor checklists and personalized
ideas"_. Each part of that sentence has a feature, a place in the code and a test that holds it
up.

| The brief says          | Gatherly does it here                                                                                                                                              | The code                                                                                                 | The tests                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GenAI-powered assistant | A question box that answers from your plan, streamed, with a badge that says whether a model wrote it; a deterministic Basic mode when no key is set               | `src/lib/ai/`, `src/app/api/chat/route.ts`, `src/features/assistant/services.ts`                         | `tests/ai.test.ts`, `tests/api/chat-stream.test.ts`, `tests/components/assistant-stream.test.tsx`, `tests/security/providers.test.ts`, `tests/api/routes.test.ts` |
| Weddings                | Wedding benchmarks, wedding idea set, wedding ceremony flow in the run-of-show                                                                                     | `src/features/budget/services.ts`, `src/features/ideas/services.ts`, `src/features/timeline/services.ts` | `tests/budget.test.ts`, `tests/ideas.test.ts`, `tests/timeline.test.ts`                                                                                           |
| Birthdays               | Birthday benchmarks, birthday idea set, birthday run-of-show                                                                                                       | `src/features/budget/services.ts`, `src/features/ideas/services.ts`, `src/features/timeline/services.ts` | `tests/budget.test.ts`, `tests/ideas.test.ts`, `tests/timeline.test.ts`                                                                                           |
| Community events        | Community gathering as a first-class event type, with its own benchmarks, ideas and preparation steps                                                              | `src/lib/plan`, `src/features/budget/services.ts`, `src/features/ideas/services.ts`                      | `tests/plan.test.ts`, `tests/ideas.test.ts`, `tests/budget.test.ts`                                                                                               |
| Budgets                 | Visible category maths in whole paise, an 8% contingency, per-guest figures, benchmark shares and what-if scenarios                                                | `src/features/budget/services.ts`, `src/lib/money.ts`                                                    | `tests/budget.test.ts`, `tests/money.test.ts`, `tests/property.test.ts`                                                                                           |
| Timelines               | Milestones worked backwards from the event date, each with an owner, a date and a reason, plus a run-of-show                                                       | `src/features/timeline/services.ts`                                                                      | `tests/timeline.test.ts`, `tests/property.test.ts`                                                                                                                |
| Vendor checklists       | A category checklist with statuses, quotes and deposits, and a coverage percentage against the plan                                                                | `src/features/vendors/services.ts`                                                                       | `tests/vendors.test.ts`, `tests/components/vendors.test.tsx`                                                                                                      |
| Personalized ideas      | Ideas computed from your guests, city tier, priorities and dietary needs, each with the reasoning shown, and a model-written variant when a provider is configured | `src/features/ideas/services.ts`, `src/app/api/ideas/route.ts`                                           | `tests/ideas.test.ts`, `tests/api/routes.test.ts`                                                                                                                 |

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional: Basic mode works with no keys at all
npm run dev
```

Open <http://localhost:3000>. The landing page has three one-click sample plans - a wedding, a
birthday and a community gathering - so you can see the workspace in under a minute.

### Scripts

| Script                  | What it does                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Next.js dev server                                                |
| `npm run build`         | Production build                                                  |
| `npm start`             | Serve the production build                                        |
| `npm run lint`          | ESLint 9, flat config, `--max-warnings=0`                         |
| `npm run typecheck`     | `tsc --noEmit`, strict mode                                       |
| `npm run format:check`  | Prettier, check only                                              |
| `npm test`              | Vitest, the unit and component suites                             |
| `npm run test:coverage` | Vitest with the v8 coverage report and thresholds                 |
| `npm run check`         | `lint` + `typecheck` + `format:check` + `test:coverage` + `stats` |
| `npm run test:e2e`      | Playwright journeys (`npm run e2e:install` first, once)           |
| `npm run stats`         | Prints the counts this README quotes and the three quality lists  |

### Environment

All variables are read **on the server only**; there is deliberately no `NEXT_PUBLIC_` variant.

| Variable                                              | Default                   | Purpose                                  |
| ----------------------------------------------------- | ------------------------- | ---------------------------------------- |
| `GATHERLY_AI_PROVIDER`                                | `basic`                   | `basic`, `gemini` or `openrouter`        |
| `GEMINI_API_KEY`                                      | -                         | Server-only key for Google Gemini        |
| `OPENROUTER_API_KEY`                                  | -                         | Server-only key for OpenRouter           |
| `GATHERLY_GEMINI_MODEL`                               | `gemini-3.6-flash`        | Model id (2.0 ids were retired)          |
| `GATHERLY_OPENROUTER_MODEL`                           | `google/gemini-3.8-flash` | Model id                                 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | -                         | Shared-store rate limiting in production |

**Rate limiting in production:** the shared Upstash store is the production configuration, and the
in-process bucket is the local default. The live mode is never assumed - `GET /api/health` answers
`{ ok, mode, rateLimit }`, where `rateLimit` is `shared` or `per-instance`. A production start
without the variables logs one warning naming them. The limits themselves are unchanged, so a
deployment that has not set them still serves the demo at the documented rate.

`basic` is the default **and** the fallback. If a provider is selected but has no key, or the call
fails or times out, the route answers deterministically and says so in the UI.

**What switches the AI on:** set `GATHERLY_AI_PROVIDER` to `gemini` or `openrouter` and set the
matching key (`GEMINI_API_KEY` or `OPENROUTER_API_KEY`). Without both, the app is in Basic mode:
the same routes, the same screens, the same buttons, with deterministic answers and a visible
badge that says **Basic mode** instead of **AI assisted**. Which mode a deployment runs in, and
what was actually verified, is recorded in
[`docs/LIVE_VERIFICATION.md`](docs/LIVE_VERIFICATION.md).

In Basic mode **nothing goes to a third party**: no provider is contacted and no key is needed.
The ideas, chat and parse requests still reach this app's own server, which answers them from
deterministic rules over the plan that was sent. The plan itself never leaves the browser.

---

## What is in the product

**Landing** - editorial split hero, the three event families, what the product does, one-click
sample plans for all three, and the honest privacy line: the plan lives in your browser.

**Intake** - four steps (basics, money, needs, extras) covering event type, date, guest count,
city tier, venue type, currency and budget, priorities, dietary and access needs, a free-text
culture note, notes, language, and optional tradition/festival packs. Every field is validated
with Zod; the review step shows exactly what will be used.

**Workspace** - six tabs:

- **Overview** - health ring, risks, run-of-show, next action.
- **Budget** - visible category math, per-guest figures, what-if scenarios for more/fewer guests.
- **Timeline** - milestones computed backwards from the event date, each with an owner and a date.
- **Vendors** - checklist with status, quotes, a coverage percentage, and a WhatsApp-ready message.
- **Ideas** - deterministic Basic-mode suggestions with the mode badge always visible.
- **Assistant** - ask a question; the answer is streamed, and the mode badge tells you where it
  came from.

**Exports** - print-to-PDF, an `.ics` calendar file, a budget CSV, and a shareable URL fragment.

**Accessibility and display** - skip link, visible focus rings, 44px targets, three text sizes,
light/dark/system themes, Calm mode, reduced motion, and English, Hindi and Bengali labels.

---

## Architecture at a glance

```mermaid
flowchart LR
  UI[Next App Router UI] --> Store[Versioned localStorage plan]
  UI --> Engines[Pure browser engines]
  UI --> API[Stateless guarded API routes]
  API --> Providers[Gemini / OpenRouter / Basic fallback]
  UI --> SW[Service worker shell cache]
```

The server is stateless by design. The plan belongs to the browser; share links use a URL
_fragment_, which browsers do not send in HTTP requests, so nothing about a plan passes through the
network. The deterministic engines are pure functions with no network access, so the product keeps
working with the network switched off.

Full detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Source layout

```text
src/app/                  routes, global styles, metadata, API handlers
  api/chat|ideas|parse    the three guarded AI routes
  api/health              reads back the deployment mode, nothing else
src/features/            domain slices: schemas, pure services, UI
  budget timeline vendors health catering risks ideas assistant
  intake workspace accessibility
src/lib/                 shared utilities
  plan.ts plan-store.ts  versioned plan schema and the browser store
  money.ts dates.ts      integer minor units, ISO date-only helpers
  share.ts csv.ts ics.ts download.ts
  ai/                    Provider interface, config, Basic, Gemini, OpenRouter, prompts
  security/              guards, rate limiting, sanitising
  i18n/                  en, hi, bn
src/instrumentation.ts   startup hook: one warning if the shared limiter is off
tests/                   service, component, security and accessibility tests
  e2e/                   the Playwright journeys
scripts/                 stats.mjs prints the counts the docs quote
docs/                    architecture, traceability, tour, limitations, outcomes
public/sw.js             service worker: shell cache only, never /api/*
```

---

## Why each dependency

Every package in `dependencies` and `devDependencies`, with the reason it is here. A dependency
without a row is a dependency that should not be in `package.json`.

| Package                             | Scope   | Why it is here                                                                                     |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `@google/genai`                     | runtime | SDK behind the optional Gemini provider (`src/lib/ai/gemini.ts`).                                  |
| `@hookform/resolvers`               | runtime | `zodResolver` so the intake form validates with the same Zod schema the plan uses.                 |
| `next`                              | runtime | App Router framework: pages, metadata, the streaming API handlers, the service worker route.       |
| `react`                             | runtime | UI runtime for the client workspace components.                                                    |
| `react-dom`                         | runtime | The DOM renderer React needs in the browser.                                                       |
| `react-hook-form`                   | runtime | Intake form state, field errors and per-step validation.                                           |
| `zod`                               | runtime | Single source of truth for the plan, API payload and LLM output schemas.                           |
| `@axe-core/playwright`              | dev     | axe accessibility sweeps inside the Playwright journeys.                                           |
| `@eslint/eslintrc`                  | dev     | `FlatCompat`, which loads the Next.js legacy config under ESLint 9.                                |
| `@playwright/test`                  | dev     | The end-to-end journeys (`npm run test:e2e`).                                                      |
| `@testing-library/jest-dom`         | dev     | DOM matchers, imported once in `tests/setup.ts`.                                                   |
| `@testing-library/react`            | dev     | Renders components into jsdom for the component suite.                                             |
| `@testing-library/user-event`       | dev     | User-like typing, clicking and focus moves in component tests.                                     |
| `@types/node`                       | dev     | Node typings for the Next.js config, the Playwright config and the scripts.                        |
| `@types/react`                      | dev     | React typings for strict `tsc --noEmit`.                                                           |
| `@types/react-dom`                  | dev     | React DOM typings for strict `tsc --noEmit`.                                                       |
| `@vitest/coverage-v8`               | dev     | The v8 coverage provider that enforces the per-area thresholds.                                    |
| `autoprefixer`                      | dev     | Loaded by `postcss.config.mjs` to add vendor prefixes to the CSS output.                           |
| `eslint`                            | dev     | The lint gate (`eslint . --max-warnings=0`).                                                       |
| `eslint-config-next`                | dev     | Loaded by `eslint.config.mjs` through `compat.extends('next/core-web-vitals', 'next/typescript')`. |
| `eslint-import-resolver-typescript` | dev     | Loaded by `eslint.config.mjs`; resolves `@/` imports so `import/no-cycle` can see them.            |
| `eslint-plugin-import`              | dev     | Supplies `import/no-cycle`, `no-duplicates` and `no-self-import`.                                  |
| `eslint-plugin-jsx-a11y`            | dev     | Loaded by `eslint.config.mjs` via `plugin:jsx-a11y/recommended`.                                   |
| `eslint-plugin-vitest`              | dev     | `vitest/no-focused-tests` and `no-identical-title`, so a focused test cannot ship.                 |
| `fast-check`                        | dev     | Property tests for money rounding and allocator invariants.                                        |
| `jest-axe`                          | dev     | axe assertions inside the component accessibility tests.                                           |
| `jsdom`                             | dev     | The browser environment the Vitest component suite runs in.                                        |
| `postcss`                           | dev     | The CSS plugin host named by `postcss.config.mjs`; the `overrides.postcss` entry pins it.          |
| `prettier`                          | dev     | The `format:check` gate and formatting that matches editors.                                       |
| `tailwindcss`                       | dev     | Utility CSS loaded by `postcss.config.mjs` and themed in `tailwind.config.ts`.                     |
| `typescript`                        | dev     | Strict typecheck via `tsc --noEmit`.                                                               |
| `vitest`                            | dev     | The unit and component runner and the coverage gate.                                               |

---

## Verification

Every measured number lives in one place:
[`docs/DELIVERY_OUTCOMES.md`](docs/DELIVERY_OUTCOMES.md). Run
`node scripts/stats.mjs` to print the current counts, and `npm run check` to prove them.

| Check                   | What it proves                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run lint`          | Clean, 0 warnings (`--max-warnings=0`)                                  |
| `npm run typecheck`     | Clean, strict TypeScript                                                |
| `npm run format:check`  | Clean, Prettier                                                         |
| `npm run test:coverage` | The unit and component suites pass and the coverage thresholds hold     |
| `npm run build`         | `/`, `/intake`, `/plan` and the API routes compile                      |
| `npm run test:e2e`      | The Playwright journeys pass, including the accessibility sweeps        |
| `npm audit --omit=dev`  | Run npm audit --omit=dev. Last result: 0 vulnerabilities on 2026-10-29. |

Coverage thresholds are enforced in `vitest.config.mts` (90 / 70 / 90 / 90), so a regression below
those numbers fails the test run rather than being reported after the fact.

---

## Security

Rate limiting keys on the address of the **nearest trusted proxy**, never on anything the client
can choose. `x-real-ip` wins; otherwise the **last** entry of `x-forwarded-for` is used, because a
proxy that appends leaves the earlier entries under the client's control. This assumes a single
trusted proxy in front of the app, as on Vercel: behind a different topology, or with an untrusted
CDN in front, make sure the app is reachable only through the proxy and that it sets one of those
headers itself. The full threat model is in [`SECURITY.md`](SECURITY.md).

---

## Documentation

| File                                                     | What it covers                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| [`SECURITY.md`](SECURITY.md)                             | Threat model, controls, headers, rate limiting, dependency posture |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)           | Layers, data flow, module map, design decisions                    |
| [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md)           | Brief requirement to code to test mapping                          |
| [`docs/JUDGES_TOUR.md`](docs/JUDGES_TOUR.md)             | A ninety-second walkthrough                                        |
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md)             | What this is not, and what to check before relying on it           |
| [`docs/DELIVERY_OUTCOMES.md`](docs/DELIVERY_OUTCOMES.md) | The eleven acceptance outcomes, with evidence                      |
| [`docs/brief/`](docs/brief/)                             | The three supplied briefs, kept verbatim                           |

---

## A note on estimates

Budget and catering numbers are **estimates** built from visible assumptions (guest count, city
tier, venue type, currency). Tradition and festival packs are optional starting points, not
instructions - confirm them with family, elders, officiants or local organisers. The app never
infers your identity, religion, community or region from what you type; the packs are only ever
applied when you choose them.

## Licence

Private project. All rights reserved.
