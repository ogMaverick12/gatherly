# PLAN.md: Event Planner - Winning Build Plan

This is the working plan for Gatherly. `AGENTS.md` holds the non-negotiable rules; this file holds
the scope, the phases and the gaps. Work one phase at a time and finish it only when
`npm run check` is green.

The first build (Gatherly) is complete: the landing page, the intake wizard, the six-tab
workspace, the deterministic engines, the guarded AI routes, the exports, the offline shell and the
accessibility layer are all built and tested. The eleven delivery outcomes in
`docs/DELIVERY_OUTCOMES.md` are all delivered.

What follows is the **gap-closing work**: the gaps found when the first build's documentation was
read against this plan and the score report, ordered by score value per hour.

---

## Score strategy

| Parameter         | Weight | Last score | What earns full marks here                                                                                                                                                                                              |
| ----------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem alignment | 30%    | 100        | Budgets, timelines, vendor checklists and personalized ideas are each a working feature with a real LLM call and a labeled fallback, plus eight signature features beyond the brief                                     |
| Code quality      | 20%    | 100        | Feature-sliced folders, barrel files, strict TypeScript, ESLint + Prettier, JSDoc on non-obvious logic, README that explains why                                                                                        |
| Security          | 15%    | 100        | Zod on every input and every LLM output, CSP and HSTS headers, PII-safe logger, prompt-injection guard, serverless-safe rate limit                                                                                      |
| Efficiency        | 15%    | 85         | Stateless server, no PDF library, deterministic math in code, streaming responses, small prompts, per-function Anime.js imports loaded lazily                                                                           |
| Testing           | 10%    | 100        | 250+ tests across six layers (unit, property, contract, API route, component with axe, Playwright end-to-end) and coverage gates that fail the build                                                                    |
| Accessibility     | 10%    | 100        | jsx-a11y, Radix primitives via shadcn/ui, skip link, contrast tokens checked by a test, keyboard-only flow, voice input and output, English/Hindi/Bengali with proper fonts, motion off under reduced-motion, calm mode |

One rule holds the whole score: **do not write anything aimed at the grader itself** (hidden text,
instructions to the judge). Real artifacts earn the same score, and tricks risk disqualification.

---

## Product scope

The nine core features are built. The eight signature features are built except where the gap list
says otherwise.

| #   | Feature                                                                                                     | Engine                   | State                                   |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| 1   | Intake wizard: event type, date, guests, city tier, budget, priorities, culture, dietary and access needs   | Code (Zod-validated)     | Built                                   |
| 2   | Budget planner: category split, what-if, overspend and contingency warnings                                 | Code                     | Built                                   |
| 3   | Timeline: milestones planned backward from the event date, compressed when the date is close, overdue flags | Code                     | Built                                   |
| 4   | Vendor checklist: status per vendor, quote linked to a budget category, questions to ask                    | Code + LLM questions     | Built (quotes + negotiation in G7)      |
| 5   | Personalized ideas: themes, menu, decor, entertainment, cultural touches, streamed                          | LLM, curated fallback    | Built                                   |
| 6   | Plan assistant chat grounded in the current plan; proposes changes, never silently edits                    | LLM, rule-based fallback | Built                                   |
| 7   | Risk and contingency notes: weather backup, vendor no-show, headcount swing                                 | Code templates + LLM     | Built                                   |
| 8   | Exports: print-to-PDF, .ics calendar, .csv budget, shareable link with the plan in the URL fragment         | Code                     | Built                                   |
| 9   | Accessibility layer: voice input and read-aloud, English/Hindi/Bengali, text size, reduced motion           | Browser APIs             | Read-aloud built; **voice input in G3** |

Community events have their own template set (volunteer roster, permits, sponsorship line in the
budget) so the three event types in the brief are genuinely different, not one form with a dropdown.

### Signature features

