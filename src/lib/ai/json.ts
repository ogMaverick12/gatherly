/**
 * Read a JSON value from a model answer.
 *
 * Models sometimes wrap the JSON they were asked for in a markdown fence, with
 * or without a language tag, and sometimes add a sentence around it. The first
 * fenced block is used when there is one; otherwise the whole answer is parsed.
 * Junk is `null` rather than a thrown error, so the caller's Zod schema rejects
 * it and the route keeps its fallback instead of failing.
 *
 * @param text the model answer
 * @returns the parsed value, or `null` when the answer holds no JSON
 */
export function extractJson(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fence?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}
