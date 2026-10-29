import { ChatRequestSchema } from '@/lib/api-schema';
import { selectProvider } from '@/lib/ai';
import { chatEventStream } from '@/lib/ai/chat-stream';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { createRoute } from '@/lib/security/route';
import { buildBasicAnswer, classifyIntent } from '@/features/assistant/services';

/** Node.js runtime: the provider adapters rely on Node APIs. */
export const runtime = 'nodejs';
/** Answer every request; a chat reply must never be cached. */
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 *
 * A stateless question and answer. The client sends the plan summary it
 * already holds, the server answers, and nothing is stored anywhere. The
 * answer is streamed, with the mode badge sent before the first token.
 */
export const POST = createRoute({
  name: 'chat',
  schema: ChatRequestSchema,
  handler: (body, { request, complete, deferLog }) => {
    const selection = selectProvider();
    const basicAnswer = buildBasicAnswer(classifyIntent(body.message), body.snapshot);

    // The request's log line belongs to the end of the stream, not to the
    // moment the response object is returned.
    deferLog();

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
      onComplete: (providerError) => complete(providerError ?? undefined),
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Accel-Buffering': 'no',
      },
    });
  },
});