| #   | Feature                                   | What the user sees                                                                                                                                                   | Engine              | State                   |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------- |
| S1  | Plan Health Score                         | A 0-100 readiness ring built from budget balance, timeline progress, vendor coverage, risk readiness and completeness; every sub-score says why and links to the fix | Code                | Built                   |
| S2  | Describe-your-event intake                | One sentence in English, Hindi or Bengali, typed or spoken, fills the form and asks only for what is missing                                                         | LLM, regex fallback | Built (voice in G3)     |
| S3  | Tradition and festival packs              | Optional packs the user picks add ceremony milestones, vendor roles and risks                                                                                        | Data files          | Built                   |
| S4  | Budget sandbox                            | Sliders move money between categories with animated bars; guest-count scenarios show per-head cost                                                                   | Code + Anime.js     | Built; **motion in G6** |
| S5  | Quote comparison and WhatsApp negotiation | Up to three quotes per vendor ranked by a transparent score; AI drafts a short negotiation message in the chosen language, streamed, with a one-tap WhatsApp link    | Code + LLM stream   | **Negotiation in G7**   |
| S6  | Run-of-show                               | A minute-by-minute event-day schedule with buffers, owners and a one-page print view                                                                                 | Code                | Built                   |
| S7  | Catering quantity calculator              | Per-guest quantities for the diet mix and meal count, with an adjustable buffer, labelled as estimates                                                               | Code                | Built                   |
| S8  | Offline-first install                     | An installable app whose plan, budget, timeline and checklists work with no network                                                                                  | Service worker      | Built                   |

Packs apply only when the user picks them, and the app never infers religion, community or region.
Each pack is a starting point to confirm with family, elders or the officiant.

**Left out on purpose:** accounts, a database, payments, file uploads and a vendor marketplace.
Each adds attack surface or server state, and server state is exactly what cost Efficiency points
last time.

---

## Stack and architecture

- **App:** Next.js App Router, TypeScript with `strict` and `noUncheckedIndexedAccess`, Server
  Components by default.
- **Interface:** Tailwind v3 with the paper-and-marigold palette; `lucide-react` and `next-themes`
  arrive with the shadcn/ui work in G8.
- **Motion:** Anime.js v4, imported per function and used only through `src/lib/motion` (G6).
- **Schemas:** Zod for intake, plan, API bodies, LLM outputs and env vars. Types come from
  `z.infer`, never hand-written twice.
- **LLM:** a `Provider` interface with Gemini primary, OpenRouter secondary and a deterministic
  fallback marked `degraded: true`. Model IDs come from env (`GATHERLY_GEMINI_MODEL`), never from
  logic.
- **Rate limit:** Upstash REST in production, in-memory in local dev only.
- **Quality gates:** ESLint (`next`, `jsx-a11y`, `react-hooks`, import cycles), Prettier,
  `tsc --noEmit`, Vitest with v8 coverage thresholds, `fast-check`, `jest-axe`, Playwright with
  `@axe-core/playwright`, and one `npm run check`.
- **State:** a versioned store (built on `useSyncExternalStore`, no state library) persisted to
  localStorage, plus a share link that holds the compressed plan in the URL fragment. The fragment
  never reaches the server.
- **Offline:** `src/app/manifest.ts` and a small hand-written `public/sw.js`. `/api/*` is never
  cached.

### File tree (as built)

