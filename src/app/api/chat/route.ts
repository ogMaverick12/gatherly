import { ChatRequestSchema, type ApiSnapshot } from '@/lib/api-schema';
import {
  enforceRateLimit,
  errorResponse,
  logRequest,
  readJsonBody,
  withTimeout,
} from '@/lib/security/guards';
import { generateWithRetry, selectProvider } from '@/lib/ai';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { buildBasicAnswer, classifyIntent } from '@/features/assistant/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 *
 * A stateless question and answer. The client sends the plan summary it
 * already holds, the server answers, and nothing is stored anywhere.
 * The response is an event stream so the client can show the mode badge
 * before the answer arrives.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let status = 200;
  try {
    const rate = await enforceRateLimit(request, 'chat');
    const body = await readJsonBody(request, ChatRequestSchema);
    const snapshot = body.snapshot as ApiSnapshot;

    const selection = selectProvider();
    const basicAnswer = buildBasicAnswer(classifyIntent(body.message), snapshot);
    const notices: string[] = [];

    let mode: 'basic' | 'provider' = 'basic';
    let content = basicAnswer;

    if (selection.live) {
      try {
        const result = await withTimeout(
          generateWithRetry(selection.provider, {
            intent: 'chat',
            systemPrompt: CHAT_SYSTEM_PROMPT,
            userText: body.message,
            planSummary: body.planSummary,
            basicAnswer,
          }),
        );
        content = result.content;
        mode = 'provider';
        notices.push(...result.notices);
      } catch {
        notices.push('The AI provider could not be reached, so this answer comes from Basic mode.');
      }
    } else if (selection.notice) {
      notices.push(selection.notice);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        send('mode', { provider: selection.provider.id, live: selection.live });
        send('delta', { text: content });
        send('done', { mode, notices });
        controller.close();
      },
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
    status = response.status;
    return response;
  } finally {
    logRequest('chat', status, Date.now() - startedAt, request);
  }
}
