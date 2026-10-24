import { IdeasRequestSchema, ProviderIdeasSchema } from '@/lib/api-schema';
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
  logRequest,
  readJsonBody,
  withTimeout,
} from '@/lib/security/guards';
import { extractJson, generateWithRetry, selectProvider } from '@/lib/ai';
import { kindOfFailure } from '@/lib/ai/errors';
import { providerErrorNotice } from '@/lib/ai/notices';
import type { ProviderErrorKind } from '@/lib/ai/provider';
import { IDEAS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { generateIdeas } from '@/features/ideas/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ideas
 *
 * Deterministic ideas in Basic mode. In provider mode the model answer is
 * schema-validated; if it does not validate, the deterministic ideas are
 * returned instead so the user always gets something usable.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let status = 200;
  let providerError: ProviderErrorKind | null = null;
  try {
    const rate = await enforceRateLimit(request, 'ideas');
    const body = await readJsonBody(request, IdeasRequestSchema);

    const selection = selectProvider();
    const notices: string[] = [];

    const basicIdeas = generateIdeas({
      guests: body.context.guests,
      eventType: body.context.eventType,
      cityTier: body.context.cityTier,
      priorities: body.context.priorities as never,
      dietary: body.context.dietary as never,
      month: body.context.month,
      currency: body.context.currency,
      budgetMinor: body.context.budgetMinor,
      perGuestMinor: body.context.perGuestMinor,
    });

    if (!selection.live) {
      if (selection.notice) notices.push(selection.notice);
      return jsonResponse(
        {
          mode: 'basic',
          provider: selection.provider.id,
          ideas: basicIdeas,
          notices,
          providerError,
        },
        { headers: rate.headers },
      );
    }

    try {
      const result = await withTimeout(
        generateWithRetry(selection.provider, {
          intent: 'ideas',
          systemPrompt: IDEAS_SYSTEM_PROMPT,
          userText: 'Give me ideas for this event.',
          planSummary: body.planSummary,
          basicAnswer: '',
          responseFormat: 'json',
        }),
      );

      const parsed = ProviderIdeasSchema.safeParse(extractJson(result.content));

      if (!parsed.success) {
        providerError = 'bad_output';
        notices.push(
          providerErrorNotice(providerError, 'so the deterministic ideas are shown instead.'),
        );
        return jsonResponse(
          {
            mode: 'basic',
            provider: selection.provider.id,
            ideas: basicIdeas,
            notices,
            providerError,
          },
          { headers: rate.headers },
        );
      }

      return jsonResponse(
        {
          mode: 'provider',
          provider: selection.provider.id,
          ideas: parsed.data.ideas.map((idea, index) => ({
            id: `provider-idea-${index + 1}`,
            title: idea.title,
            body: idea.body,
            rationale: idea.rationale,
            costImpactMinor: null,
            tags: idea.tags,
            source: 'provider' as const,
          })),
          notices,
          providerError,
        },
        { headers: rate.headers },
      );
    } catch (error) {
      providerError = kindOfFailure(error);
      notices.push(
        providerErrorNotice(providerError, 'so the deterministic ideas are shown instead.'),
      );
      return jsonResponse(
        {
          mode: 'basic',
          provider: selection.provider.id,
          ideas: basicIdeas,
          notices,
          providerError,
        },
        { headers: rate.headers },
      );
    }
  } catch (error) {
    const response = errorResponse(error);
    status = response.status;
    return response;
  } finally {
    logRequest('ideas', status, Date.now() - startedAt, request, providerError ?? undefined);
  }
}
