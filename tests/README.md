# Tests

Four layers, each with one job. The gate for every phase is `npm run check`,
which runs the unit layer with coverage.

| Layer      | Where                                                           | What it proves                                                                                                                                                                     | How to run         |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Unit       | `tests/*.test.ts`                                               | The engines: money, budget, timeline, vendors, risks, ideas, health, chat, ICS, CSV, share links, AI providers                                                                     | `npm run test`     |
| Property   | `tests/property.test.ts`                                        | The invariants that a fixed example cannot: the allocator never loses a minor unit, the calendar export never breaks the 75-octet limit, a share link always survives a round trip | `npm run test`     |
| Component  | `tests/components/*.test.tsx`, `tests/accessibility/*.test.tsx` | The screens: the landing page, the intake wizard, the workspace tabs, the display settings, and an automated accessibility check on each of them                                   | `npm run test`     |
| End to end | `tests/e2e/*.spec.ts`                                           | The journeys: landing to a working plan, keyboard-only navigation, an offline reload, the exported files, and an accessibility check on five screens                               | `npm run test:e2e` |

## The gate

```bash
npm run check
```

That is lint, typecheck, `prettier --check`, and the unit tests with coverage.
Coverage thresholds live in `vitest.config.ts` and are never lowered: a gap is
closed with more tests, not with a smaller number.

## What each layer is allowed to do

- No real network. The AI routes are tested with a stub provider.
- No real clock. Every service takes the day it should work with, so a test
  says `2026-10-22` instead of "today".
- No skipped or focused tests. `.only` and `.skip` are not allowed.

## Accessibility

`tests/accessibility/axe.test.tsx` runs `jest-axe` over the landing page, every
intake step, all six workspace tabs and the display settings, and expects no
violations at all. `tests/e2e/quality.spec.ts` runs `@axe-core/playwright` over
five screens in a real browser, because a component test cannot see what the
server-rendered page actually looks like.

## End to end

```bash
npm run e2e:install   # once, to download Chromium
npm run test:e2e
```

The end-to-end run builds the app and starts it on port 3210, so it exercises
the same bundle a judge would run. Set `PORT` to use another port.

The offline flow needs the service worker, and the service worker only
registers on a secure origin, so the suite talks to `http://localhost:3210`
rather than `http://127.0.0.1:3210`.

## Writing a new test

- Name it after the behaviour, not the function: "rejects a past event date",
  not "test event date".
- Keep it next to the source it covers: a test for `src/lib/money.ts` belongs in
  `tests/money.test.ts`.
- Cover the happy path, the edge case and the error case for every service
  function.