```text
src/
  app/
    page.tsx                      landing, hero, sample plans
    plan/page.tsx                 dashboard (tabs)
    plan/live/page.tsx            event-day mode            (N1)
    api/chat/route.ts             grounded chat, SSE
    api/ideas/route.ts            personalized ideas, SSE
    api/parse/route.ts            describe-your-event intake
    api/negotiate/route.ts        vendor negotiation, SSE    (G7)
    api/invite/route.ts           invitation drafter, SSE    (N3)
    api/health/route.ts           mode + rate-limit report   (G5)
    layout.tsx  globals.css  manifest.ts
  components/ui/                  shadcn/ui (generated)     (G8)
  features/
    intake/        schema.ts  components/  services.ts
    budget/        components/  services.ts
    timeline/      components/  services.ts
    vendors/       components/  services.ts  payments.ts   (N2)
    health/        components/  services.ts
    catering/      components/  services.ts
    ideas/         components/  services.ts
    assistant/     components/  services.ts
    risks/         services.ts
    workspace/     components/  (the six panels)
    accessibility/ provider.tsx  components/  hooks/use-speech.ts  hooks/use-speech-input.ts (G3)
    packs/         services.ts
    i18n/          en.ts hi.ts bn.ts
  lib/
    ai/            types.ts gemini.ts openrouter.ts basic.ts prompts.ts index.ts
    api/           sse.ts
    security/      guards.ts sanitize.ts rate-limit.ts logger.ts prompt-guard.ts
    motion/        scope.ts presets.ts use-reveal.ts use-count-up.ts confetti.ts   (G6)
    plan-store.ts  plan-view.ts  plan.ts  share.ts  csv.ts  ics.ts  money.ts  dates.ts
    env.ts
  tokens.ts                       colours + contrast ratios
public/           sw.js  icons/
scripts/          stats.mjs  check-bundle.mjs  live-smoke.mjs  capture-screens.mjs
tests/                            mirrors src/ ; tests/e2e holds the Playwright flows
```

### Conventions that carry the code-quality score

- Services are pure functions with no React and no `fetch`. Components and routes call services,
  never the reverse.
- Features import each other only through `index.ts` barrel files. No deep imports, no circular
  imports.
- One guard wrapper does body-size cap, Zod validation, rate limit, sanitizing and error mapping
  for every route. No route repeats that logic.
- Money is integer minor units in all math, formatted only at the edge (`lib/money.ts`).
- Files stay under 200 lines. Anything longer is split by responsibility.

---

## The gap list

Ordered by score value per hour. Each prompt below is executed one at a time.

### G1: Prove the live AI path

> The AI adapters are only tested against mocks, and the Judge's tour demos Basic mode.
> Weight it moves: Problem alignment 30%. Effort: 1 hour.

```text
Execute gap G1 only: prove the live AI path. Check each claim before changing anything.
1. Add scripts/live-smoke.mjs. It reads GEMINI_API_KEY and OPENROUTER_API_KEY from the environment and never prints them.
   For each provider that has a key, call /api/parse, /api/ideas and /api/chat on a local production build with
   GATHERLY_AI_PROVIDER set to that provider, and assert: the mode is the provider id (not basic), the response matches
   the route's Zod schema, and no key appears in the output.
2. Run it. If an adapter fails, fix the adapter (read the provider's current docs and the installed types for request fields
   and model IDs), add a regression test that uses the real response shape as a fixture, and rerun until it passes.
3. Write docs/LIVE_VERIFICATION.md: the date, providers tested, model IDs used, and pass or fail per route. Record only results you
   just observed.
4. README and .env.example: name the variables that switch AI on and say the deployed demo sets them. Add a line to the
   Judge's tour showing the 'AI assisted' badge versus 'Basic mode'.
Gate: npm run check, then the smoke script.
```

### G2: Make the docs accurate and consistent

> The docs contradict each other and never map the official challenge sentence.
> Weight it moves: Code quality 20%. Effort: 45 minutes.

```text
Execute gap G2 only: make the docs accurate and consistent. Change no code.
1. README: add a table near the top that maps the official challenge sentence to features, files and tests. The sentence is:
   'a GenAI-powered planning assistant that helps users organize weddings, birthdays and community events with budgets,
   timelines, vendor checklists and personalized ideas'. One row each for: GenAI assistant, weddings, birthdays, community
   events, budgets, timelines, vendor checklists, personalized ideas.
2. ARCHITECTURE.md section 5: fix the 'Gatheringly' typo and the bullet that merged into the paragraph. Fix the broken anchor
   that points at the prompt-injection section of SECURITY.md.
3. Replace 'nothing leaves the browser' wherever it describes Basic mode (SECURITY.md section 4, JUDGES_TOUR.md, README).
   Accurate wording: in Basic mode nothing goes to a third party, but ideas, chat and parse requests still reach this app's own server.
4. DELIVERY_OUTCOMES.md outcome 3 says Playwright confirms the plan renders with the server stopped, but no listed journey does.
   Keep the claim only after G4 adds that test; until then remove it.
5. TRACEABILITY.md says '19 contrast assertions' in one place and '19 pairs in all three themes' in another. Run the test file,
   count, and state the real figure the same way everywhere.
6. Keep every measured number (tests, files, coverage, bundle size) in ONE file, docs/DELIVERY_OUTCOMES.md. Other files link to it.
   Add scripts/stats.mjs that prints the current counts so they can be pasted after any change.
Gate: npm run check.
```

