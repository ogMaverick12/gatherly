# Delivery outcomes

The delivered acceptance outcomes, each with what was built and how it was verified.

**All are delivered.**

---

## Verification summary

Run these commands in this working tree. They print the current measurements; no counts are copied
here, so the document cannot drift from the code.

| Command                      | What it proves                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run lint`               | ESLint 9 flat config passes with `--max-warnings=0`                                                             |
| `npm run typecheck`          | Strict TypeScript passes                                                                                        |
| `npm run format:check`       | Prettier passes                                                                                                 |
| `npm run stats`              | Shape lists are within the allowance in [`quality-allowance.json`](quality-allowance.json)                      |
| `npm run test:coverage`      | Unit and component suites pass; prints test counts and coverage; thresholds in `vitest.config.mts` are enforced |
| `npm run build`              | Production build succeeds and prints the route table                                                            |
| `npm run test:e2e`           | Playwright journeys pass, including the accessibility sweeps                                                    |
| `npx playwright test --list` | Lists every Playwright test without running it                                                                  |
| `npm audit --omit=dev`       | Prints the current production dependency audit                                                                  |

`npm run check` runs lint, typecheck, format check, coverage, Knip and stats in that order.

### Code shape

`npm run stats` measures files over 200 lines, logic functions over 40 lines, components over 80
lines, and exports without JSDoc, then compares them with
[`quality-allowance.json`](quality-allowance.json). It exits non-zero when a count rises above the
allowance. The allowance is a ceiling, not a target: lower a value when its count drops. The notes
in the file say why each remaining entry is there.

Run `npm run stats` for the current lists rather than copying them here.

### Tests by area

Run `npm run test:coverage` for the current test count and coverage figures. This table maps each
test file to the behaviour it proves.

| File                                                       | What it proves                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/features/accessibility/axe.test.tsx`                | An automated accessibility check of the landing page, every intake step, all six workspace tabs and the display settings                       |
| `tests/features/accessibility/contrast.test.ts`            | WCAG contrast for the light, dark and calm palettes                                                                                            |
| `tests/lib/ai/ai.test.ts`                                  | The provider interface, Basic mode, provider selection and the failure kinds                                                                   |
| `tests/app/api/chat-stream.test.ts`                        | The chat route's frame order, fallback timing, disconnect and logging                                                                          |
| `tests/app/api/health.test.ts`                             | The deployment mode, both rate-limit modes, cache headers and the 429 path                                                                     |
| `tests/app/api/provider-errors.test.ts`                    | Every provider failure kind reaching a route ends as its own notice, never as "could not be reached"                                           |
| `tests/lib/security/route-factory.test.ts`                 | One guarded factory: ordering, 413 before parse, 405, no-store on every response                                                               |
| `tests/app/api/routes.test.ts`                             | The three routes end to end: validation, Basic fallback, SSE events                                                                            |
| `tests/features/assistant/assistant.test.ts`               | Intent classification and the Basic-mode answer                                                                                                |
| `tests/features/budget/budget.test.ts`                     | Allocation sums exactly to the budget; priorities and packs move the split; scenarios re-price per guest; warnings explain themselves          |
| `tests/features/catering/catering.test.ts`                 | Quantity estimates for food and drink                                                                                                          |
| `tests/lib/ai/chat-attempt.test.ts`                        | One attempt: retry only before the first token, then Basic mode                                                                                |
| `tests/lib/ai/chat-stream.test.ts`                         | Basic mode streams its answer a sentence at a time                                                                                             |
| `tests/features/accessibility/display-settings.test.tsx`   | Display settings, language, Calm mode, reduced motion                                                                                          |
| `tests/features/workspace/assistant-stream.test.tsx`       | The live answer bubble, Stop, and a connection that drops mid-answer                                                                           |
| `tests/features/workspace/shared-chrome.test.tsx`          | The site chrome, shared marks, tabs, display settings and intake heading                                                                       |
| `tests/features/intake/intake-form.test.tsx`               | The four steps, validation, the review, no pack is pre-selected                                                                                |
| `tests/features/workspace/landing-page.test.tsx`           | The landing page states what the app is for                                                                                                    |
| `tests/features/workspace/ideas-assistant-export.test.tsx` | The Ideas and Assistant panels, the export bar and the shared-plan prompt                                                                      |
| `tests/features/workspace/workspace-panels.test.tsx`       | The Overview, Budget, Timeline, Vendors, Ideas and Assistant panels, the health rail and the export bar                                        |
| `tests/features/workspace/plan-restore.test.tsx`           | A stored plan is restored on reload with no user action                                                                                        |
| `tests/features/workspace/plan-workspace.test.tsx`         | The workspace shell and the tabs                                                                                                               |
| `tests/features/vendors/vendors-panel.test.tsx`            | Adding a vendor, saving a quote, changing a status                                                                                             |
| `tests/features/workspace/csv.test.ts`                     | Quoting, escaping and formula-injection defence                                                                                                |
| `tests/lib/dates.test.ts`                                  | ISO date-only parsing, arithmetic, invalid dates rejected                                                                                      |
| `tests/lib/security/guards.test.ts`                        | Method, body cap, malformed JSON, schema failure, rate limit, headers                                                                          |
| `tests/features/health/health.test.ts`                     | Five weighted parts that sum to 100; the score is 0-100; every part says what was measured                                                     |
| `tests/lib/i18n/i18n.test.ts`                              | The three dictionaries have the same keys                                                                                                      |
| `tests/lib/ics.test.ts`                                    | A valid calendar file with the right dates, folded inside the 75-octet limit                                                                   |
| `tests/features/ideas/ideas.test.ts`                       | Deterministic Basic-mode ideas, one set per event type                                                                                         |
| `tests/app/instrumentation.test.ts`                        | The startup hook warns in production without the shared store and stays quiet in the edge runtime                                              |
| `tests/lib/ai/json.test.ts`                                | JSON read out of a fenced, an unfenced and a junk answer                                                                                       |
| `tests/lib/money.test.ts`                                  | Integer minor units, allocation by weight, per-currency formatting                                                                             |
| `tests/features/assistant/parse.test.ts`                   | Free text to intake fields; nothing is inferred                                                                                                |
| `tests/lib/plan-store.test.ts`                             | Storage, hydration, reload, corruption discarded                                                                                               |
| `tests/lib/plan/plan.test.ts`                              | The plan schema, `createPlan`, the sample templates, the packs                                                                                 |
| `tests/lib/property.test.ts`                               | The invariants a fixed example cannot: the allocator never loses a minor unit, the budget never overspends, a share link survives a round trip |
| `tests/lib/security/rate-limit.test.ts`                    | A fake Redis on a virtual clock: the window is set once and opens again when it elapses                                                        |
| `tests/features/risks/risks.test.ts`                       | The risk register and its triggers                                                                                                             |
| `tests/lib/security/sanitize.test.ts`                      | Control characters, zero-width characters, delimiters, CSV injection                                                                           |
| `tests/lib/ai/adapters.test.ts`                            | The Gemini and OpenRouter adapters: request shape, thinking settings, streamed frames                                                          |
| `tests/lib/ai/provider-errors.test.ts`                     | SDK and HTTP failures classified into the kind the user is told about                                                                          |
| `tests/lib/security/provider-retry-and-guards.test.ts`     | Selection, retry-once, timeout, safe logging, rate limiting                                                                                    |
| `tests/lib/security/rate-limit-fail-open.test.ts`          | The shared limiter fails open, marks the answer degraded and warns once a minute                                                               |
| `tests/lib/security/request-identity.test.ts`              | The client key behind a proxy, and the correlation id                                                                                          |
| `tests/lib/security/upstash-reply.test.ts`                 | The count and expiry read out of whichever pipeline reply shape arrives                                                                        |
| `tests/lib/share.test.ts`                                  | Compressed and plain round-trips, invalid payloads, chat and ideas dropped                                                                     |
| `tests/lib/ai/signal.test.ts`                              | The route deadline and the browser abort combined                                                                                              |
| `tests/lib/ai/sse.test.ts`                                 | Frames split across network chunks, comments and `[DONE]`                                                                                      |
| `tests/features/timeline/timeline.test.ts`                 | Milestones are computed backwards from the event date; a step that can no longer be done on time moves to today                                |
| `tests/features/vendors/vendors.test.ts`                   | Status transitions, quote scoring, coverage percentage, WhatsApp encoding                                                                      |

