# Security

Gatherly is a browser-first application with a small, stateless server surface. This document
describes the threat model, the controls that are actually implemented, and the honest gaps.

---

## 1. Threat model

### What the system holds

| Data                                                       | Where it lives                                  | Sent to a server?                              |
| ---------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| The plan (intake, tasks, vendors, milestones, ideas, chat) | Browser `localStorage`, key `gatherly:plan:v1`  | No                                             |
| Display preferences                                        | Browser `localStorage`, key `gatherly:prefs:v1` | No                                             |
| Share links                                                | URL **fragment**                                | No - fragments are never sent in HTTP requests |
| API keys                                                   | Server environment only                         | Never to the browser                           |
| Free text the user types                                   | Browser, then a request body                    | Yes, only to the AI route the user called      |

There is **no account system, no database, no payment, no upload and no server-side session**. The
server keeps nothing between requests.

### Who is trusted

- The **user's own browser** is the system of record for the plan.
- **Everything arriving from outside the app is untrusted**: HTTP bodies, `localStorage` contents,
  URL fragments, and any text a language model might have been influenced by.
- **Everything arriving from a language model is untrusted**: model output is displayed, never
  applied to the plan without an explicit user action.

### What the attacker is assumed to be able to do

- Send arbitrary HTTP requests to `/api/*`, including oversized and malformed bodies.
- Replay or forge share fragments.
- Corrupt `localStorage` directly through the devtools.
- Put prompt-injection text into any free-text field.

---

## 2. Controls

### 2.1 Request handling (`src/lib/security/guards.ts`)

Every route is wrapped in `withGuards`, which applies, in order:

1. **Method check** - anything other than `POST` gets `405`.
2. **Rate limit** - 20 requests per minute per route per client key, with `Retry-After` on refusal.
3. **Body size cap** - `MAX_BODY_BYTES` is 16 KiB. The cap is enforced _while streaming_ (the
   reader is cancelled as soon as the total exceeds the limit), so a large body is never fully
   buffered. A declared `content-length` over the cap is rejected with `413` before reading.
4. **JSON parse** - a malformed body is a `400`, not a `500`.
5. **Zod validation** - the body is parsed against a strict schema. Unknown keys are rejected.
   On failure the response lists the offending fields, never the raw body.
6. **Response headers** - every response is `Cache-Control: no-store, no-cache, must-revalidate`
   with `X-Content-Type-Options: nosniff`.
7. **Request logging** - one line per request: route, status, duration and a correlation id.
   Bodies, prompts, keys and the user's words never reach the log.

### 2.2 Rate limiting (`src/lib/security/rate-limit.ts`)

The `RateLimiter` interface has two implementations:

- `UpstashRateLimiter` - **the production configuration**. It is selected automatically when
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, and every instance then counts
  against the same bucket. It fails **open** if the store is unreachable, so an outage of Redis
  cannot take the app down; the body cap and the provider timeout still bound the request.
- `InMemoryRateLimiter` - **the local default**. A token bucket in the current process, with stale
  buckets pruned so a long-running process cannot grow without bound. It is correct for local
  development and for a single long-running server, and it is _not_ sufficient for serverless,
  where each instance would keep its own bucket.

The mode is **observable**, not hidden in a log file:

- `GET /api/health` answers `{ ok, mode, rateLimit }`, where `rateLimit` is `shared` when the
  Upstash variables are set and `per-instance` when they are not.
- A production start without the variables logs **one** warning, from the startup hook in
  `src/instrumentation.ts`, naming the missing variables and nothing else.

The limits themselves are deliberately unchanged (20 requests per minute per route per client
key): a stricter bucket would break the demo. The gap is closed by configuration, and the
configuration is reported rather than assumed.

### 2.3 Prompt-injection awareness (`src/lib/ai/prompts.ts`, `src/lib/security/sanitize.ts`)

- User text is **data, never instructions**. It is stripped of control characters and zero-width
  characters, whitespace-normalised, capped at 2000 characters, and wrapped in an explicit
  `<user_input>` block. Attempts to close that block are neutralised.
