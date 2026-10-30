/**
 * Structured security logging.
 *
 * This is the only module that touches `console` directly. Every line is JSON
 * and sensitive field names are redacted before anything is written, so a
 * future caller cannot accidentally put a key or a user's words in the log.
 */

const SENSITIVE_KEY =
  /(api[-_]?key|authorization|token|secret|password|prompt|answer|user[-_]?text|email|phone)/i;

/** Replace values under sensitive keys and recurse into nested records. */
function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : redactValue(child),
      ]),
    );
  }
  return value;
}

/**
 * Write one warning line after redacting sensitive fields.
 *
 * @param event structured fields for this warning
 */
export function logWarn(event: Record<string, unknown>): void {
  console.warn(JSON.stringify(redactValue(event)));
}
