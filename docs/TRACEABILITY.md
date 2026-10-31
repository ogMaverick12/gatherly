# Traceability

Each delivered requirement, mapped to the code that implements it and the test that proves it.

Run `npm run stats` for the code-shape counts, `npm run test:coverage` for the unit and component
test counts and coverage, and `npx playwright test --list` for the Playwright inventory. The
commands print the current values; this document does not copy them.

---

## 1. Delivery outcomes

| #   | Outcome                                                                                                                                                                        | Implementation                                                                                                                                                                                                               | Evidence                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Global landing with the product, inclusive event types, feature value and one-click sample plans for weddings, birthdays and community events                                  | `src/app/page.tsx`, `src/features/workspace/components/LandingContent.tsx`, `src/features/workspace/components/SamplePlanCards.tsx`, `SAMPLE_PLAN_TEMPLATES` in `src/lib/plan/samples.ts`                                    | `tests/features/workspace/landing-page.test.tsx`, `tests/lib/plan/plan.test.ts`                                                                                                                                                                        |
| 2   | Intake accepts event type, date, guests, city tier, budget, priorities, culture, dietary/access needs, language and optional packs; all inputs schema-validated                | `src/features/intake/schema.ts` (`IntakeFormSchema`), `src/features/intake/components/IntakeForm.tsx`, `IntakeSchema` in `src/lib/plan/schemas.ts`                                                                           | `tests/features/intake/intake-form.test.tsx`, `tests/lib/plan/plan.test.ts`                                                                                                                                                                            |
| 3   | Browser-only engines: budget, what-if scenarios, backward milestones, vendor coverage, health score, risks, run-of-show and catering, with no network                          | `src/features/budget/index.ts`, `src/features/timeline/index.ts`, `src/features/vendors/index.ts`, `src/features/health/index.ts`, `src/features/risks/index.ts`, `src/features/catering/index.ts`                           | `tests/features/budget/budget.test.ts`, `tests/features/timeline/timeline.test.ts`, `tests/features/vendors/vendors.test.ts`, `tests/features/health/health.test.ts`, `tests/features/risks/risks.test.ts`, `tests/features/catering/catering.test.ts` |
| 4   | Workspace with Overview, Budget, Timeline, Vendors, Ideas and Assistant tabs; responsive; visible estimates; no silent AI edits                                                | `src/features/workspace/components/PlanWorkspace.tsx`, `Tabs.tsx`, the six panel components, `src/features/accessibility/components/DisplaySettings.tsx`                                                                     | `tests/features/workspace/plan-workspace.test.tsx`, `tests/features/workspace/workspace-panels.test.tsx`, `tests/features/workspace/ideas-assistant-export.test.tsx`, `tests/e2e/journey.spec.ts`                                                      |
| 5   | Tradition/festival packs are explicitly selected and never infer identity, religion, community or region                                                                       | `PACKS` in `src/lib/plan/packs.ts` (explicit ids only), `PACK_DISCLAIMER`, `src/features/intake/components/IntakeForm.tsx` (no pack is pre-selected), `SYSTEM_RULES` in `src/lib/ai/prompts.ts`                              | `tests/lib/plan/plan.test.ts`, `tests/features/intake/intake-form.test.tsx`, `tests/features/assistant/parse.test.ts`                                                                                                                                  |
| 6   | AI routes are stateless, guarded, schema-validated, prompt-injection aware, and visibly fall back to Basic mode                                                                | `src/app/api/chat/route.ts`, `src/app/api/ideas/route.ts`, `src/app/api/parse/route.ts`, `src/lib/security/route.ts`, `src/lib/security/guards.ts`, `src/lib/security/sanitize.ts`, `src/lib/ai/index.ts` (`selectProvider`) | `tests/app/api/routes.test.ts`, `tests/lib/security/guards.test.ts`, `tests/lib/security/sanitize.test.ts`, `tests/lib/security/provider-retry-and-guards.test.ts`, `tests/lib/ai/adapters.test.ts`                                                    |
| 7   | Exports: print-to-PDF, calendar, budget CSV and shareable URL fragments; `/api/*` is never cached by the service worker                                                        | `src/features/workspace/components/ExportBar.tsx`, `src/lib/download.ts`, `src/features/workspace/csv.ts`, `src/lib/ics.ts`, `src/lib/share.ts`, `public/sw.js`                                                              | `tests/features/workspace/csv.test.ts`, `tests/lib/ics.test.ts`, `tests/lib/share.test.ts`, `tests/features/workspace/ideas-assistant-export.test.tsx`, `tests/e2e/journey.spec.ts`                                                                    |
| 8   | Accessibility: skip link, text sizing, contrast, language selection, speech feature detection, Calm mode, reduced motion, keyboard-friendly targets, translated visible labels | `src/features/accessibility/AccessibilityProvider.tsx`, `src/features/accessibility/components/DisplaySettings.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/i18n/`                                            | `tests/features/accessibility/contrast.test.ts`, `tests/features/accessibility/display-settings.test.tsx`, `tests/lib/i18n/i18n.test.ts`                                                                                                               |
| 9   | Documentation explains the architecture, security model, limitations, product tour, setup and traceability from requirements to code and tests                                 | `README.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/TRACEABILITY.md`, `docs/TOUR.md`, `docs/LIMITATIONS.md`, `docs/DELIVERY_OUTCOMES.md`, `docs/LIVE_VERIFICATION.md`                                                  | This document; verified by reading the files against the implemented routes and tests                                                                                                                                                                  |

