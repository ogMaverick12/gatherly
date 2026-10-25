import { ChatRequestSchema, type ApiSnapshot } from '@/lib/api-schema';
import { enforceRateLimit, errorResponse, logRequest, readJsonBody } from '@/lib/security/guards';
import { selectProvider } from '@/lib/ai';
import { chatEventStream } from '@/lib/ai/chat-stream';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { buildBasicAnswer, classifyIntent } from '@/features/assistant/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 *
 * A stateless question and answer. The client sends the plan summary it
 * already holds, the server answers, and nothing is stored anywhere.
 * The answer is streamed: the mode badge is sent before the provider has
 * produced anything, then each chunk as it arrives.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  try {
    const rate = await enforceRateLimit(request, 'chat');
    const body = await readJsonBody(request, ChatRequestSchema);
    const snapshot = body.snapshot as ApiSnapshot;

    const selection = selectProvider();
    const basicAnswer = buildBasicAnswer(classifyIntent(body.message), snapshot);

    const stream = chatEventStream({
      provider: selection.provider,
      live: selection.live,
      selectionNotice: selection.notice,
      basicAnswer,
      clientSignal: request.signal,
      request: {
        intent: 'chat',
        systemPrompt: CHAT_SYSTEM_PROMPT,
        userText: body.message,
        planSummary: body.planSummary,
        basicAnswer,
      },
      // The log line is written when the stream ends, so it can carry the
      // failure kind and the real duration of the answer.
      onComplete: (providerError) =>
        logRequest('chat', 200, Date.now() - startedAt, request, providerError ?? undefined),
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Accel-Buffering': 'no',
        ...rate.headers,
      },
    });
  } catch (error) {
    const response = errorResponse(error);
    logRequest('chat', response.status, Date.now() - startedAt, request);
    return response;
  }
}