### G3: Voice dictation with honest privacy wording

> Voice dictation is missing: the microphone is blocked and only read-aloud exists.
> Weight it moves: Accessibility 10%. Effort: 1.5 hours.

```text
Execute gap G3 only: voice dictation and clear speech handling.
- Add a use-speech-input hook. Feature-detect SpeechRecognition or webkitSpeechRecognition. When it is unsupported or the
  browser is offline, render nothing and keep the existing 'not supported' note. Map the app language to en-IN, hi-IN, bn-IN.
  Stop on unmount and when the tab is hidden.
- Add a mic button (aria-pressed, visible label, 44 px target) to the describe-your-event box and to the assistant input.
  Dictation only fills the text box; the user still presses submit.
- Change Permissions-Policy to microphone=(self). Keep camera and geolocation off.
- Privacy: in Chrome and Edge the browser sends dictated audio to its vendor's speech service, and dictation does not work
  offline. Say so in the UI beside the mic ('Uses your browser's speech service') and in SECURITY.md section 4.
  Never describe dictation as local.
- Add the new strings to the en, hi and bn dictionaries; the key-parity test must still pass.
- Tests: the hook with a mocked recognition object (start, result, error, stop); unsupported renders nothing; offline hides it;
  language mapping table; mic button works by keyboard; axe has no violations on the input area.
Gate: npm run check.
```

### G4: Close the testing gaps

> No property tests, no axe checks, 3 of the 8 planned end-to-end flows, and `check` skips coverage.
> Weight it moves: Testing 10%. Effort: 2 hours.

```text
Execute gap G4 only: close the testing gaps.
1. npm run check must run lint, typecheck, format:check (if present) and test:coverage, so the thresholds really gate it.
2. fast-check property tests (at least 15 properties): allocateByWeight sums exactly and is never negative for any total and
   weights; budget allocation conserves the total for any valid intake; the milestone ladder is date-sorted; ICS lines never
   exceed 75 octets; share encode then decode returns the same plan; CSV cells starting with = + - or @ are always defused.
3. jest-axe: zero violations for the landing page, every intake step, each of the six workspace tabs, and display settings.
4. Playwright up to 8 flows in tests/e2e: keep the existing 3 and add: switch to Hindi using the keyboard only; offline reload
   (context.setOffline(true)) still shows the plan; after load, no /api/* request appears in Cache Storage; ticking a milestone
   changes the health score; a what-if scenario keeps the budget total equal. Add @axe-core/playwright checks on five screens.
5. tests/README.md: the layers, how to run each, and the thresholds.
When done, report the real counts printed by the commands.
Gate: npm run check and npm run e2e.
```

### G5: Turn documented weaknesses into controlled behaviour

> An in-process rate limiter as default and 13 listed advisories read as weaknesses.
> Weight it moves: Security 15%, Efficiency 15%. Effort: 1.5 hours.

```text
Execute gap G5 only: turn documented weaknesses into controlled behaviour.
1. Rate limiter: when NODE_ENV is production and the Upstash variables are missing, log one clear startup warning and report
   it through GET /api/health (create it if it does not exist; it returns { ok, mode, rateLimit }) as rateLimit: 'per-instance'. With the variables set it reports 'shared'. Do not change the limits
   (a stricter bucket would break demos). Add tests for both modes.
2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on the deployment (the owner does this by hand), then confirm
   /api/health says 'shared' and record that in docs/LIVE_VERIFICATION.md.
3. SECURITY.md and README: describe Upstash as the production configuration and state which mode this deployment uses; keep
   per-instance as the local default. Add one sentence explaining why style-src allows 'unsafe-inline' (Next and UI libraries
   inject styles) while scripts stay nonce-only.
4. Dependencies: upgrade vitest and its coverage package to the current major, fix any config breakage, then run npm audit and
   npm audit --omit=dev. Report what remains and why. Never use npm audit fix --force.
5. Compare the build output before and after: first-load JS for /plan must stay within 10 percent of the current 161 kB.
Gate: npm run check, npm run build.
```