---

## 2. Requirement area to code

| Requirement area              | Source                                                                            | Evidence                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Intake and sample plans       | `src/lib/plan/schemas.ts`, `src/features/intake/schema.ts`                        | `tests/lib/plan/plan.test.ts`, `tests/features/intake/intake-form.test.tsx`                                        |
| Budget and scenarios          | `src/features/budget/index.ts`, `src/lib/money.ts`                                | `tests/features/budget/budget.test.ts`, `tests/lib/money.test.ts`                                                  |
| Timeline and calendar         | `src/features/timeline/index.ts`, `src/lib/ics.ts`, `src/lib/dates.ts`            | `tests/features/timeline/timeline.test.ts`, `tests/lib/ics.test.ts`, `tests/lib/dates.test.ts`                     |
| Vendor checklist and WhatsApp | `src/features/vendors/index.ts`                                                   | `tests/features/vendors/vendors.test.ts`, `tests/features/vendors/vendors-panel.test.tsx`                          |
| Health score                  | `src/features/health/index.ts`                                                    | `tests/features/health/health.test.ts`                                                                             |
| Catering                      | `src/features/catering/index.ts`                                                  | `tests/features/catering/catering.test.ts`                                                                         |
| Risks                         | `src/features/risks/index.ts`                                                     | `tests/features/risks/risks.test.ts`                                                                               |
| Ideas and assistant           | `src/features/ideas/index.ts`, `src/features/assistant/index.ts`, `src/app/api/*` | `tests/features/ideas/ideas.test.ts`, `tests/features/assistant/assistant.test.ts`, `tests/app/api/routes.test.ts` |
| Offline and accessibility     | `public/sw.js`, `src/features/accessibility/*`                                    | `tests/features/accessibility/display-settings.test.tsx`, `tests/features/accessibility/contrast.test.ts`          |
| Share links and exports       | `src/lib/share.ts`, `src/features/workspace/csv.ts`, `src/lib/ics.ts`             | `tests/lib/share.test.ts`, `tests/features/workspace/csv.test.ts`, `tests/lib/ics.test.ts`                         |

---

## 3. Design decisions to code

| Decision                                                                                    | Where it lives                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Next.js App Router, strict TypeScript                                                       | `tsconfig.json` (`strict: true`), `src/app/`                                                                  |
| Server components for shells, client components for the workspace                           | `src/app/layout.tsx`, `src/app/page.tsx` are server components; `src/features/workspace/**` is `'use client'` |
| Zod schemas for intake, plans and AI output                                                 | `src/features/intake/schema.ts`, `src/lib/plan`, `src/lib/api-schema.ts`                                      |
| Pure feature services for budget, timeline, health, vendors, catering and exports           | `src/features/*/index.ts`, `src/features/workspace/csv.ts`, `src/lib/ics.ts`                                  |
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

Run `npm run test:coverage` for current test counts and coverage. `npx playwright test --list` lists
the Playwright inventory without running it. This table maps each test file to what it proves.

