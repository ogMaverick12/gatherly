import { ParseRequestSchema, ParsedFieldsSchema, type ParsedFields } from '@/lib/api-schema';
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
  logRequest,
  readJsonBody,
  withTimeout,
} from '@/lib/security/guards';
import { generateWithRetry, selectProvider } from '@/lib/ai';
import { PARSE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { parseFreeText } from '@/features/assistant/parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/parse
 *
 * Turns free text into plan fields.
 *
 * Two rules hold on both paths: nothing is inferred about identity,
 * religion, community or region, and every field the user did not state
 * is left empty rather than guessed.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let status = 200;
  try {
    const rate = await enforceRateLimit(request, 'parse');
    const body = await readJsonBody(request, ParseRequestSchema);

    const selection = selectProvider();
    const notices: string[] = [];

    if (!selection.live) {
      if (selection.notice) notices.push(selection.notice);
      const fields: ParsedFields = parseFreeText(body.text);
      return jsonResponse(
        { mode: 'basic', provider: selection.provider.id, fields, notices },
        { headers: rate.headers },
      );
    }

    try {
      const result = await withTimeout(
        generateWithRetry(selection.provider, {
          intent: 'parse',
          systemPrompt: PARSE_SYSTEM_PROMPT,
          userText: body.text,
          planSummary: '',
          basicAnswer: '',
          responseFormat: 'json',
        }),
      );

      const parsed = ParsedFieldsSchema.safeParse(JSON.parse(result.content) as unknown);

      if (!parsed.success) {
        notices.push(
          'The AI answer did not match the expected shape, so the deterministic parse is shown instead.',
        );
        const fields: ParsedFields = parseFreeText(body.text);
        return jsonResponse(
          { mode: 'basic', provider: selection.provider.id, fields, notices },
          { headers: rate.headers },
        );
      }

      return jsonResponse(
        { mode: 'provider', provider: selection.provider.id, fields: parsed.data, notices },
        { headers: rate.headers },
      );
    } catch {
      notices.push(
        'The AI provider could not be reached, so the deterministic parse is shown instead.',
      );
      const fields: ParsedFields = parseFreeText(body.text);
      return jsonResponse(
        { mode: 'basic', provider: selection.provider.id, fields, notices },
        { headers: rate.headers },
      );
    }
  } catch (error) {
    const response = errorResponse(error);
    status = response.status;
    return response;
  } finally {
    logRequest('parse', status, Date.now() - startedAt, request);
  }
}