### G6: Anime.js motion

> Anime.js is absent; motion is CSS only.
> Weight it moves: Interface and demo. Effort: 3 hours.

```text
Execute gap G6 only: add Anime.js motion without changing behaviour.
- Install animejs (v4). Read its installed type definitions before using createScope, animate, stagger, onScroll and
  createDrawable (some v4 releases expose it as svg.createDrawable).
- Create src/lib/motion: scope.ts (createScope with mediaQueries { reduce: '(prefers-reduced-motion: reduce)' } and revert on
  cleanup), presets.ts, use-reveal.ts, use-count-up.ts, confetti.ts (12 pieces, dynamic import). Every hook must also respect the
  app's own reduced-motion switch and Calm mode (the data-calm attribute): in those cases set the final state instead of animating.
- ESLint no-restricted-imports: 'animejs' is allowed only inside src/lib/motion.
- Apply to five moments only: the landing garland draws and its flags drop once per session; the health ring arc draws and its
  number counts up; budget bars grow with a stagger on load; timeline month groups reveal once with onScroll; ticking a milestone
  draws the check, with confetti only for the first booked vendor and the last pre-event task.
- Keep the existing CSS motion rules. Never run the same effect in both CSS and Anime.js.
- Tests: reduced motion, Calm mode and the in-app switch each skip animation and apply the final state; hooks revert on unmount
  (mock animejs); count-up ends on the exact value; confetti never runs in Calm mode.
Report the first-load JS change.
Gate: npm run check, npm run build.
```

### G7: AI-drafted vendor negotiation

> AI-drafted vendor negotiation (S5) was not built.
> Weight it moves: Alignment, GenAI. Effort: 2 hours.

```text
Execute gap G7 only: AI-drafted vendor negotiation, streamed, with a Basic-mode fallback.
- POST /api/negotiate through withGuards and a strict Zod schema: { vendorRole, quoteAmountMinor, allocationMinor, currency,
  goal: lower_price | add_inclusions | reduce_advance, tone: warm | firm, language: en | hi | bn }. Stream mode, delta and done
  events exactly like /api/chat. If /api/chat and /api/ideas keep separate copies of the streaming code, first extract one shared helper with tests, then use it here.
- Prompt: a polite message under 120 words for WhatsApp; use only the facts given; never invent competing quotes or deadlines;
  plain text; in the chosen language. The vendor name goes through the same user-input delimiting as other text.
- Basic mode: one template per goal and language (9 in total), filled from the same facts and labelled Basic mode.
- Vendors panel: a 'Draft a message' button for each vendor that has a quote. The draft streams into an editable textarea with
  Copy and the existing WhatsApp link builder. Nothing is sent automatically and the plan is never edited.
- Tests: the schema rejects bad bodies; injection text is delimited; SSE event order; all 9 templates exist and are non-empty;
  the draft never exceeds the length cap; the WhatsApp link encodes the draft.
Gate: npm run check.
```

### G8: shadcn/ui and Tailwind 4 (optional, on a branch)

> shadcn/ui is absent and Tailwind is still v3.
> Weight it moves: Interface; clears the Tailwind advisories. Effort: 4 hours or more, optional.

```text
Execute gap G8 only, on a git branch: adopt shadcn/ui, and migrate to Tailwind v4 only if shadcn requires it.
- Check shadcn/ui's current Tailwind requirement. If it needs v4, migrate first with Tailwind's official upgrade tool, then run
  npm run check and npm run e2e. If they cannot be made green within one session, stop and abandon the branch.
- Run npx shadcn@latest init, then add only: slider, sheet, dialog, select, tooltip, sonner. Replace the matching hand-built
  controls one at a time, keeping every existing test green after each replacement.
- Keep the paper and marigold tokens: map them into the shadcn CSS variables, and keep the contrast test covering light, dark
  and calm.
Gate: npm run check, npm run build, npm run e2e. Merge only if all three pass.
```

