# Live verification

What was actually observed, and when. Nothing in this file is a plan or an intention: every line
records a command that was run.

## The live AI path

| Date       | Providers with a key      | Result                                    |
| ---------- | ------------------------- | ----------------------------------------- |
| 2026-10-22 | none in this working tree | Both providers skipped, no live call made |

`node scripts/live-smoke.mjs` reads `GEMINI_API_KEY` and `OPENROUTER_API_KEY` from the
environment. Neither was set here, so the script reported:

```text
Live smoke test. Providers with a key: none.

gemini: no GEMINI_API_KEY in the environment, skipped.

openrouter: no OPENROUTER_API_KEY in the environment, skipped.

All live checks passed or were skipped.
```

The live path is therefore **unproven in this environment**. To prove it, put a key in the
environment and run the script again. It starts a production build with one provider at a time and
checks three things for each of `/api/parse`, `/api/ideas` and `/api/chat`:

1. the answer says the provider answered (`mode` is `provider`, `provider` is the provider id),
2. the answer has the shape the route promises, checked field by field against
   `src/lib/api-schema.ts`,
3. the key does not appear anywhere in the answer.

The keys are never printed, and the script never writes them to disk.

### What was checked without a key

| Check                                                         | How                                                  | Result                                                                                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| The Gemini request shape matches the installed SDK            | `node_modules/@google/genai` 2.30.0 type definitions | Pass - `systemInstruction`, `responseMimeType`, `maxOutputTokens`, `temperature` and `abortSignal` are all fields of `GenerateContentConfig`     |
| The Gemini model id is one the SDK documents                  | The SDK's own examples in `genai.d.ts`               | Pass - `gemini-2.0-flash` is the id the SDK uses in its examples                                                                                 |
| The OpenRouter request shape matches the chat-completions API | `POST https://openrouter.ai/api/v1/chat/completions` | Pass - `model`, `temperature`, `max_tokens`, `messages` and `response_format` are sent, and the answer is read from `choices[0].message.content` |
| Basic mode still works with no key                            | `npm run test`, `npm run test:e2e`                   | Pass - every route falls back to Basic mode and says so                                                                                          |

### What still needs a key

| Route        | What an unproven answer would look like                                        | Status           |
| ------------ | ------------------------------------------------------------------------------ | ---------------- |
| `/api/parse` | `mode` is `provider`, `fields` matches `ParsedFieldsSchema`                    | Not run - no key |
| `/api/ideas` | `mode` is `provider`, every idea has a title, body and tags                    | Not run - no key |
| `/api/chat`  | the stream says `provider`, then a `delta`, then `done` with `mode` `provider` | Not run - no key |

## The dependency audit

| Command                | Result                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm audit --omit=dev` | 0 vulnerabilities                                                                                             |
| `npm audit`            | Findings in the development toolchain only; listed in [`../SECURITY.md`](../SECURITY.md#3-dependency-posture) |

## The rate-limit mode

| Date       | Command                           | Result                                                                                                                                  |
| ---------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-22 | `GET /api/health` (via the tests) | `rateLimit: 'per-instance'` when the Upstash variables are missing, `shared` when both are set — both modes tested, no network involved |
| 2026-10-22 | `npm run build`                   | Succeeds; `/api/health` is included in the route table at 133 B / 103 kB first-load JS                                                  |

No deployment of this app exists yet, so the `shared` mode has not been observed live. The owner sets
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` by hand on the deployment; once deployed,
`GET /api/health` is expected to report `shared`, and that observation belongs here. Until then the
local build runs the documented per-instance default, and `SECURITY.md` says so explicitly.
