import { z } from 'zod';

/**
 * The AI and rate-limit environment, in one place.
 *
 * This is the only module that reads these variables. Callers receive
 * validated values, so a typo in a provider name or a model id is a value the
 * app handles once instead of a different code path in every file.
 */

/** Google's listed replacement for gemini-2.0-flash, which shuts down on 1 June 2026. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

/** The current Google flash model on OpenRouter, checked 2026-10-24. */
export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-3.8-flash';

const ProviderName = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['basic', 'gemini', 'openrouter']))
  .catch('basic');

const EnvSchema = z.object({
  GATHERLY_AI_PROVIDER: ProviderName,
  GEMINI_API_KEY: z.string().trim().catch(''),
  OPENROUTER_API_KEY: z.string().trim().catch(''),
  GATHERLY_GEMINI_MODEL: z.string().trim().min(1).catch(DEFAULT_GEMINI_MODEL),
  GATHERLY_OPENROUTER_MODEL: z.string().trim().min(1).catch(DEFAULT_OPENROUTER_MODEL),
  UPSTASH_REDIS_REST_URL: z.string().trim().catch(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().catch(''),
});

export type AiProviderName = 'basic' | 'gemini' | 'openrouter';

/** The shape this module reads: any record of string values, like `process.env`. */
export type Env = Readonly<Record<string, string | undefined>>;

export interface AppConfig {
  readonly aiProvider: AiProviderName;
  readonly geminiApiKey: string;
  readonly openRouterApiKey: string;
  readonly geminiModel: string;
  readonly openRouterModel: string;
  readonly upstashUrl: string;
  readonly upstashToken: string;
}

/**
 * Read and validate the server environment.
 *
 * Parsed on every call rather than cached at import, so a test or a restarted
 * process observes the current values. An invalid value falls back to a safe
 * default instead of throwing on the first request.
 *
 * @param env the environment to read; defaults to `process.env`
 * @returns the validated configuration, with keys left empty when unset
 */
export function readConfig(env: Env = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);

  return {
    aiProvider: parsed.GATHERLY_AI_PROVIDER,
    geminiApiKey: parsed.GEMINI_API_KEY,
    openRouterApiKey: parsed.OPENROUTER_API_KEY,
    geminiModel: parsed.GATHERLY_GEMINI_MODEL,
    openRouterModel: parsed.GATHERLY_OPENROUTER_MODEL,
    upstashUrl: parsed.UPSTASH_REDIS_REST_URL,
    upstashToken: parsed.UPSTASH_REDIS_REST_TOKEN,
  };
}
