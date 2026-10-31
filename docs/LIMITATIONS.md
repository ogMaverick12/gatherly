# Limitations

What this product is not, what it does not do, and what you should check before you rely on it.

This document is deliberately blunt. A planning tool that is optimistic about its own accuracy is
worse than useless on the day it is used.

---

## 1. The numbers are estimates, not quotes

Every money figure in Gatherly comes from a **model of a typical event**, adjusted for what you
told it: guest count, city tier, venue type, currency, and your stated priorities.

- **There is no market data.** No vendor database, no price index, no local pricing feed. The
  per-category split is a plausible starting point, not a quotation.
- **City tier is coarse.** "Tier 2 city" is a broad band. A plan for a tier-2 city in one country
  can be far off in another.
- **Quantities are arithmetic, not catering advice.** "How much food" is derived from the guest
  count and the meal structure. It does not know your guests.
- **A contingency is included**, because every real event has one. It is a percentage, not a
  calculation of your risks.

**Before you rely on a figure**, replace it with a real quote. The app is built to make that easy:
the budget is editable and every number is visible with its reasoning.

---

## 2. The tradition and festival packs are starting points

There are eight optional packs. Each one contributes a few checklist items and shifts a few
percentage points of the budget.

- They are **generic descriptions**, not instructions for a specific ceremony. "Mehendi & haldi
  evenings" says what those evenings generally involve; it does not know your family's way of
  doing it.
- They are **never applied unless you choose them**. The app does not infer identity, religion,
  community, region or nationality from anything you type, and the AI prompt explicitly forbids it.
- **Confirm them** with family, elders, officiants or local organisers before you rely on them.
  This is the app's own disclaimer, shown wherever a pack is offered.

---

## 3. The AI is optional, and Basic mode is not intelligence

- **Basic mode is deterministic rules over your plan.** It is honest about that - the badge says
  _Basic mode_ and the help text says _"They are honest, not intelligent."_ It will not write you a
  poem about your wedding.
- **A live provider can be wrong.** The system prompt asks it not to invent vendors, prices,
  quotes, availability, weather or regulations, but a prompt is a request, not a guarantee. The
  assistant is not a source of truth.
- **The assistant never edits your plan.** It has no control that changes anything. The Ideas panel
  can add exactly one task, and only when you press the button.
- **Provider answers are schema-validated**, and an answer that does not match the shape is
  discarded in favour of the deterministic one. That protects the structure, not the advice.
- **Prompt injection is mitigated, not impossible.** User text is treated as data and delimited;
  that defeats the obvious attempts. It does not make a language model incapable of being misled.

---

## 4. The vendor coverage number is a percentage, not a status

Coverage is booked-and-quoted spend against the planned vendor allocation. It does not know:

- whether a booked vendor has actually signed anything,
- whether a quote is still valid,
- whether the venue you booked includes catering (which would double-count),
- whether a vendor's availability actually matches your date.

The WhatsApp message is **pre-written but not sent** - you press it, you review it, you send it.

---

## 5. The health score is a heuristic, not an oracle

Five weighted parts - budget, timeline, vendors, tasks and guest experience - that sum to 100 per
cent. It is a **checklist with weights**, and it is only as good as that checklist. The weights are
fixed; they are not weighted by event type, and they do not know that you have already booked the
hard thing.

The score is most useful as a conversation starter and a way to notice a category you have ignored.
Treat a 92 as "this plan looks internally consistent", not "this plan is good".

---

## 6. No accounts, no collaboration, no history

- **There is no server-side user state.** The plan lives in one browser on one device. Clearing site
  data deletes it.
- **There is no multi-user editing.** Two people cannot work on the same plan at the same time.
- **There is no version history.** The plan has an `updatedAt` stamp, not a changelog.
- **There is no backup service.** The JSON export and the share link are the only ways out. Use
  them.
- **There are no notifications or reminders.** The timeline tells you what is late; nothing emails
  you.

---

## 7. Sharing has sharp edges

- **A share link is a bearer token.** Anyone who has the link can read the shared plan. It is not
  encrypted; it is base64url-encoded, sometimes compressed, and it is in the URL.
- **A share link can be long.** It is compressed, but a large vendor list still makes a long URL,
  and some chat apps truncate long links.
- **Chat history and saved ideas are deliberately dropped** from a share link. That protects a
  conversation, but it also means the recipient does not get everything you see.
- **Opening a shared plan replaces the plan on your device**, and the app asks first.

---

## 8. Offline is real but partial

- The **app shell and the plan** work offline, and every engine still calculates.
- **Refresh ideas** and the assistant's live mode need the network. The assistant falls back to
  computing locally and says so; Refresh ideas shows an error notice.
- The service worker caches the shell on the first load. A brand-new device with no cached shell
  and no network shows nothing - that is how offline works.
- **`localStorage` can be cleared** by the browser, by private mode, or by the operating system.
  Export the JSON if the plan matters.

---

## 9. Accessibility

- Contrast is **measured** for the light, dark and calm themes in the test suite, and the app
  follows keyboard, focus, target-size and reduced-motion guidance.
- **Three languages** are translated: English, Hindi and Bengali. The test suite asserts that all
  three dictionaries carry exactly the same keys, so no dictionary label can fall back to English
  by accident. Engine-generated health band labels and explanations are still English-only. The
  translations are working translations, not native review - if you speak one of these languages
  and something reads awkwardly, that is worth reporting.
- **Read aloud** uses the browser's speech synthesis. It depends on the operating system having a
  voice for the selected language, and it is unavailable in some browsers - the app says so rather
  than showing a dead button.
- **Screen-reader testing** was done with the standard roles and names, but this is not a
  substitute for testing with real assistive technology and real users.

---

## 10. The engineering

- **The in-process rate limiter is per-instance.** Set `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` in production, or every instance keeps its own bucket.
- **The AI routes are open.** There are no accounts, so there is nothing to authenticate. They are
  body-capped and rate limited, and a live provider key behind them is a cost the operator carries.
- **Coverage is measured, and the thresholds are enforced.** Run `npm run test:coverage` for the
  current figures. The uncovered lines are concentrated in UI branches and in the fallback paths of
  the provider adapters.
- **A few files are longer than the 200-line house rule.** `npm run stats` measures them and
  compares the count with [`quality-allowance.json`](quality-allowance.json). The notes in that file
  say why each remaining entry is there; lower an allowance when its count drops.
- **The browser suite is the evidence for the plan.** `npm run check` runs the unit and component
  suites; `npm run test:e2e` runs the Playwright journeys. There is no load test and no
  cross-browser matrix beyond Chromium.
- **Dependency audit.** Run `npm audit --omit=dev` for the current result.
  See [`../SECURITY.md`](../SECURITY.md#3-dependency-posture).

---

## 11. What Gatherly is good at

- Turning a blank page into a structured, editable plan.
- Making the **math visible**: what each category costs, what it is per guest, what happens if the
  guest count changes, what is late, what is unbooked.
- Working **without a network and without an API key**.
- Being **honest about what it knows** - Basic mode is labelled Basic mode, estimates are labelled
  estimates, and nothing is inferred about who you are.

It is not a booking system, not a marketplace, not an advisor, and not a replacement for the people
who know your family and your city.