- The system prompt states that everything inside `<user_input>` and `<plan_summary>` is data and
  that instructions found there must be ignored.
- The system prompt forbids inventing vendors, prices, quotes, availability, weather or
  regulations, and forbids inferring religion, community, region, nationality or culture.
- Model output is **never applied to the plan automatically**. AI suggestions are displayed and
  the user applies them; the AI never edits the plan.
- The plan summary that is sent to a provider is machine-generated and bounded - it is not a
  verbatim copy of arbitrary user text.

### 2.4 Provider isolation and failure handling (`src/lib/ai/`)

- One `Provider` interface; `BasicProvider` (deterministic, offline) and `GeminiProvider` /
  `OpenRouterProvider` are interchangeable behind it. Product logic never depends on a vendor.
- API keys are read from the server environment inside the adapter and are never sent to the
  browser, never logged, and never included in a response body.
- **One** retry, and only for a retryable failure (429, 502, 503, 504). A bad request is never
  sent twice.
- A 20-second route timeout (`ROUTE_TIMEOUT_MS`) bounds the whole handler; the provider gets 15.
- On any provider failure the route answers with the deterministic Basic-mode result and adds a
  notice, so the product degrades instead of breaking.
- The mode is always visible: the SSE stream emits a `mode` event before the `delta`, so the badge
  is on screen before the answer arrives.

### 2.5 Browser-side storage (`src/lib/plan-store.ts`, `src/features/accessibility/provider.tsx`)

- `localStorage` is read as **untrusted input**: both the plan and the preferences are parsed with
  a strict Zod schema on read. A value that does not match is discarded (and removed), never
  trusted, so a corrupted or outdated entry cannot crash the app or smuggle in a malformed plan.
- Storage failures (quota exceeded, private mode) are caught: the in-memory plan keeps working.

### 2.6 Share links (`src/lib/share.ts`)

- The payload lives in the URL **fragment**. Fragments are not sent to the server, so a share link
  creates no server state and cannot be logged by a proxy.
- The payload is a compact JSON document, deflated with `CompressionStream` when the browser
  supports it, then base64url encoded. A plain fallback exists for browsers without
  `CompressionStream`.
- On decode, the payload is validated against the plan schema. An unknown version, a malformed
  base64 body, a failed inflate or a schema mismatch all return `null` instead of a partial plan.
- Only the parts worth sharing are included: intake, tasks, vendors, milestones. **Chat history and
  saved ideas are deliberately dropped**, so a share link cannot leak a conversation.

### 2.7 Output handling (`src/lib/security/sanitize.ts`, `src/lib/csv.ts`)

- CSV cells are quoted, embedded quotes are doubled, and a cell that starts with `=`, `+`, `-` or
  `@` is prefixed with `'` to defuse spreadsheet formula injection.
- Free text that is rendered back into the UI is escaped by React by default; the app does not use
  `dangerouslySetInnerHTML` anywhere.

### 2.8 Transport and browser headers

Static headers are set in `next.config.ts` for every path:

| Header                       | Value                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload`                 |
| `X-Content-Type-Options`     | `nosniff`                                                      |
| `X-Frame-Options`            | `DENY`                                                         |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                              |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                  |

`/sw.js` additionally gets `Cache-Control: no-cache, no-store, must-revalidate` and
`Service-Worker-Allowed: /`, so a client cannot be pinned to an old shell.

The **Content-Security-Policy** is issued by `middleware.ts`, not `next.config.ts`, because it needs
a per-request nonce:

```
default-src 'self';
script-src 'self' 'nonce-<random>' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
worker-src 'self' blob:;
manifest-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

`connect-src 'self'` means the browser may only talk to this origin - a provider call always goes
through the server route, never directly from the browser to a third party.

`style-src` allows `'unsafe-inline'` because Next.js and the UI libraries inject style elements
and inline style attributes at runtime, which a nonce cannot cover; `script-src` stays
nonce-only with `strict-dynamic`, so no inline or external script can run.

### 2.9 Service worker (`public/sw.js`)