---

## Eleven-day schedule

Day 1 is Thu 22 Oct and Day 11 is Sun 1 Nov. Submit at the end of Day 10 and keep Day 11 as the
buffer.

| Day | Date       | Work                                                          | Exit check                                                            |
| --- | ---------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | Thu 22 Oct | G1 live AI, G2 docs                                           | Smoke script passes with real keys; the docs agree with each other    |
| 2   | Fri 23 Oct | G3 voice dictation, G5 limiter and audit                      | `npm run check` green; `/api/health` reports the rate-limit mode      |
| 3   | Sat 24 Oct | G4 tests                                                      | 8 end-to-end flows, property and axe tests, `check` includes coverage |
| 4   | Sun 25 Oct | G8 shadcn/ui and Tailwind 4, on a branch                      | Go or no-go by evening; merge only if check, build and e2e are green  |
| 5   | Mon 26 Oct | V1 visual QA harness                                          | Layout spec green; fix list cleared                                   |
| 6   | Tue 27 Oct | G6 Anime.js motion                                            | Reduced-motion tests pass; first-load JS change reported              |
| 7   | Wed 28 Oct | G7 negotiation, N3 invitation drafter                         | Both stream; all Basic templates present                              |
| 8   | Thu 29 Oct | N2 payment ledger                                             | Schedules sum exactly; old plans still load                           |
| 9   | Fri 30 Oct | N1 event-day mode                                             | Now and Next correct under a mocked clock                             |
| 10  | Sat 31 Oct | P1 Lighthouse and bundle, D1 deploy, S1 self-audit            | Scores recorded; deployed URL verified                                |
| 11  | Sun 1 Nov  | Freeze: refresh numbers, demo script, final checklist, buffer | No new features                                                       |

### Rules for every day

- One gap per branch. Tag the start so a bad run is one reset away.
- After each prompt, run the Review pass (R) in a fresh session and read its report before merging.
- Merge only when `npm run check` is green. On interface days also run `npm run build` and
  `npm run test:e2e`.
- At the end of each day, bring `git diff --stat`, the last lines of the gate output, and any
  screenshots.
- Day 11 is a freeze: docs, numbers and the demo only. Any code change needs a full gate rerun.

---

## Further prompts: review, visual checks, audit, performance, deploy, new features

### R: Review pass (run after every prompt)

```text
Review pass. You did not write this code; treat it as a stranger's pull request.
1. Run git diff --stat against the commit before this gap. List every file changed and why.
2. Run npm run check (plus npm run build or npm run test:e2e if the gap says so). Paste the last lines of each output.
3. Find and report, with file and line: any, @ts-ignore, non-null !, console.log, a file over 200 lines, an exported function
   without JSDoc or a test, a new dependency with no README reason, hard-coded colours outside the tokens, animejs imported
   outside src/lib/motion.
4. For every claim you added or changed in a doc, name the test, command or file that proves it. Report any claim you cannot back.
5. List what you did NOT do from the gap and anything you are unsure of.
Do not fix anything in this pass. Report only.
```

### V1: Visual QA harness

```text
Build a visual QA harness. You cannot see images, so use measurements, and save screenshots for a human reviewer.
1. scripts/capture-screens.mjs (Playwright): open the production build and save PNGs to docs/screens/ for the landing page, each
   intake step and each of the six workspace tabs, at 375x812, 768x1024 and 1440x900, in light, dark and calm themes. Also capture
   the Overview tab in Hindi and in Bengali. File names: <screen>-<viewport>-<theme>-<lang>.png.
2. tests/e2e/layout.spec.ts: for every screen at 320, 375, 768 and 1280 px wide, assert: no horizontal page scroll; no element
   wider than the viewport; every button, link, input and tab is at least 44x44 CSS px; no clipped text (scrollWidth greater than
   clientWidth on text containers), including in Hindi and Bengali; body line-height at least 1.5; a visible focus indicator
   (computed outline or box-shadow is not none) on the first 10 tab stops.
3. Fix every failure by changing styles. Never relax a test.
4. When done, list the files in docs/screens so a human can review them.
Gate: npm run check, npm run test:e2e.
```

