/**
 * The AI entry point: provider selection and the public re-exports.
 * Routes call `selectProvider` and never construct an adapter themselves.
 */
import { readConfig } from './config';
import { BasicProvider } from './basic';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import type { Provider } from './provider';

/** The provider chosen for one request and the mode shown to the user. */
export interface ProviderSelection {
  readonly provider: Provider;
  /** True when a live provider is configured and its key is present. */
  readonly live: boolean;
  /** Shown in the UI so the user always knows which mode answered. */
  readonly notice: string | null;
}

/**
 * Choose a provider from the validated environment.
 *
 * Basic mode is the default and the fallback: if the configured provider
 * has no key, or the call fails, the route answers deterministically and
 * says so.
 */
export function selectProvider(): ProviderSelection {
  const config = readConfig();

  if (config.aiProvider === 'gemini') {
    if (config.geminiApiKey) {
      return {
        provider: new GeminiProvider(config.geminiApiKey, config.geminiModel),
        live: true,
        notice: null,
      };
    }
    return {
      provider: new BasicProvider(),
      live: false,
      notice: 'No Gemini key is configured, so answers come from Basic mode.',
    };
  }

  if (config.aiProvider === 'openrouter') {
    if (config.openRouterApiKey) {
      return {
        provider: new OpenRouterProvider(config.openRouterApiKey, config.openRouterModel),
        live: true,
        notice: null,
      };
    }
    return {
      provider: new BasicProvider(),
      live: false,
      notice: 'No OpenRouter key is configured, so answers come from Basic mode.',
    };
  }

  return {
    provider: new BasicProvider(),
    live: false,
    notice: 'GATHERLY_AI_PROVIDER is set to basic, so answers come from Basic mode.',
  };
}