### End-to-end journeys

| File                            | Test                                                | What it proves                                                                                                  |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tests/e2e/chat-stream.spec.ts` | the answer grows frame by frame                     | The assistant bubble really is filled by more than one read, not painted at once                                |
| `tests/e2e/journey.spec.ts`     | landing to a working plan                           | The health ring, the budget maths, a milestone that sticks, a vendor status that moves the coverage             |
| `tests/e2e/journey.spec.ts`     | exports a budget CSV and a share link               | The two files the user takes away                                                                               |
| `tests/e2e/journey.spec.ts`     | the workspace is reachable with the keyboard alone  | Arrow keys move between the six tabs                                                                            |
| `tests/e2e/quality.spec.ts`     | the language can be changed with the keyboard alone | The keyboard alone switches the interface to Hindi                                                              |
| `tests/e2e/quality.spec.ts`     | the plan is still there after an offline reload     | The service worker keeps the shell available offline                                                            |
| `tests/e2e/quality.spec.ts`     | no API answer is kept in the cache                  | The service worker never stores an `/api/*` response                                                            |
| `tests/e2e/quality.spec.ts`     | completing a milestone moves the health score       | The headline number reacts to the work                                                                          |
| `tests/e2e/quality.spec.ts`     | the visible budget adds up to the total             | The displayed categories and contingency add up to the budget                                                   |
| `tests/e2e/quality.spec.ts`     | accessibility screens across the main views         | `axe` finds no violation on the landing page, the intake form, the workspace, the budget tab or the vendors tab |

---

## 1. Global landing experience

> _presents the product, inclusive event types, feature value, and one-click sample plans for
> weddings, birthdays, and community events._

**Built.** The landing page opens with the editorial split hero - _"Make room for the moments people
will remember."_ - and states plainly what the product is for, what it does, and that the plan
stays in the browser. Three feature cards cover budget, timeline and vendors. Below them, three
sample plan cards:

| Sample                          | Shape                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| **A 180-guest wedding**         | Tier 2 city, Indian rupees, food and photography as priorities                         |
| **A 60-guest garden birthday**  | Tier 1 city, US dollars, photography, food and decor, nut-free requirement             |
| **A 240-guest community feast** | Pounds, accessibility and logistics as priorities, a shared-meal pack already selected |

Clicking a card creates a **real, editable plan** in the browser store and goes to the workspace -
not a screenshot and not a demo route.

**Verified.** `tests/features/workspace/landing-page.test.tsx` asserts what the page says; the three
templates and their intakes are covered by `tests/lib/plan/plan.test.ts`; the end-to-end path from a
sample card to a rendered workspace is `tests/e2e/journey.spec.ts` test 1.

---

## 2. Intake

> _accepts event type, date, guests, city tier, budget, priorities, culture, dietary/access needs,
> language, and optional packs; all inputs are schema-validated._

**Built.** A four-step form - **basics, money, needs, extras** - with a review step before the plan
is created.

| Step   | Fields                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| Basics | Event type, event date (or "not decided"), guest count (with an "is an estimate" flag), city tier, venue type |
| Money  | Currency (20 supported), budget                                                                               |
| Needs  | Priorities (up to 4), dietary needs, access needs, a culture note (max 300 characters)                        |
| Extras | Optional packs, language, free-text notes (max 2000 characters)                                               |

**Every input is schema-validated.** `IntakeFormSchema` in `src/features/intake/schema.ts` is a
strict Zod object: unknown keys are rejected, the guest count is bounded (1-5000), the budget is
bounded, and the date is checked for both format and existence ("that date does not exist"). The
step machine only advances when the current step parses. The plan is validated a second time by
`PlanSchema` before it is stored.

**Verified.** `tests/features/intake/intake-form.test.tsx` covers the step machine, the "does not
move on when a step is invalid" behaviour, the review step and the pack opt-in;
`tests/lib/plan/plan.test.ts` covers the schemas and `createPlan`.

---

## 3. Browser-only planning engines

> _calculate budget allocations, what-if scenarios, backward milestones, vendor coverage, health
> score, risks, run-of-show, and catering estimates without requiring a network._

**Built.** Eight pure services, none of which touches the network, the clock or a random source:

| Engine    | File                              | What it computes                                                    |
| --------- | --------------------------------- | ------------------------------------------------------------------- |
| Budget    | `src/features/budget/index.ts`    | Category allocation, per-guest figures, what-if scenarios, warnings |
| Timeline  | `src/features/timeline/index.ts`  | The backward milestone ladder, the run of show, state merging       |
| Vendors   | `src/features/vendors/index.ts`   | Status, quote score, coverage percentage, the WhatsApp link         |
| Health    | `src/features/health/index.ts`    | Five weighted, explainable parts and the next action                |
| Risks     | `src/features/risks/index.ts`     | The risk register and its triggers                                  |
| Catering  | `src/features/catering/index.ts`  | Food and drink quantities                                           |
| Ideas     | `src/features/ideas/index.ts`     | Deterministic ideas from the plan's own numbers                     |
| Assistant | `src/features/assistant/index.ts` | Intent classification and the Basic-mode answer                     |

Money is integer minor units throughout, and the allocation uses the largest-remainder method, so
the parts always sum exactly to the total.

**Verified.** `tests/features/budget/budget.test.ts`, `tests/features/timeline/timeline.test.ts`, `tests/features/vendors/vendors.test.ts`,
`tests/features/health/health.test.ts`, `tests/features/risks/risks.test.ts`, `tests/features/catering/catering.test.ts`, `tests/features/ideas/ideas.test.ts`,
`tests/features/assistant/assistant.test.ts` and `tests/lib/money.test.ts`, plus `tests/lib/property.test.ts` for the
invariants a fixed example cannot show. The Playwright journey _the plan is still there after an
offline reload_ confirms the plan renders with the network switched off.

---

## 4. Plan workspace

> _exposes Overview, Budget, Timeline, Vendors, Ideas, and Assistant tabs with responsive behavior,
> visible estimates, and no silent AI edits._

**Built.** Six tabs in `src/features/workspace/components/`:

- **Overview** - health ring with the score band, the five explained parts, the next action, the risk
  register, the checklist of outstanding tasks and the catering estimate.
- **Budget** - the visible category math (amount, share percentage, per guest), the warnings, and
  the **What if** scenarios.
- **Timeline** - the backward milestone ladder with owners and dates, tickable, plus the run of
  show.
- **Vendors** - the checklist with status, quotes, coverage, and the WhatsApp message.
- **Ideas** - the ideas with the mode badge and an explicit **Apply to the plan** button that adds
  exactly one task.
- **Assistant** - the question box and the streamed answer, with the mode badge on every message.

**Visible estimates.** Every money figure is shown with its share and its per-guest value, and the
allocation is visible rather than a single total.

**No silent AI edits.** The assistant has no control that changes the plan. The only AI-sourced
change in the product is the Ideas panel's **Apply to the plan** button, which says exactly what
it will do: _"This adds one task to your checklist. Nothing else in the plan changes."_

**Responsive.** The tab strip becomes a bottom navigation bar at narrow widths; the layout is
single-column on mobile and the panels stack.

**Verified.** `tests/features/workspace/plan-workspace.test.tsx`,
`tests/features/workspace/workspace-panels.test.tsx`,
`tests/features/workspace/ideas-assistant-export.test.tsx`,
`tests/features/vendors/vendors-panel.test.tsx`, and `tests/e2e/journey.spec.ts` test 3, which
reaches every tab with the keyboard alone.

---

## 5. Optional packs, explicitly selected

> _are explicitly selected by the user and never infer identity, religion, community, or region._

**Built.** Eight packs in `src/lib/plan/packs.ts`: mehendi-haldi, sangeet-evening, cocktail-hour,
community-feast, potluck, street-food-style, carnival-procession and plant-based-feast. Each
contributes checklist items and shifts a few percentage points of the budget.

- **No pack is pre-selected.** The default intake value for `packs` is `[]`.
- **Nothing is inferred.** The app never derives a pack from the event type, the culture note, the
  notes field, the city tier or the language. A pack appears in the plan only if the user pressed
  its button.
- **The AI is forbidden from inferring it.** `SYSTEM_RULES` in `src/lib/ai/prompts.ts`: _"Never
  infer the user religion, community, region, nationality or culture from their words. Do not
  suggest a tradition or festival unless the user asked for one."_
- **The parse route is forbidden from recording it.** `PARSE_SYSTEM_PROMPT` lists the fields it may
  extract, and none of them is about religion, community, region or culture.
- **The disclaimer travels with the pack**: _"Packs are optional starting points. Confirm the
  details with family, elders, officiants or local organisers before you rely on them."_

**Verified.** `tests/lib/plan/plan.test.ts` covers the pack definitions and their budget shifts;
`tests/features/intake/intake-form.test.tsx` asserts that no pack is chosen by default;
`tests/features/assistant/parse.test.ts` covers the parse route's field list.

---

## 6. Guarded AI routes

> _are stateless, guarded, schema-validated, prompt-injection aware, and visibly fall back to Basic
> mode when providers are unavailable._

**Built.** Four routes - `/api/chat`, `/api/ideas`, `/api/parse` and `/api/health` - built with the
factories in `src/lib/security/route.ts`: the POST routes use `createRoute`, health uses
`createGetRoute`. The POST routes share this chain:

1. `POST` only.
2. Rate limited: 20 per minute per route per client, `429` with `Retry-After` when refused.
3. Body capped at **16 KiB**, enforced while streaming, with `413` on overflow.
4. JSON parsed; a malformed body is a `400`.
5. Validated against a strict Zod schema; unknown keys rejected.
6. Answered with `Cache-Control: no-store`.

**No user data at rest.** No plan or message is stored between requests. Rate-limit counters live in
the limiter instance, or in the shared Upstash store when it is configured. The client sends the
plan summary it already holds; the server answers and forgets.

**Prompt-injection aware.** User text is stripped of control and zero-width characters, capped,
wrapped in an explicit `<user_input>` block, and any attempt to close that block is neutralised. The
system prompt states that the block is data and that instructions inside it must be ignored.

**Visible fallback.** `selectProvider()` returns Basic mode whenever no provider is configured, no
key is present, or the call fails. The chat route streams a `mode` event **before** the answer, so
the badge is correct before the text appears, and a `done` event carries the final mode and any
notices. One retry, only for a retryable failure (429/502/503/504); a 20-second route timeout.

**Verified.** `tests/app/api/routes.test.ts` covers the three AI routes end to end;
`tests/lib/security/guards.test.ts` covers the guard chain; `tests/lib/security/sanitize.test.ts`
covers sanitising; `tests/lib/security/provider-retry-and-guards.test.ts` covers selection, retry,
timeout, safe logging and the rate limiter; `tests/lib/ai/adapters.test.ts` covers the Gemini and
OpenRouter adapters. No test in the suite touches the network.

---

## 7. Exports

> _include print-to-PDF, calendar, budget CSV, and shareable URL fragments; `/api/*` is never cached
> by the service worker._

**Built.**

| Export                    | What it produces                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Print or save as PDF      | `window.print()` against a print-styled layout                                                     |
| Add to a calendar         | `gatherly-plan.ics` - the event plus an all-day event per milestone                                |
| Export the budget as CSV  | `gatherly-budget.csv`, with a BOM so spreadsheets read the encoding correctly                      |
| Copy a share link         | A URL whose **fragment** carries the plan, deflate-compressed when supported and base64url encoded |
| Download the plan as JSON | `gatherly-plan.json`, the whole plan                                                               |
| Restore from a file       | Reads a JSON plan back, validated with `PlanSchema`                                                |

**The service worker never caches `/api/*`.** `public/sw.js` returns early for any path starting
with `/api/`, and the API responses are additionally marked `no-store`.

**The share link is in the fragment**, which browsers do not send in HTTP requests, so a share
creates no server state and leaves no trace in a proxy log. Only the parts worth sharing travel
(intake, tasks, vendors, milestones); **chat history and saved ideas are deliberately dropped**.
An invalid, truncated or corrupted fragment returns `null` rather than a partial plan.

**Verified.** `tests/features/workspace/csv.test.ts`, `tests/lib/ics.test.ts`,
`tests/lib/share.test.ts`, `tests/features/workspace/ideas-assistant-export.test.tsx`, and
`tests/e2e/journey.spec.ts` test 2, which downloads the CSV and copies the share link in a real
browser.

---

## 8. Accessibility layer

> _includes skip link, text sizing, contrast, language selection, speech feature detection, Calm
> mode, reduced motion, keyboard-friendly targets, and translated visible labels._

**Built.**

| Feature                   | Where                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skip link                 | `src/app/layout.tsx` - the first tab stop, focused and visible                                                                                                  |
| Text sizing               | Standard / Large / Largest, applied as `data-text-size` on the document element                                                                                 |
| Contrast                  | Design tokens as CSS custom properties; measured by the test suite                                                                                              |
| Language selection        | English / हिन्दी / বাংলা, applied immediately without a reload                                                                                                  |
| Speech feature detection  | `speechSupported` in the accessibility provider; the read-aloud control is hidden and an explanation shown when the browser cannot do it                        |
| Calm mode                 | Quieter palette, softer edges, no celebratory motion, nothing that flashes                                                                                      |
| Reduced motion            | `prefers-reduced-motion` **and** an explicit in-app switch                                                                                                      |
| Keyboard-friendly targets | Every action is at least 44px; the tabs are arrow-key navigable; focus rings are visible                                                                        |
| Translated app labels     | The shell, intake and workspace controls read from the dictionary in all three languages. Engine-generated health band labels and explanations are English-only |

**Contrast is measured, not asserted.** `tests/features/accessibility/contrast.test.ts` computes the
WCAG contrast ratio for every foreground/background pair in the light, dark and calm themes.
Contrast bugs have been found and fixed this way: the marigold-on-marigold pair in dark mode (a new
`--color-on-marigold` token) and the calm-mode rose.

**Verified.** `tests/features/accessibility/contrast.test.ts` checks the light, dark and calm themes;
`tests/features/accessibility/display-settings.test.tsx` covers the settings;
`tests/lib/i18n/i18n.test.ts` asserts that all three dictionaries carry identical keys; and
`tests/e2e/journey.spec.ts` test 3 covers keyboard navigation.

---

## 9. Documentation

> _explains the architecture, security model, limitations, product tour, setup, and traceability
> from requirements to code and tests._

**Built.**

| Document                                            | Contents                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [`README.md`](../README.md)                         | What it is, quick start, every script, the environment table, the feature list, the verification table                                       |
| [`SECURITY.md`](../SECURITY.md)                     | Threat model, the data table, every control, the dependency posture, the known gaps                                                          |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)           | The layers, the data flow, the engines, money and dates, the provider model, accessibility, offline, the design system, the testing strategy |
| [`docs/TRACEABILITY.md`](TRACEABILITY.md)           | Every outcome and requirement area mapped to code and tests, the test inventory, and implementation notes                                    |
| [`docs/TOUR.md`](TOUR.md)                           | A ninety-second product walkthrough with the actual labels                                                                                   |
| [`docs/LIMITATIONS.md`](LIMITATIONS.md)             | Honest sections on what the numbers are and are not                                                                                          |
| [`docs/LIVE_VERIFICATION.md`](LIVE_VERIFICATION.md) | What was observed when the live AI path and rate-limit modes ran                                                                             |
| [`docs/DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md) | This document                                                                                                                                |

**Setup** is in the README: `npm install`, `cp .env.example .env.local`, `npm run dev`, then
`npm run check` and `npm run build`.

**Traceability** runs both ways: the acceptance outcomes map to code and tests, and the
implementation notes are recorded explicitly in
[`TRACEABILITY.md` section 5](TRACEABILITY.md#5-implementation-notes).

---

## 10. What is deliberately absent

The product scope is deliberate; these are the things a reviewer might notice are missing and should
be told they are intentional:

| Absent                                  | Why                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Accounts, sign-in, sessions             | The plan belongs to the browser. A server session would mean server state.                                |
| Database                                | Same reason.                                                                                              |
| Payments, deposits                      | Out of scope for a planning companion.                                                                    |
| File upload                             | The only file input is the JSON restore, which never leaves the browser.                                  |
| Vendor marketplace, live pricing        | Prices would be guesses without a real market source. The app is explicit that its numbers are estimates. |
| Notification emails                     | Requires server state and a mail provider. The timeline tells you what is late.                           |
| Multi-user collaboration                | Requires server state and a conflict model.                                                               |
| Automatic culture or religion inference | Explicitly forbidden by the product's own principles.                                                     |
| `output: 'export'` static export        | The app has API routes; a static export would remove them.                                                |

---

## 11. Known gaps

Restated here so nothing is buried:

1. **The in-process rate limiter is per-instance.** Set `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` in production. The live mode is observable: `GET /api/health`
   reports `rateLimit: 'shared' | 'per-instance'`, and a production start without the variables
   logs one warning naming them.
2. **Dependency audit.** Run `npm audit --omit=dev` for the current result.
3. **No load test and no cross-browser matrix** beyond Chromium.
4. **Coverage is not complete.** Run `npm run test:coverage` for the current figures. The gaps are in
   UI branches and in provider fallback paths.
5. **The translations are working translations**, not native review.
6. **The numbers are estimates** - see [`LIMITATIONS.md`](LIMITATIONS.md).