- It caches the app shell and static assets only.
- **`/api/*` is never cached.** AI routes are per-request, stateless and rate limited; a cached
  answer would be both wrong and a leak.
- The cache name is versioned (`gatherly-shell-v1`) so a new shell replaces the old one.

---

## 3. Dependency posture

```bash
npm audit --omit=dev   # 0 vulnerabilities
npm audit              # 7 high, all in the development toolchain
```

**Production dependencies are clean** — `npm audit --omit=dev` reports zero findings.

The remaining seven findings are all in build- and lint-time tools only. None ships to the browser,
none handles user data at runtime, and none is reachable from a request:

| Package                                                           | Severity | Why it is not remediated                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwindcss` (+ `braces`, `chokidar`, `fast-glob`, `micromatch`) | high     | `braces` flags every published version (`*`), so there is no patched release to upgrade to. The only remediation is Tailwind 4, which replaces the config format, the PostCSS plugin and the colour pipeline. That is the optional G8 branch, not merged. |
| `eslint-config-next` / `@next/eslint-plugin-next`                 | high     | The advisory is fixed in `eslint-config-next@14.2.35`, which is a _downgrade_ relative to the Next 15 line and would misconfigure the lint rules. Lint-time only.                                                                                         |

**Findings closed in this revision.** `vitest` / `tinypool` (critical) is gone — the suite moved to Vitest 5. `postcss-selector-parser` (moderate) is pinned to `^7.1.6` by an override, and the `@typescript-eslint` transitive chain is pinned to `^8.72.0` by two overrides, both recorded in `package.json`'s `overrides` block with a one-line reason each. `npm audit fix --force` was never used.

**One production finding was remediated earlier.** `next@15.5.28` pins `postcss@8.4.31`, affected by four PostCSS advisories. The `package.json` `overrides` block hoists it to the patched `8.5.31`:

```json
"overrides": {
  "postcss": "$postcss"
}
```

The build, the type check and the whole test suite pass with this override in place.

---

## 4. Privacy

- **No analytics, no telemetry, no third-party scripts.** The only outbound request the app can
  make is to its own `/api/*` routes.
- The plan, the preferences and any share fragment stay in the browser.
- The server logs route, status, duration and correlation id. It does not log bodies, prompts,
  plan contents or the user's words.
- When a live AI provider is configured, the text the user typed and a bounded plan summary are
  sent to that provider. The mode badge always tells the user which provider answered.
- **Basic mode sends nothing to a third party.** No provider is contacted and no key is needed.
  The ideas, chat and parse requests still reach this app's own server, which answers them from
  deterministic rules over the plan that was sent. The plan itself never leaves the browser.

---

## 5. Known gaps

These are deliberate and documented rather than hidden:

1. **Rate limiting is per-instance unless the shared store is configured.** This is closed by
   configuration rather than by code: the Upstash variables turn the shared limiter on. The live
   mode is reported by `GET /api/health` (`rateLimit: 'shared' | 'per-instance'`), and a
   production start without the variables logs one warning naming them. A deployment that has not
   set them is running the per-instance limiter, and says so.
2. **No authentication.** The app has no accounts, so there is nothing to authenticate. The AI
   routes are open to anyone who can reach them, which is why they are body-capped and rate
   limited.
3. **The AI routes are a cost risk for the operator.** Each request can cost money against a
   provider key. The rate limit bounds it, but a shared deployment should also set a provider-side
   budget.
4. **`localStorage` is readable by any script on the origin.** A Content-Security-Policy and
   `strict-dynamic` mitigate this, but there is no XSS-free guarantee available in a browser app.
   The plan contains no credentials by design.
5. **Share links are unauthenticated.** Anyone with the link can read the shared plan. They cannot
   modify the sender's plan - the link only carries data.
6. **No audit trail.** The app is single-user and browser-local; there is no history beyond the
   plan itself.

---

## 6. Reporting a vulnerability

Please report vulnerabilities privately to the project owner rather than opening a public issue.
Include the steps to reproduce, the affected route or file, and the impact you observed.
