import type { z } from 'zod';
import { HttpError } from './guards';

/**
 * JSON responses and body reading for the API routes.
 *
 * Every response here is marked `no-store`: a plan is never shared between
 * requests, so a proxy or the service worker must never keep a copy.
 */

export const MAX_BODY_BYTES = 16 * 1024;

/** The one cache directive every API response carries. */
export const NO_STORE = 'no-store, no-cache, must-revalidate';

/**
 * A JSON response with the headers every route must send.
 *
 * @param data the body to serialise
 * @param init the status and any extra headers
 * @returns the response
 */
export function jsonResponse(
  data: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': NO_STORE,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...init.headers,
    },
  });
}

/**
 * Turn anything a route caught into a response.
 *
 * An `HttpError` keeps its status and details; any other error becomes a
 * generic 500, so an internal message never reaches the client.
 *
 * @param error the thrown value
 * @returns the response to send
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.message, details: error.details ?? null },
      { status: error.status, headers: error.headers },
    );
  }
  return jsonResponse(
    { error: 'Something went wrong. Please try again.', details: null },
    { status: 500 },
  );
}

/** Check the declared length before reading any bytes. */
function declaredLengthExceeds(request: Request, maxBytes: number): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return false;
  const declared = Number(contentLength);
  return Number.isFinite(declared) && declared > maxBytes;
}

/** Read all chunks, stopping as soon as the body is over the cap. */
async function readChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maxBytes: number,
): Promise<{ chunks: Uint8Array[]; total: number }> {
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return { chunks, total };
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new HttpError(413, 'That request is too large.');
    }
    chunks.push(value);
  }
}

/** Decode the chunks into one UTF-8 string. */
function decodeChunks(chunks: readonly Uint8Array[], total: number): string {
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string> {
  if (declaredLengthExceeds(request, maxBytes)) {
    throw new HttpError(413, 'That request is too large.');
  }
  if (!request.body) return '';
  const { chunks, total } = await readChunks(request.body.getReader(), maxBytes);
  return decodeChunks(chunks, total);
}

/**
 * Read, cap and validate a JSON body.
 *
 * The size cap is enforced before the JSON parser sees the bytes, and the
 * schema decides what the handler is allowed to receive.
 *
 * @param request the incoming request
 * @param schema the Zod schema the body must match
 * @param maxBytes the body size cap
 * @returns the validated body
 */
export async function readJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
  maxBytes = MAX_BODY_BYTES,
): Promise<z.infer<TSchema>> {
  const raw = await readBodyWithLimit(request, maxBytes);
  if (raw.trim() === '') {
    throw new HttpError(400, 'A JSON body is required.');
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'That body is not valid JSON.');
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new HttpError(400, 'Please check the values you sent.', {
      fields: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}
