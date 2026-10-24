# Gatherly implementation plan

## Product direction

Gatherly is a global event-planning companion for weddings, birthdays, and community gatherings. It keeps the deterministic planning work in the browser, makes AI optional and transparent, and feels like a considered editorial tool rather than a generic admin dashboard.

## Design system

- **Movement:** warm editorial celebration — paper, ink, marigold and peacock teal, with confident serif headlines and quiet utility UI.
- **Principles:** calm confidence, progressive disclosure, visible math, culturally respectful personalization.
- **Palette:** paper `#FBF6EE`, ink `#1F1A17`, marigold `#E8962A`, teal `#0F6E6A`, rose `#B4234F`; dark mode uses `#17120F` and `#F6EFE4`.
- **Typography:** Fraunces for expressive display headings, Plus Jakarta Sans for body and controls, Noto Sans Devanagari/Bengali for optional language support.
- **Layout:** landing page with editorial split hero; plan workspace uses a sticky health rail and bento cards; mobile tabs become a bottom navigation bar.
- **Signature elements:** a hand-drawn garland line, health ring, and marigold “celebration dot” status marker.
- **Interaction:** actions explain what changes; AI never silently edits; estimates are labelled; all important actions work with keyboard and reduced motion.
- **Motion:** transform/opacity only, short spring-like transitions through `src/lib/motion`, disabled under reduced motion or Calm mode.
- **Voice:** warm, practical, globally inclusive. Example: “A beautiful event is a sequence of small, kind decisions.” / “Make room for the moments people will remember.”
- **Wordmark:** “Gatherly” is paired with a simple four-point celebration mark, not a generic text logo.

## Architecture

Next.js App Router + TypeScript strict mode. Server components provide shells; client components own the interactive plan workspace. Zod schemas define intake, plans and AI outputs. Pure feature services calculate budget, timeline, health, vendors, catering and exports. API routes are stateless and return deterministic Basic mode when no provider is configured. LocalStorage persists the versioned plan; a compact JSON fragment provides sharing without server state. `public/sw.js` caches the shell and never caches `/api/*`.

## Source structure

- `app/`: routes, metadata, global styles, manifest and API handlers.
- `src/features/`: domain slices with schemas, pure services and UI modules.
- `src/lib/`: shared plan store, money/date utilities, motion, security and API helpers.
- `tests/`: service and component tests; `tests/e2e/` contains Playwright flows when the browser suite is added.

## Delivery scope

The first implementation includes the complete planning workspace, sample plans for all three event families, deterministic budget/timeline/vendor/health/catering engines, Basic-mode ideas/chat/parse routes, exports, share links, offline shell, accessibility controls, multilingual labels, and the documentation/security files required by the brief. Provider adapters remain isolated so Gemini/OpenRouter can be enabled by environment configuration without changing product logic.