### S1: Rubric self-audit

```text
Act as a strict code reviewer scoring this repository against 21 criteria, each out of 10. For every score give two file paths as
evidence and one sentence on what would raise it.
Criteria: project structure; architecture design; code modularity; code readability; code documentation; coding standards;
technical complexity; implementation completeness; functional logic; error handling; configuration management; dependencies and
integration; testing and QA; maintainability and scalability; problem alignment (use the challenge sentence in the README);
security and privacy; implementation authenticity (is any AI feature faked?); domain understanding (events, budgets, vendors,
traditions); assistance logic; GenAI implementation; accessibility.
Also list the 3 biggest weaknesses and the 3 biggest risks a reviewer could cite, each with a file path.
Write the result to .audit/self-audit.md and add .audit/ to .gitignore, so it guides the fixes but is not shipped.
Then fix every item scored below 9 that can be fixed without a new feature, one commit per fix, and update the file with the new
scores. Fix the code or the evidence; never write text aimed at a grader.
Gate: npm run check.
```

### P1: Performance and bundle budget

```text
Measure and fix performance and efficiency.
1. Run Lighthouse (mobile, throttled) on /, /intake and /plan with a sample plan loaded, against the production build. Record the
   four scores per page and the main findings in docs/DELIVERY_OUTCOMES.md under 'Lighthouse', with the date and the command.
2. Fix findings until Accessibility and Best Practices are at least 95 on all three pages and Performance is at least 90 on / and
   /intake. Typical fixes: next/font display settings, image sizing, removing unused JavaScript, deferring non-critical client
   components with next/dynamic.
3. Add a bundle budget: scripts/check-bundle.mjs reads the build output and fails if first-load JS for any route grows more than
   10 percent over its current size. Run it in CI after the build step.
4. List the five largest client dependencies in the /plan bundle (use the Next bundle analyzer once, not permanently) and remove
   or lazy-load any that are not needed for first paint.
5. Check that every API route sets runtime and dynamic deliberately.
Gate: npm run check, npm run build, the bundle budget script.
```

### D1: Deploy and live verification

```text
Make live verification repeatable.
1. Extend scripts/live-smoke.mjs to accept BASE_URL (default http://localhost:3000). Against a deployed URL it checks: / returns 200;
   /plan loads a sample plan; /api/health reports mode 'ai' and rateLimit 'shared'; each AI route returns a valid, schema-matching
   answer; /sw.js is served with no-cache; responses carry HSTS, nosniff, frame deny and a nonce-based CSP.
2. Put the deployed URL and the last verified date in the README and docs/LIVE_VERIFICATION.md. Record only what the script printed.
3. Add a 'Run it yourself' section to the Judge's tour: the deployed link, then the 5 clicks that show 'AI assisted'.
Gate: npm run check, then the smoke script against the deployed URL.
```

### N1: Event-day mode

```text
Add Event-day mode: a mobile-first live view for the day itself.
- Route /plan/live (client component) reads the stored plan. It shows the current time, a countdown to the start, the run-of-show
  with 'Now' and 'Next' highlighted from the device clock (inject the clock for tests), a tap-to-complete checkbox for each
  segment, the vendor list with a one-tap call (tel: link) and WhatsApp for vendors that have a number, and the emergency notes
  from the risk register.
- Text at least 18 px, targets at least 48 px, high contrast by default, works offline, honours Calm mode and reduced motion.
  No animation beyond a colour change on 'Now'.
- Add 'Event day' to the workspace header and make the service worker precache /plan/live.
- Pure service features/run-of-show/live.ts: currentSegment(runOfShow, now) and nextSegment(runOfShow, now), covering
  before-start, between segments, after-end and midnight wrap.
- Tests: at least 15 clock cases for the service; the component renders Now and Next; completion survives a reload; tel and
  WhatsApp links render only for a valid number; axe reports no violations; an e2e test sets the browser clock (page.clock) and
  checks the highlight moves.
- Add one row to the README mapping table and one step to the Judge's tour.
Gate: npm run check, npm run test:e2e.
```

