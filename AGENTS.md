# AGENTS.md: Celebration & Event Planner

## Mission

GenAI event planner for weddings, birthdays and community events: budget, timeline,
vendor checklist, personalized ideas, grounded chat, plus a health score, vendor quotes,
run-of-show, tradition packs and offline mode. It is graded on problem alignment,
code quality, security, efficiency, testing and accessibility. Evidence in the repo is the score.

## Rules (non-negotiable)

1. Work on ONE phase of PLAN.md at a time. Plan in at most 10 lines, then edit files.
2. Finish a phase only when `npm run check` passes, then commit: `git commit -am "<phase>: <summary>"`.
   If the same error survives 2 attempts, write the error and what you tried to NOTES.md and move on.
3. Never invent packages, APIs, model IDs or paths. Unsure? Read node_modules types or the docs first.
4. TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!`, no `eslint-disable`.
5. Zod is the source of truth. Define the schema first, derive types with `z.infer`.
6. Services are pure: no React, no fetch, no `Date.now()` (inject a clock). Components call services.
7. Import across features only through `features/<name>/index.ts`. No circular imports.
8. Files under 200 lines, functions under 40 lines, one responsibility each.
9. Money is integer paise in all math. Format only in `lib/money.ts`.
10. Every API route uses `withApiGuard`. Every LLM output is Zod-validated.
11. Every fallback result carries `degraded: true` and the UI shows a visible "Basic mode" badge.
12. No server state. No module-level mutable Maps (the dev-only rate limiter is the one exception).
13. New dependency = one-line reason in README. Banned: jspdf, moment, lodash, and any UI kit except shadcn/ui.
14. Comments explain WHY. JSDoc on every exported function in `services/` and `lib/`.
15. Never log user text or PII. Use `lib/security/logger.ts`, which redacts.
16. Accessibility: keyboard reachable, visible focus, labelled inputs, `aria-live` for status changes,
    colour never the only signal, honour `prefers-reduced-motion`.
17. Tests: each service function gets happy, edge and error cases. Use `fast-check` for money and allocator invariants.
18. Do not edit AGENTS.md or PLAN.md. Do not paste whole files into chat; edit in place with small diffs.
19. UI comes from shadcn/ui in `src/components/ui`, added with the CLI. Style with Tailwind tokens only;
    no hard-coded hex outside `tokens.ts` and `globals.css`.
20. Motion goes only through `src/lib/motion`. Anime.js v4: import functions individually from 'animejs',
    use `createScope` with a reduced-motion media query, call `scope.revert()` on cleanup, animate transform
    and opacity only. Read the installed type definitions before using an export.
21. Every animated status change is also written as text in an `aria-live` region.
22. Every AI feature has a Basic mode that works with no API keys and is labelled `degraded`.
23. Tradition packs are data files the user selects. Never infer religion, caste, community or region.
    Keep to ceremony names and generic prep tasks, and label each pack a starting point to confirm with family or elders.
24. Each phase ships its own tests (minimums in PLAN.md). Coverage thresholds must pass; never lower them.
    No `.only`, no `.skip`, no real network, no real clock.
25. Test names describe behaviour, for example 'rejects a past event date'.
26. Each feature adds one row to the README mapping table in the same phase.
27. Never state a number (tests, coverage, scores) in docs unless you just ran the command that produces it.

## Naming

Files kebab-case. Components PascalCase. Functions camelCase. Constants SCREAMING_SNAKE_CASE.
Tests mirror source paths under `tests/`.

## Commands

`npm run check` = typecheck + lint + format:check + test:coverage (the gate for every phase).
`npm run test:e2e` = Playwright flows (run in Phase 13 and in CI).
