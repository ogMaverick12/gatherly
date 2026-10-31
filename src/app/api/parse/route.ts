import { ParseRequestSchema, ParsedFieldsSchema } from '@/lib/api-schema';
import { selectProvider } from '@/lib/ai';
import { providerErrorNotice } from '@/lib/ai/notices';
import { generateJson } from '@/lib/ai/provider-json';
import { PARSE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { jsonResponse } from '@/lib/security/http';
import { createRoute } from '@/lib/security/route';
import { parseFreeText } from '@/features/assistant';
/** Node.js runtime: the provider adapters rely on Node APIs. */
export const runtime = 'nodejs';
/** Parse each request fresh; the result is never cached. */
export const dynamic = 'force-dynamic';

const BASIC_SUFFIX = 'so the deterministic parse is shown instead.';
/** POST /api/parse - free text to fields, never guessing what was not said. */
export const POST = createRoute({
  name: 'parse',
  schema: ParseRequestSchema,
  handler: async (body, { signal, complete }) => {
    const selection = selectProvider();
    const notices: string[] = [];
    const payload = {
      mode: 'basic' as const,
      provider: selection.provider.id,
      fields: parseFreeText(body.text),
    };

    if (!selection.live) {
      if (selection.notice) notices.push(selection.notice);
      return jsonResponse({ ...payload, notices, providerError: null });
    }

    const result = await generateJson({
      provider: selection.provider,
      schema: ParsedFieldsSchema,
      request: {
        intent: 'parse',
        systemPrompt: PARSE_SYSTEM_PROMPT,
        userText: body.text,
        planSummary: '',
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
      fields: result.data,
      notices,
      providerError: null,
    });
  },
});
