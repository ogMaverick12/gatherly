# Delivery outcomes

The eleven acceptance outcomes from
[`brief/Gatherly delivery outcomes.md`](brief/Gatherly%20delivery%20outcomes.md), each with what
was built and how it was verified.

**All eleven are delivered.**

---

## Verification summary

Every number below was measured in this working tree, in this order. This is the one file that
holds measured numbers; other documents link here.

| Command                 | Result                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`          | Clean. ESLint 9 flat config, `--max-warnings=0`, 0 errors, 0 warnings                                                                                                                                                                                                                 |
| `npm run typecheck`     | Clean. `tsc --noEmit`, strict mode, no errors                                                                                                                                                                                                                                         |
| `npm run format:check`  | Clean. Prettier                                                                                                                                                                                                                                                                       |
| `npm test`              | **37 files, 503 tests, 503 passed, 0 failed**                                                                                                                                                                                                                                         |
| `npm run test:coverage` | **92.86%** statements, **79.15%** branches, **92.2%** functions, **94.56%** lines (thresholds 90 / 70 / 90 / 90, enforced)                                                                                                                                                            |
| `npm run build`         | Succeeds. Routes: `/`, `/intake`, `/plan`, `/api/chat`, `/api/health`, `/api/ideas`, `/api/parse`. First Load JS: 103 kB shared, 161 kB for `/plan`                                                                                                                                   |
| `npm run test:e2e`      | **13 passed** (3 journeys, 5 quality flows, 5 accessibility screens)                                                                                                                                                                                                                  |
| `npm audit --omit=dev`  | **0 vulnerabilities**                                                                                                                                                                                                                                                                 |
| `npm audit`             | **7 vulnerabilities**, all in the development toolchain (Tailwind's braces chain, the Next ESLint config's fast-glob chain). None ships; fixes are breaking major upgrades (Tailwind 4, eslint-config-next@14). Documented in [`../SECURITY.md`](../SECURITY.md#3-dependency-posture) |

`node scripts/stats.mjs` prints these counts again, so they cannot drift.

### Tests per file

| File                                       | Tests | What it proves                                                                                                                                 |
| ------------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/accessibility/axe.test.tsx`         | 14    | An automated accessibility check of the landing page, every intake step, all six workspace tabs and the display settings                       |
| `tests/accessibility/contrast.test.ts`     | 19    | WCAG contrast for the light, dark and calm palettes                                                                                            |
| `tests/ai.test.ts`                         | 11    | The provider interface, Basic mode, provider selection                                                                                         |
| `tests/api/routes.test.ts`                 | 18    | The three routes end to end: validation, Basic fallback, SSE events                                                                            |
| `tests/api/health.test.ts`                 | 9     | The deployment mode, both rate-limit modes, cache headers and the 429 path                                                                     |
| `tests/assistant.test.ts`                  | 14    | Intent classification and the Basic-mode answer                                                                                                |
| `tests/budget.test.ts`                     | 15    | Allocation sums exactly to the budget; priorities and packs move the split; scenarios re-price per guest; warnings explain themselves          |
| `tests/catering.test.ts`                   | 9     | Quantity estimates for food and drink                                                                                                          |
| `tests/components/accessibility.test.tsx`  | 16    | Display settings, language, Calm mode, reduced motion                                                                                          |
| `tests/components/basics.test.tsx`         | 25    | Shared component behaviour across the workspace                                                                                                |
| `tests/components/intake.test.tsx`         | 8     | The four steps, validation, the review, no pack is pre-selected                                                                                |
| `tests/components/landing.test.tsx`        | 6     | The landing page states what the app is for                                                                                                    |
| `tests/components/panels-extra.test.tsx`   | 14    | The Vendors and Assistant panels, and the exports                                                                                              |
| `tests/components/panels.test.tsx`         | 25    | The Overview, Budget, Timeline and Ideas panels                                                                                                |
| `tests/components/plan-restore.test.tsx`   | 2     | A stored plan is restored on reload with no user action                                                                                        |
| `tests/components/plan-workspace.test.tsx` | 8     | The workspace shell and the tabs                                                                                                               |
| `tests/components/vendors.test.tsx`        | 14    | Adding a vendor, saving a quote, changing a status                                                                                             |
| `tests/csv.test.ts`                        | 9     | Quoting, escaping and formula-injection defence                                                                                                |
| `tests/dates.test.ts`                      | 11    | ISO date-only parsing, arithmetic, invalid dates rejected                                                                                      |
| `tests/guards.test.ts`                     | 22    | Method, body cap, malformed JSON, schema failure, rate limit, headers                                                                          |
| `tests/health.test.ts`                     | 8     | Five weighted parts that sum to 100; the score is 0-100; every part says what was measured                                                     |
| `tests/i18n.test.ts`                       | 5     | The three dictionaries have the same keys                                                                                                      |
| `tests/instrumentation.test.ts`            | 2     | The startup hook warns in production without the shared store and stays quiet in the edge runtime                                              |
| `tests/ics.test.ts`                        | 9     | A valid calendar file with the right dates, folded inside the 75-octet limit                                                                   |
| `tests/ideas.test.ts`                      | 16    | Deterministic Basic-mode ideas, one set per event type                                                                                         |
| `tests/money.test.ts`                      | 14    | Integer minor units, allocation by weight, per-currency formatting                                                                             |
| `tests/parse.test.ts`                      | 13    | Free text to intake fields; nothing is inferred                                                                                                |
| `tests/plan-store.test.ts`                 | 10    | Storage, hydration, reload, corruption discarded                                                                                               |
| `tests/plan.test.ts`                       | 13    | The plan schema, `createPlan`, the sample templates, the packs                                                                                 |
| `tests/property.test.ts`                   | 21    | The invariants a fixed example cannot: the allocator never loses a minor unit, the budget never overspends, a share link survives a round trip |
| `tests/risks.test.ts`                      | 21    | The risk register and its triggers                                                                                                             |
| `tests/sanitize.test.ts`                   | 14    | Control characters, zero-width characters, delimiters, CSV injection                                                                           |
| `tests/security/adapters.test.ts`          | 13    | The Gemini and OpenRouter adapters                                                                                                             |
| `tests/security/providers.test.ts`         | 19    | Selection, retry-once, timeout, safe logging, rate limiting                                                                                    |
| `tests/share.test.ts`                      | 15    | Compressed and plain round-trips, invalid payloads, chat and ideas dropped                                                                     |
| `tests/timeline.test.ts`                   | 14    | Milestones are computed backwards from the event date; a step that can no longer be done on time moves to today                                |
| `tests/vendors.test.ts`                    | 27    | Status transitions, quote scoring, coverage percentage, WhatsApp encoding                                                                      |

