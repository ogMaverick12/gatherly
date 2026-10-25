import { IdeasRequestSchema, ProviderIdeasSchema } from '@/lib/api-schema';
import { selectProvider } from '@/lib/ai';
import { providerErrorNotice } from '@/lib/ai/notices';
import { generateJson } from '@/lib/ai/provider-json';
import { IDEAS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { jsonResponse } from '@/lib/security/http';
import { createRoute } from '@/lib/security/route';
import { generateIdeas, providerIdeas } from '@/features/ideas/services';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASIC_SUFFIX = 'so the deterministic ideas are shown instead.';
/** POST /api/ideas - deterministic ideas, or a model's validated ideas. */
export const POST = createRoute({
  name: 'ideas',
  schema: IdeasRequestSchema,
  handler: async (body, { signal, complete }) => {
    const selection = selectProvider();
    const notices: string[] = [];
    const payload = {
      mode: 'basic' as const,
      provider: selection.provider.id,
      ideas: generateIdeas(body.context),
    };

    if (!selection.live) {
      if (selection.notice) notices.push(selection.notice);
      return jsonResponse({ ...payload, notices, providerError: null });
    }

    const result = await generateJson({
      provider: selection.provider,
      schema: ProviderIdeasSchema,
      request: {
        intent: 'ideas',
        systemPrompt: IDEAS_SYSTEM_PROMPT,
        userText: 'Give me ideas for this event.',
        planSummary: body.planSummary,
        basicAnswer: '',
        responseFormat: 'json',
        signal,
      },
    });

    if (!result.ok) {
      complete(result.kind);
      notices.push(providerErrorNotice(result.kind, BASIC_SUFFIX));
      return jsonResponse({ ...payload, notices, providerError: result.kind });
    }

    return jsonResponse({
      mode: 'provider',
      provider: selection.provider.id,
      ideas: providerIdeas(result.data.ideas),
      notices,
      providerError: null,
    });
  },
});
