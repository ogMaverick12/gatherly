# Judge's tour

A ninety-second walkthrough, in the order the brief describes it. Every label below is the actual
label in the app, so you can follow along with search.

---

## 0. Start the app

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No API key is needed - the default provider is Basic mode, which
answers with deterministic rules over your own plan and never contacts a third party.

---

## 1. The landing page (10 seconds)

The headline reads **"Make room for the moments people will remember."** Below it, three sample
plan cards - a wedding, a birthday and a community gathering - each with a button.

**Click any of them.** That is the whole onboarding: the sample becomes a real, editable plan in
your browser and you land in the workspace. Nothing was sent anywhere.

While you are here, notice the privacy line under the hero: the plan stays in your browser.

---

## 2. The health ring (10 seconds)

The workspace opens on **Overview**. On the left is the health ring - a number out of 100 with a
band (`On track`, `Worth attention`, `At risk`).

**Open the "How it is calculated" panel under the ring.** It lists the five parts, each with its
score, its weight and the sentence describing _what was measured_, so the score is never a black
box. The formula is printed there too.

Underneath, **"Do this next"** tells you the single most useful thing to do next.

---

## 3. Budget - the visible math (15 seconds)

Click the **Budget** tab.

- Every category shows its amount, its share as a percentage, and the per-guest figure.
- The percentage points and the amounts always add up to your budget - the allocation uses the
  largest-remainder method, so nothing is lost to rounding.
- **"Things to check"** lists the warnings (over the ceiling, a category that is unusually high).
- Scroll to **"What if"**: each scenario is the same plan with one thing changed. Compare
  per-guest cost at 80 guests, at 120 guests, at 150 guests. The table header says _Per guest_.

---

## 4. Timeline - backwards from the day (10 seconds)

Click the **Timeline** tab.

- The milestones are computed **backwards from the event date**, so each one has a real date.
- **Tick one of the checkboxes.** The state is saved immediately.

**Now press F5 / reload the page.** The tick is still there. The plan is stored in your browser,
and the workspace restores it with no action from you.

The **run of show** further down is a printable draft with times, owners and locations.

---

## 5. Vendors - status and coverage (15 seconds)

Click the **Vendors** tab.

- Change a vendor's **Status** from _To contact_ to _Booked_. The **Coverage** number moves
  immediately: it is the booked and quoted spend against the planned vendor allocation.
- Add a quote and see the **Quote score**.
- Click **Message** on a vendor with a number - it opens a WhatsApp message with the vendor's
  details and the event date, pre-written but not sent.

---

## 6. Ideas - the honest badge (10 seconds)

Click the **Ideas** tab.

The badge says **Basic mode**, and the help text says so plainly: _"Built from your own numbers.
Nothing here was written by a model."_ The ideas come from `/api/ideas`, which in Basic mode
computes them deterministically from your plan - press **Refresh ideas** and you get the same set,
because the same plan and the same rules produce the same answer.

If a provider is configured, the badge changes to **AI assisted** and the ideas come from the model
instead; if the model's answer does not match the expected shape, the deterministic ideas are shown
again with a notice that says so.

Each idea carries an **Apply to the plan** button, and the line under it says exactly what will
happen: _"This adds one task to your checklist. Nothing else in the plan changes."_ Press it and
watch the task appear in Timeline. Nothing is applied for you.

---

## 7. Assistant - Basic mode, visibly (15 seconds)

Click the **Assistant** tab and ask _"What should I do next?"_

- The badge says **Basic mode**, with the explanation: _"No AI provider is configured, so answers
  come from deterministic rules over your plan. They are honest, not intelligent."_
- The answer is streamed in. Nothing was edited. The assistant has **no** control that changes the
  plan - it only answers.
- If you go offline, the answer still arrives (computed locally) and the notice explains why.

If you have a key, set `GATHERLY_AI_PROVIDER=gemini` and `GEMINI_API_KEY` and the badge changes to
**AI assisted**. If the provider fails, the answer still arrives, the badge says **Basic mode** and
a notice explains why.

---

## 8. Exports (15 seconds)

In the Exports card:

- **Print or save as PDF** - opens the print dialog with the workspace laid out for paper.
- **Add to a calendar** - downloads `gatherly-plan.ics` with the event and every milestone.
- **Export the budget as CSV** - downloads `gatherly-budget.csv`. Open it in a spreadsheet: the
  numbers are the same numbers.
- **Copy a share link** - the confirmation reads _"Share link copied. It never leaves your
  browser."_ The plan is in the URL **fragment**, which browsers never send to a server.
- **Download the plan as JSON** and **Restore from a file** - a full round trip.

---

## 9. Offline (10 seconds)

With the plan loaded, **turn the network off** in the browser's developer tools (or stop the dev
server and reload).

The plan still loads. Every engine still calculates - budget, timeline, vendors, health, risks,
catering. Every export still works, because they are all built in the browser. The assistant still
answers, computed locally with the same deterministic rules, and a notice says so. The banner at
the top tells you _"You are offline. The plan still works."_

Two things do need the network, by design: **Refresh ideas** (it calls `/api/ideas`) and the
assistant's live-provider mode. Both fail visibly with a notice rather than silently.

---

## 10. Accessibility and language (10 seconds)

Open **Display and access**:

- **Text size**: Standard, Large, Largest. The whole app scales.
- **Calm mode**: quieter colours, softer edges, no celebratory motion, nothing that flashes.
- **Reduce motion**: honoured independently of the OS setting.
- **Theme**: Light, Dark, System.
- **Language**: English, हिन्दी, বাংলা. The labels change immediately, without a reload.
- If your browser supports it, there is a **read aloud** control; if not, the app says so
  plainly instead of offering a dead button.

Press **Tab** from the top of the page: the first stop is the skip link. Move through the tabs with
the arrow keys. Every action target is at least 44px.

---

## 11. If you want to check the engineering

```bash
npm run check     # lint + typecheck + format + tests with coverage
npm run build     # production build
npm run test:e2e  # the Playwright journeys
npm audit --omit=dev
```

The full picture is in [`ARCHITECTURE.md`](ARCHITECTURE.md), the requirement-by-requirement mapping
is in [`TRACEABILITY.md`](TRACEABILITY.md), the security model is in
[`../SECURITY.md`](../SECURITY.md), and the honest gaps are in
[`LIMITATIONS.md`](LIMITATIONS.md).
