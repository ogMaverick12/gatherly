# Traceability

Every requirement in the supplied briefs, mapped to the code that implements it and the test that
proves it.

The three briefs are kept verbatim in [`brief/`](brief/):

- [`brief/Gatherly.md`](brief/Gatherly.md) - the product brief
- [`brief/Gatherly implementation plan.md`](brief/Gatherly%20implementation%20plan.md) - the locked
  architecture and design decisions
- [`brief/Gatherly delivery outcomes.md`](brief/Gatherly%20delivery%20outcomes.md) - the eleven
  acceptance outcomes

The measured counts for this working tree live in
[`DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md#verification-summary).

---

## 1. Delivery outcomes

| #   | Outcome                                                                                                                                                                        | Implementation                                                                                                                                                                                                       | Evidence                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Global landing with the product, inclusive event types, feature value and one-click sample plans for weddings, birthdays and community events                                  | `src/app/page.tsx`, `src/features/workspace/components/LandingContent.tsx`, `src/features/workspace/components/SamplePlanCards.tsx`, `SAMPLE_PLAN_TEMPLATES` in `src/lib/plan/samples.ts`                            | `tests/components/landing.test.tsx`, `tests/plan.test.ts`                                                                                             |
| 2   | Intake accepts event type, date, guests, city tier, budget, priorities, culture, dietary/access needs, language and optional packs; all inputs schema-validated                | `src/features/intake/schema.ts` (`IntakeFormSchema`), `src/features/intake/components/IntakeForm.tsx`, `IntakeSchema` in `src/lib/plan/schemas.ts`                                                                   | `tests/components/intake.test.tsx`, `tests/plan.test.ts`                                                                                              |
| 3   | Browser-only engines: budget, what-if scenarios, backward milestones, vendor coverage, health score, risks, run-of-show and catering, with no network                          | `src/features/budget/services.ts`, `src/features/timeline/services.ts`, `src/features/vendors/services.ts`, `src/features/health/services.ts`, `src/features/risks/services.ts`, `src/features/catering/services.ts` | `tests/budget.test.ts`, `tests/timeline.test.ts`, `tests/vendors.test.ts`, `tests/health.test.ts`, `tests/risks.test.ts`, `tests/catering.test.ts`    |
| 4   | Workspace with Overview, Budget, Timeline, Vendors, Ideas and Assistant tabs; responsive; visible estimates; no silent AI edits                                                | `src/features/workspace/components/PlanWorkspace.tsx`, `Tabs.tsx`, the six panel components, `src/features/accessibility/components/DisplaySettings.tsx`                                                             | `tests/components/plan-workspace.test.tsx`, `tests/components/panels.test.tsx`, `tests/components/panels-extra.test.tsx`, `tests/e2e/journey.spec.ts` |
| 5   | Tradition/festival packs are explicitly selected and never infer identity, religion, community or region                                                                       | `PACKS` in `src/lib/plan/packs.ts` (explicit ids only), `PACK_DISCLAIMER`, `src/features/intake/components/IntakeForm.tsx` (no pack is pre-selected), `SYSTEM_RULES` in `src/lib/ai/prompts.ts`                      | `tests/plan.test.ts`, `tests/components/intake.test.tsx`, `tests/parse.test.ts`                                                                       |
| 6   | AI routes are stateless, guarded, schema-validated, prompt-injection aware, and visibly fall back to Basic mode                                                                | `src/app/api/chat/route.ts`, `src/app/api/ideas/route.ts`, `src/app/api/parse/route.ts`, `src/lib/security/guards.ts`, `src/lib/security/sanitize.ts`, `src/lib/ai/index.ts` (`selectProvider`)                      | `tests/api/routes.test.ts`, `tests/guards.test.ts`, `tests/sanitize.test.ts`, `tests/security/providers.test.ts`, `tests/security/adapters.test.ts`   |
| 7   | Exports: print-to-PDF, calendar, budget CSV and shareable URL fragments; `/api/*` is never cached by the service worker                                                        | `src/features/workspace/components/ExportBar.tsx`, `src/lib/download.ts`, `src/lib/csv.ts`, `src/lib/ics.ts`, `src/lib/share.ts`, `public/sw.js`                                                                     | `tests/csv.test.ts`, `tests/ics.test.ts`, `tests/share.test.ts`, `tests/components/panels-extra.test.tsx`, `tests/e2e/journey.spec.ts`                |
| 8   | Accessibility: skip link, text sizing, contrast, language selection, speech feature detection, Calm mode, reduced motion, keyboard-friendly targets, translated visible labels | `src/features/accessibility/provider.tsx`, `src/features/accessibility/components/DisplaySettings.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/i18n/`                                                 | `tests/accessibility/contrast.test.ts`, `tests/components/accessibility.test.tsx`, `tests/i18n.test.ts`                                               |
| 9   | Documentation explains architecture, security model, limitations, Judge's tour, setup and traceability to the supplied build plan                                              | `README.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/TRACEABILITY.md`, `docs/JUDGES_TOUR.md`, `docs/LIMITATIONS.md`, `docs/DELIVERY_OUTCOMES.md`, `docs/brief/`                                                 | This document; verified by reading the files against the brief                                                                                        |

---

## 2. Brief area to code

| Brief area                    | Source                                                                                  | Evidence                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Intake and sample plans       | `src/lib/plan/schemas.ts`, `src/features/intake/schema.ts`                              | `tests/plan.test.ts`, `tests/components/intake.test.tsx`                          |
| Budget and scenarios          | `src/features/budget/services.ts`, `src/lib/money.ts`                                   | `tests/budget.test.ts`, `tests/money.test.ts`                                     |
| Timeline and calendar         | `src/features/timeline/services.ts`, `src/lib/ics.ts`, `src/lib/dates.ts`               | `tests/timeline.test.ts`, `tests/ics.test.ts`, `tests/dates.test.ts`              |
| Vendor checklist and WhatsApp | `src/features/vendors/services.ts`                                                      | `tests/vendors.test.ts`, `tests/components/vendors.test.tsx`                      |
| Health score                  | `src/features/health/services.ts`                                                       | `tests/health.test.ts`                                                            |
| Catering                      | `src/features/catering/services.ts`                                                     | `tests/catering.test.ts`                                                          |
| Risks                         | `src/features/risks/services.ts`                                                        | `tests/risks.test.ts`                                                             |
| Ideas and assistant           | `src/features/ideas/services.ts`, `src/features/assistant/services.ts`, `src/app/api/*` | `tests/ideas.test.ts`, `tests/assistant.test.ts`, `tests/api/routes.test.ts`      |
| Offline and accessibility     | `public/sw.js`, `src/features/accessibility/*`                                          | `tests/components/accessibility.test.tsx`, `tests/accessibility/contrast.test.ts` |
| Share links and exports       | `src/lib/share.ts`, `src/lib/csv.ts`, `src/lib/ics.ts`                                  | `tests/share.test.ts`, `tests/csv.test.ts`, `tests/ics.test.ts`                   |

---

## 3. Implementation plan to code

| Plan decision                                                                               | Where it lives                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Next.js App Router, strict TypeScript                                                       | `tsconfig.json` (`strict: true`), `src/app/`                                                                  |
| Server components for shells, client components for the workspace                           | `src/app/layout.tsx`, `src/app/page.tsx` are server components; `src/features/workspace/**` is `'use client'` |
| Zod schemas for intake, plans and AI output                                                 | `src/features/intake/schema.ts`, `src/lib/plan`, `src/lib/api-schema.ts`                                      |
| Pure feature services for budget, timeline, health, vendors, catering and exports           | `src/features/*/services.ts`, `src/lib/csv.ts`, `src/lib/ics.ts`                                              |
| API routes are stateless and return deterministic Basic mode when no provider is configured | `src/app/api/*/route.ts`, `src/lib/ai/index.ts`, `src/lib/ai/basic.ts`                                        |
| LocalStorage persists the versioned plan                                                    | `src/lib/plan-store.ts` (`gatherly:plan:v1`)                                                                  |
| A compact JSON fragment provides sharing without server state                               | `src/lib/share.ts`                                                                                            |
| `public/sw.js` caches the shell and never caches `/api/*`                                   | `public/sw.js`                                                                                                |
| Provider adapters isolated so Gemini/OpenRouter can be enabled by environment configuration | `src/lib/ai/provider.ts` (the interface), `gemini.ts`, `openrouter.ts`                                        |
| Palette: paper, ink, marigold, peacock teal, rose                                           | `src/app/globals.css`, `tailwind.config.ts`                                                                   |
| Signature elements: garland line, health ring, celebration dot                              | `GarlandLine.tsx`, `HealthRing.tsx` (`CelebrationDot`), `HealthRail.tsx`                                      |
| Motion is transform/opacity only and is disabled under reduced motion or Calm mode          | `src/app/globals.css` (`prefers-reduced-motion` and the calm-mode attribute rules)                            |
| Multilingual: English, Hindi, Bengali                                                       | `src/lib/i18n/en.ts`, `hi.ts`, `bn.ts`                                                                        |

---

## 4. Test inventory

The number of tests in each file, and the totals, live in
[`DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md#4-measured-numbers). This table maps each test file
to what it proves.

| File                                       | What it proves                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/budget.test.ts`                     | Allocation sums exactly to the budget; priorities and packs move the split; scenarios re-price per guest; warnings explain themselves          |
| `tests/timeline.test.ts`                   | Milestones are computed backwards from the event date; a step that can no longer be done on time moves to today; completion state is kept      |
| `tests/vendors.test.ts`                    | Status transitions, quote scoring, coverage percentage, WhatsApp encoding                                                                      |
| `tests/health.test.ts`                     | Five weighted parts that sum to 100; the score is 0-100; every part says what was measured                                                     |
| `tests/risks.test.ts`                      | The risk register and its triggers                                                                                                             |
| `tests/catering.test.ts`                   | Quantity estimates for food and drink                                                                                                          |
| `tests/money.test.ts`                      | Integer minor units, allocation by weight, per-currency formatting                                                                             |
| `tests/dates.test.ts`                      | ISO date-only parsing, arithmetic, invalid dates rejected                                                                                      |
| `tests/plan.test.ts`                       | The plan schema, `createPlan`, the sample templates, the packs                                                                                 |
| `tests/plan-store.test.ts`                 | Storage, hydration, reload, corruption discarded                                                                                               |
| `tests/share.test.ts`                      | Compressed and plain round-trips, invalid payloads, chat and ideas dropped                                                                     |
| `tests/csv.test.ts`                        | Quoting, escaping and formula-injection defence                                                                                                |
| `tests/ics.test.ts`                        | A valid calendar file with the right dates, folded inside the 75-octet limit                                                                   |
| `tests/ideas.test.ts`                      | Deterministic Basic-mode ideas, one set per event type                                                                                         |
| `tests/assistant.test.ts`                  | Intent classification and the Basic-mode answer                                                                                                |
| `tests/ai.test.ts`                         | The provider interface, Basic mode, provider selection                                                                                         |
| `tests/parse.test.ts`                      | Free text to intake fields; nothing is inferred                                                                                                |
| `tests/i18n.test.ts`                       | The three dictionaries have the same keys                                                                                                      |
| `tests/guards.test.ts`                     | Method, body cap, malformed JSON, schema failure, rate limit, headers                                                                          |
| `tests/sanitize.test.ts`                   | Control characters, zero-width characters, delimiters, CSV injection                                                                           |
| `tests/property.test.ts`                   | The invariants a fixed example cannot: the allocator never loses a minor unit, the budget never overspends, a share link survives a round trip |
| `tests/api/routes.test.ts`                 | The three routes end to end: validation, Basic fallback, SSE events                                                                            |
| `tests/security/providers.test.ts`         | Selection, retry-once, timeout, safe logging, rate limiting                                                                                    |
| `tests/security/adapters.test.ts`          | The Gemini and OpenRouter adapters                                                                                                             |
| `tests/accessibility/contrast.test.ts`     | WCAG contrast for the light, dark and calm palettes                                                                                            |
| `tests/accessibility/axe.test.tsx`         | An automated accessibility check of the landing page, every intake step, all six workspace tabs and the display settings                       |
| `tests/components/landing.test.tsx`        | The landing page states what the app is for                                                                                                    |
| `tests/components/intake.test.tsx`         | The four steps, validation, the review, no pack is pre-selected                                                                                |
| `tests/components/plan-workspace.test.tsx` | The workspace shell and the tabs                                                                                                               |
| `tests/components/panels.test.tsx`         | The Overview, Budget, Timeline and Ideas panels                                                                                                |
| `tests/components/panels-extra.test.tsx`   | The Vendors and Assistant panels, and the exports                                                                                              |
| `tests/components/vendors.test.tsx`        | Adding a vendor, saving a quote, changing a status                                                                                             |
| `tests/components/accessibility.test.tsx`  | Display settings, language, Calm mode, reduced motion                                                                                          |
| `tests/components/basics.test.tsx`         | Shared component behaviour across the workspace                                                                                                |
| `tests/components/plan-restore.test.tsx`   | A stored plan is restored on reload with no user action                                                                                        |

The end-to-end journeys live in `tests/e2e/` and are listed in
[`DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md#4-measured-numbers).

---

## 5. Deviations from the supplied plan

Recorded honestly rather than quietly:

1. **`src/lib/motion` was not created.** The implementation plan names it as the home for the
   spring-like transitions. The motion was built as CSS instead - transform/opacity only, with
   `prefers-reduced-motion` and the `[data-calm='true']` attribute rules in `src/app/globals.css`
   switching it off. The behaviour in the plan is delivered; only the file layout differs, and a
   JavaScript animation module would have been the weaker choice for a reduced-motion guarantee
   because it can be defeated by a missed media query.
2. **The verification numbers in `brief/Gatherly.md` are from an earlier checkpoint.** That
   document records "309 tests ... 95.27% statement coverage, 64.28% branch coverage, 95.55%
   function coverage, and 100% line coverage". The measured state of this working tree is in
   [`DELIVERY_OUTCOMES.md`](DELIVERY_OUTCOMES.md#verification-summary). The suite grew, the branch
   coverage improved, and the statement and line figures moved down slightly because the newly
   added UI and route code is not fully exercised by unit tests. The thresholds in
   `vitest.config.mts` (90 / 70 / 90 / 90) are met.
3. **`npm audit --omit=dev --audit-level=high` now reports nothing at all.** The brief predicted
   a clean production audit; the current state is `0 vulnerabilities` for production dependencies,
   after the PostCSS override described in [`../SECURITY.md`](../SECURITY.md#3-dependency-posture)
   removed the last two.

---

## 6. Manual verification

| Check                       | How                                                    | Result                                                             |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Landing to a working plan   | `npm run dev`, open `/`, click a sample plan           | Pass                                                               |
| Persistence across a reload | Complete a milestone, reload `/plan`                   | Pass - the milestone is still ticked                               |
| Keyboard-only navigation    | Tab to the tab strip, use the arrow keys               | Pass - the tabs move focus                                         |
| Offline                     | Load the plan, switch the network off, reload          | Pass - the plan renders, the engines still calculate               |
| Exports                     | CSV download, calendar file, print preview, share link | Pass                                                               |
| Contrast                    | `tests/accessibility/contrast.test.ts`                 | Pass - 19 contrast checks across the light, dark and calm palettes |
| Production build            | `npm run build`                                        | Pass                                                               |
| Dependency audit            | `npm audit --omit=dev`                                 | Pass - 0 vulnerabilities                                           |

The end-to-end journey is automated in `tests/e2e/journey.spec.ts` and runs with `npm run e2e`.
