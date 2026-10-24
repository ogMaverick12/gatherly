import { BasicProvider } from './basic';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import type { Provider, ProviderId } from './provider';

export * from './provider';
export { BasicProvider } from './basic';
export { GeminiProvider } from './gemini';
export { OpenRouterProvider } from './openrouter';
export { buildUserMessage, SYSTEM_RULES } from './prompts';

export interface ProviderSelection {
  readonly provider: Provider;
  /** True when a live provider is configured and its key is present. */
  readonly live: boolean;
  /** Shown in the UI so the user always knows which mode answered. */
  readonly notice: string | null;
}

/**
 * Choose a provider from the environment.
 *
 * Basic mode is the default and the fallback: if the configured provider
 * has no key, or the call fails, the route answers deterministically and
 * says so.
 */
export function selectProvider(): ProviderSelection {
  const requested = (process.env['GATHERLY_AI_PROVIDER'] ?? 'basic').toLowerCase();
  const geminiKey = process.env['GEMINI_API_KEY'];
  const openRouterKey = process.env['OPENROUTER_API_KEY'];

  if (requested === 'gemini') {
    if (geminiKey) {
      return {
        provider: new GeminiProvider(
          geminiKey,
          process.env['GATHERLY_GEMINI_MODEL'] ?? 'gemini-2.0-flash',
        ),
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

  if (requested === 'openrouter') {
    if (openRouterKey) {
      return {
        provider: new OpenRouterProvider(
          openRouterKey,
          process.env['GATHERLY_OPENROUTER_MODEL'] ?? 'google/gemini-2.0-flash-001',
        ),
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

export function providerIdFor(selection: ProviderSelection): ProviderId {
  return selection.provider.id;
}