| File                                                       | What it proves                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/features/budget/budget.test.ts`                     | Allocation sums exactly to the budget; priorities and packs move the split; scenarios re-price per guest; warnings explain themselves          |
| `tests/features/timeline/timeline.test.ts`                 | Milestones are computed backwards from the event date; a step that can no longer be done on time moves to today; completion state is kept      |
| `tests/features/vendors/vendors.test.ts`                   | Status transitions, quote scoring, coverage percentage, WhatsApp encoding                                                                      |
| `tests/features/health/health.test.ts`                     | Five weighted parts that sum to 100; the score is 0-100; every part says what was measured                                                     |
| `tests/features/risks/risks.test.ts`                       | The risk register and its triggers                                                                                                             |
| `tests/features/catering/catering.test.ts`                 | Quantity estimates for food and drink                                                                                                          |
| `tests/lib/money.test.ts`                                  | Integer minor units, allocation by weight, per-currency formatting                                                                             |
| `tests/lib/dates.test.ts`                                  | ISO date-only parsing, arithmetic, invalid dates rejected                                                                                      |
| `tests/lib/plan/plan.test.ts`                              | The plan schema, `createPlan`, the sample templates, the packs                                                                                 |
| `tests/lib/plan-store.test.ts`                             | Storage, hydration, reload, corruption discarded                                                                                               |
| `tests/lib/share.test.ts`                                  | Compressed and plain round-trips, invalid payloads, chat and ideas dropped                                                                     |
| `tests/features/workspace/csv.test.ts`                     | Quoting, escaping and formula-injection defence                                                                                                |
| `tests/lib/ics.test.ts`                                    | A valid calendar file with the right dates, folded inside the 75-octet limit                                                                   |
| `tests/features/ideas/ideas.test.ts`                       | Deterministic Basic-mode ideas, one set per event type                                                                                         |
| `tests/features/assistant/assistant.test.ts`               | Intent classification and the Basic-mode answer                                                                                                |
| `tests/lib/ai/ai.test.ts`                                  | The provider interface, Basic mode, provider selection                                                                                         |
| `tests/features/assistant/parse.test.ts`                   | Free text to intake fields; nothing is inferred                                                                                                |
| `tests/lib/i18n/i18n.test.ts`                              | The three dictionaries have the same keys                                                                                                      |
| `tests/lib/security/guards.test.ts`                        | Method, body cap, malformed JSON, schema failure, rate limit, headers                                                                          |
| `tests/lib/security/sanitize.test.ts`                      | Control characters, zero-width characters, delimiters, CSV injection                                                                           |
| `tests/lib/property.test.ts`                               | The invariants a fixed example cannot: the allocator never loses a minor unit, the budget never overspends, a share link survives a round trip |
| `tests/app/api/routes.test.ts`                             | The three routes end to end: validation, Basic fallback, SSE events                                                                            |
| `tests/lib/security/provider-retry-and-guards.test.ts`     | Selection, retry-once, timeout, safe logging, rate limiting                                                                                    |
| `tests/lib/ai/adapters.test.ts`                            | The Gemini and OpenRouter adapters                                                                                                             |
| `tests/features/accessibility/contrast.test.ts`            | WCAG contrast for the light, dark and calm palettes                                                                                            |
| `tests/features/accessibility/axe.test.tsx`                | An automated accessibility check of the landing page, every intake step, all six workspace tabs and the display settings                       |
| `tests/features/workspace/landing-page.test.tsx`           | The landing page states what the app is for                                                                                                    |
| `tests/features/intake/intake-form.test.tsx`               | The four steps, validation, the review, no pack is pre-selected                                                                                |
| `tests/features/workspace/plan-workspace.test.tsx`         | The workspace shell and the tabs                                                                                                               |
| `tests/features/workspace/workspace-panels.test.tsx`       | The Overview, Budget, Timeline, Vendors, Ideas and Assistant panels, the health rail and the export bar                                        |
| `tests/features/workspace/ideas-assistant-export.test.tsx` | The Ideas and Assistant panels, the export bar and the shared-plan prompt                                                                      |
| `tests/features/vendors/vendors-panel.test.tsx`            | Adding a vendor, saving a quote, changing a status                                                                                             |
| `tests/features/accessibility/display-settings.test.tsx`   | Display settings, language, Calm mode, reduced motion                                                                                          |
| `tests/features/workspace/shared-chrome.test.tsx`          | The site chrome, shared marks, tabs, display settings and intake heading                                                                       |
| `tests/features/workspace/plan-restore.test.tsx`           | A stored plan is restored on reload with no user action                                                                                        |

The end-to-end journeys live in `tests/e2e/`; run `npx playwright test --list` to enumerate them.

---

## 5. Implementation notes

- **Motion is CSS.** There is no separate Motion module. Motion uses transform and opacity only,
  with `prefers-reduced-motion` and `[data-calm='true']` rules in `src/app/globals.css`. CSS keeps
  the reduced-motion guarantee in one place.
- **Dependency audit.** Run `npm audit --omit=dev` for the current result. It is not copied here
  because the value changes with the dependency tree.

---

## 6. Manual verification

| Check                       | How                                                    | Result                                                           |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Landing to a working plan   | `npm run dev`, open `/`, click a sample plan           | Pass                                                             |
| Persistence across a reload | Complete a milestone, reload `/plan`                   | Pass - the milestone is still ticked                             |
| Keyboard-only navigation    | Tab to the tab strip, use the arrow keys               | Pass - the tabs move focus                                       |
| Offline                     | Load the plan, switch the network off, reload          | Pass - the plan renders, the engines still calculate             |
| Exports                     | CSV download, calendar file, print preview, share link | Pass                                                             |
| Contrast                    | `tests/features/accessibility/contrast.test.ts`        | Pass - automated checks across the light, dark and calm palettes |
| Production build            | `npm run build`                                        | Pass                                                             |
| Dependency audit            | `npm audit --omit=dev`                                 | Run the command for the current result                           |

The end-to-end journey is automated in `tests/e2e/journey.spec.ts` and runs with
`npm run test:e2e`.