**Total: 503 tests across 37 files.**

### End-to-end journeys

| File                        | Test                                                | What it proves                                                                                                  |
| --------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tests/e2e/journey.spec.ts` | landing to a working plan                           | The health ring, the budget maths, a milestone that sticks, a vendor status that moves the coverage             |
| `tests/e2e/journey.spec.ts` | exports a budget CSV and a share link               | The two files the user takes away                                                                               |
| `tests/e2e/journey.spec.ts` | the workspace is reachable with the keyboard alone  | Arrow keys move between the six tabs                                                                            |
| `tests/e2e/quality.spec.ts` | the language can be changed with the keyboard alone | The keyboard alone switches the interface to Hindi                                                              |
| `tests/e2e/quality.spec.ts` | the plan is still there after an offline reload     | The service worker keeps the shell available offline                                                            |
| `tests/e2e/quality.spec.ts` | no API answer is kept in the cache                  | The service worker never stores an `/api/*` response                                                            |
| `tests/e2e/quality.spec.ts` | completing a milestone moves the health score       | The headline number reacts to the work                                                                          |
| `tests/e2e/quality.spec.ts` | the visible budget adds up to the total             | The displayed categories and contingency add up to the budget                                                   |
| `tests/e2e/quality.spec.ts` | five accessibility screens                          | `axe` finds no violation on the landing page, the intake form, the workspace, the budget tab or the vendors tab |

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

**Verified.** `tests/components/landing.test.tsx` (6 tests) asserts what the page says; the three
templates and their intakes are covered by `tests/plan.test.ts` (13 tests); the end-to-end path
from a sample card to a rendered workspace is `tests/e2e/journey.spec.ts` test 1.

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

**Verified.** `tests/components/intake.test.tsx` (8 tests) covers the step machine, the
"does not move on when a step is invalid" behaviour, the review step and the pack opt-in;
`tests/plan.test.ts` (13 tests) covers the schemas and `createPlan`.

---

## 3. Browser-only planning engines

> _calculate budget allocations, what-if scenarios, backward milestones, vendor coverage, health
> score, risks, run-of-show, and catering estimates without requiring a network._

**Built.** Eight pure services, none of which touches the network, the clock or a random source:

| Engine    | File                                 | What it computes                                                    |
| --------- | ------------------------------------ | ------------------------------------------------------------------- |
| Budget    | `src/features/budget/services.ts`    | Category allocation, per-guest figures, what-if scenarios, warnings |
| Timeline  | `src/features/timeline/services.ts`  | The backward milestone ladder, the run of show, state merging       |
| Vendors   | `src/features/vendors/services.ts`   | Status, quote score, coverage percentage, the WhatsApp link         |
| Health    | `src/features/health/services.ts`    | Five weighted, explainable parts and the next action                |
| Risks     | `src/features/risks/services.ts`     | The risk register and its triggers                                  |
| Catering  | `src/features/catering/services.ts`  | Food and drink quantities                                           |
| Ideas     | `src/features/ideas/services.ts`     | Deterministic ideas from the plan's own numbers                     |
| Assistant | `src/features/assistant/services.ts` | Intent classification and the Basic-mode answer                     |

Money is integer minor units throughout, and the allocation uses the largest-remainder method, so
the parts always sum exactly to the total.

**Verified.** `tests/budget.test.ts`, `tests/timeline.test.ts`, `tests/vendors.test.ts`,
`tests/health.test.ts`, `tests/risks.test.ts`, `tests/catering.test.ts`, `tests/ideas.test.ts`,
`tests/assistant.test.ts` and `tests/money.test.ts`, plus `tests/property.test.ts` for the
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

**Verified.** `tests/components/plan-workspace.test.tsx` (8), `tests/components/panels.test.tsx`
(25), `tests/components/panels-extra.test.tsx` (14), `tests/components/vendors.test.tsx` (14), and
`tests/e2e/journey.spec.ts` test 3, which reaches every tab with the keyboard alone.

---

## 5. Optional packs, explicitly selected

> _are explicitly selected by the user and never infer identity, religion, community, or region._

**Built.** Eight packs in `src/lib/plan.ts`: mehendi-haldi, sangeet-evening, cocktail-hour,
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

**Verified.** `tests/plan.test.ts` covers the pack definitions and their budget shifts;
`tests/components/intake.test.tsx` asserts that no pack is chosen by default; `tests/parse.test.ts`
(13) covers the parse route's field list.

---

## 6. Guarded AI routes

> _are stateless, guarded, schema-validated, prompt-injection aware, and visibly fall back to Basic
> mode when providers are unavailable._

**Built.** Four routes - `/api/chat`, `/api/ideas`, `/api/parse` and `/api/health` - all wrapped in the same guard
chain in `src/lib/security/guards.ts`:

1. `POST` only.
2. Rate limited: 20 per minute per route per client, `429` with `Retry-After` when refused.
3. Body capped at **16 KiB**, enforced while streaming, with `413` on overflow.
4. JSON parsed; a malformed body is a `400`.
5. Validated against a strict Zod schema; unknown keys rejected.
6. Answered with `Cache-Control: no-store`.

**Stateless.** Nothing is stored between requests. The client sends the plan summary it already
holds; the server answers and forgets.

**Prompt-injection aware.** User text is stripped of control and zero-width characters, capped,
wrapped in an explicit `<user_input>` block, and any attempt to close that block is neutralised. The
system prompt states that the block is data and that instructions inside it must be ignored.

**Visible fallback.** `selectProvider()` returns Basic mode whenever no provider is configured, no
key is present, or the call fails. The chat route streams a `mode` event **before** the answer, so
the badge is correct before the text appears, and a `done` event carries the final mode and any
notices. One retry, only for a retryable failure (429/502/503/504); a 20-second route timeout.

**Verified.** `tests/api/routes.test.ts` (18) covers all three routes end to end; `tests/guards.test.ts`
(22) covers the guard chain; `tests/sanitize.test.ts` (14) covers the sanitising;
`tests/security/providers.test.ts` (19) covers selection, retry, timeout, safe logging and the rate
limiter; `tests/security/adapters.test.ts` (13) covers the Gemini and OpenRouter adapters. No test
in the suite touches the network.

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

**Verified.** `tests/csv.test.ts` (9), `tests/ics.test.ts` (9), `tests/share.test.ts` (15),
`tests/components/panels-extra.test.tsx` (14), and `tests/e2e/journey.spec.ts` test 2, which
downloads the CSV and copies the share link in a real browser.

---

## 8. Accessibility layer

> _includes skip link, text sizing, contrast, language selection, speech feature detection, Calm
> mode, reduced motion, keyboard-friendly targets, and translated visible labels._

**Built.**

| Feature                   | Where                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Skip link                 | `src/app/layout.tsx` - the first tab stop, focused and visible                                                                           |
| Text sizing               | Standard / Large / Largest, applied as `data-text-size` on the document element                                                          |
| Contrast                  | Design tokens as CSS custom properties; measured by the test suite                                                                       |
| Language selection        | English / हिन्दी / বাংলা, applied immediately without a reload                                                                           |
| Speech feature detection  | `speechSupported` in the accessibility provider; the read-aloud control is hidden and an explanation shown when the browser cannot do it |
| Calm mode                 | Quieter palette, softer edges, no celebratory motion, nothing that flashes                                                               |
| Reduced motion            | `prefers-reduced-motion` **and** an explicit in-app switch                                                                               |
| Keyboard-friendly targets | Every action is at least 44px; the tabs are arrow-key navigable; focus rings are visible                                                 |
| Translated visible labels | Every visible string comes from the dictionary, in all three languages                                                                   |

**Contrast is measured, not asserted.** `tests/accessibility/contrast.test.ts` computes the WCAG
contrast ratio for every foreground/background pair in the light, dark and calm themes - 19
assertions, all passing. Two contrast bugs were found and fixed this way: the marigold-on-marigold
pair in dark mode (a new `--color-on-marigold` token) and the calm-mode rose.

**Verified.** `tests/accessibility/contrast.test.ts` (19 tests over the light, dark and calm
themes), `tests/components/accessibility.test.tsx` (16), `tests/i18n.test.ts` (5, asserting all three
dictionaries carry identical keys), and `tests/e2e/journey.spec.ts` test 3.

---

## 9. Documentation

> _explains the architecture, security model, limitations, Judge's tour, setup, and traceability to
> the supplied build plan._

**Built.**

| Document                                            | Contents                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [`README.md`](../README.md)                         | What it is, quick start, every script, the environment table, the feature list, the verification table                                       |
| [`SECURITY.md`](../SECURITY.md)                     | Threat model, the data table, every control, the dependency posture, the known gaps                                                          |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)           | The layers, the data flow, the engines, money and dates, the provider model, accessibility, offline, the design system, the testing strategy |
| [`docs/TRACEABILITY.md`](TRACEABILITY.md)           | Every outcome and every brief area mapped to code and tests, the test inventory, and the deviations from the plan                            |
| [`docs/JUDGES_TOUR.md`](JUDGES_TOUR.md)             | A ninety-second walkthrough with the actual labels                                                                                           |
| [`docs/LIMITATIONS.md`](LIMITATIONS.md)             | Eleven honest sections on what the numbers are and are not                                                                                   |
| [`docs/DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md) | This document                                                                                                                                |
| [`docs/brief/`](brief/)                             | The three supplied briefs, kept verbatim                                                                                                     |

**Setup** is in the README: `npm install`, `cp .env.example .env.local`, `npm run dev`, then
`npm run check` and `npm run build`.

**Traceability** runs both ways: the eleven outcomes map to code and tests, and the supplied
implementation plan maps to the files that carry it out. The three deviations from the plan are
recorded explicitly in [`TRACEABILITY.md` section 5](TRACEABILITY.md#5-deviations-from-the-supplied-plan)
rather than left implicit.

---

## 10. What is deliberately absent

The brief says what to build; these are the things a reviewer might notice are missing and should
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
| Automatic culture or religion inference | Explicitly forbidden by the brief and by the product's own principles.                                    |
| `output: 'export'` static export        | The app has API routes; a static export would remove them.                                                |

---

## 11. Known gaps

Restated here so nothing is buried:

1. **The in-process rate limiter is per-instance.** Set `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` in production. The live mode is observable: `GET /api/health`
   reports `rateLimit: 'shared' | 'per-instance'`, and a production start without the variables
   logs one warning naming them.
2. **Advisories remain in the dev toolchain** (Tailwind's braces chain, the Next ESLint config's
   fast-glob chain). None ships; vitest's critical advisory was closed by upgrading to Vitest 5,
   and two more were closed with package overrides. The current count is in the
   [verification summary](#verification-summary). Listed in
   [`SECURITY.md`](../SECURITY.md#3-dependency-posture).
3. **No load test and no cross-browser matrix** beyond Chromium.
4. **Coverage is not 100%.** The current figures are in the
   [verification summary](#verification-summary). The gaps are in UI branches and in provider
   fallback paths.
5. **The translations are working translations**, not native review.
6. **The numbers are estimates** - see [`LIMITATIONS.md`](LIMITATIONS.md).