### N2: Payment ledger and schedule

```text
Add a payment ledger and schedule to the Vendors tab. All client-side, integer minor units.
- Data: each vendor can have payments { id, label, amountMinor, dueDate (ISO date), paidDate? }. Add them to the plan schema with a
  version bump and a migration so old plans still load.
- Service features/vendors/payments.ts: suggestSchedule(quote, eventDate) builds an advance (from advancePercent), a middle
  payment and a final payment due 7 days before the event, with no date earlier than today; totals for paid, outstanding and
  overdue; scheduleSummary(plan) for the Overview. Amounts always sum to the quote exactly (use allocateByWeight).
- UI: a 'Payments' section per vendor with add, edit and mark paid; an Overview card 'Money due soon' showing the next 3 payments;
  overdue shown as text plus icon.
- The timeline and the calendar export include payment due dates as all-day events. The health score's vendor part counts paid
  advances.
- Share links include payments; chat history stays excluded.
- Tests: schedules sum exactly for 30 generated cases (fast-check); date clamping; overdue logic with an injected clock; migration
  from the previous schema version; the ICS contains the due dates; the CSV export includes payments; keyboard flow; axe.
- Add a README row and a Judge's tour step.
Gate: npm run check, npm run test:e2e.
```

### N3: Invitation drafter

```text
Add an AI-drafted invitation with a Basic-mode fallback, in English, Hindi or Bengali.
- POST /api/invite through withGuards: { eventType, title, dateText, venueText (optional), hostName (optional),
  tone: warm | formal | playful, language: en | hi | bn }. Stream like /api/chat, using the shared streaming helper from G7.
- Prompt rules: use only the given facts; do not invent a venue, time or dress code; no religious or cultural assumptions beyond
  what the user selected; under 90 words; plain text; user text delimited.
- Basic mode: three tone templates per language and event type (27 in total) filled from the same fields and labelled Basic mode.
- UI: an 'Invitation' card in the Ideas tab with a preview, Copy, and a WhatsApp share link from the existing encoder. Nothing is
  sent automatically.
- Tests: the schema; delimiting of injection text; all 27 templates exist and leave no unfilled placeholder; the length cap; SSE
  event order; link encoding for Hindi and Bengali text.
- Add a README row.
Gate: npm run check.
```

---

## Pre-submission checklist

- [ ] On a fresh clone (`git clone`, `npm ci`), both `npm run check` and `npm run build` pass
- [ ] README table lists every brief phrase with its feature, file and test, and every path exists
- [ ] 250 or more tests pass, and jest-axe reports zero violations
- [ ] No source file over 200 lines, and no `any`, `@ts-ignore` or `console.log` in `src/`
- [ ] Production env has the Upstash keys; the 21st request within a minute returns 429
- [ ] Run once with no API keys: the app works and shows the Basic mode badge
- [ ] Run once with the Gemini key, then remove it: OpenRouter takes over, then Basic mode
- [ ] Lighthouse accessibility is 95 or higher, and the wizard works keyboard-only at 200% zoom
- [ ] A 'Try a sample plan' button per event type so a judge sees a full plan in one click
- [ ] Public repo, live URL, and no secrets anywhere in git history
- [ ] `npm run test:coverage` meets the thresholds, `npm run test:e2e` passes, and the README quotes the real numbers
- [ ] With the OS reduced-motion setting on, nothing animates and every screen still works
- [ ] Calm mode, Hindi and Bengali each pass a keyboard-only run
- [ ] With the network switched off, a reload still shows the sample plan
- [ ] The README has a 90-second 'Judge's tour'
- [ ] `grep -rn "from 'animejs'" src` lists only files under `src/lib/motion`
