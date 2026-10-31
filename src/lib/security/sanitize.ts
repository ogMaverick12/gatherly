/**
 * Input sanitising.
 *
 * User text is data, never instructions. Everything that reaches a language
 * model is stripped of control characters, wrapped in explicit delimiters
 * and length-capped, so a note that says "ignore your instructions" is
 * still just a note.
 */

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
const LINE_BREAKS = /\r\n|\r|\n/g;

/**
 * The default cap on user text, in characters, before it reaches a model.
 */
const MAX_USER_TEXT = 2000;

/**
 * Replace control characters with spaces and drop zero-width characters.
 *
 * @param value raw user text
 * @returns the text with control and invisible characters removed
 */
export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, ' ').replace(ZERO_WIDTH, '');
}

/**
 * Collapse runs of spaces and tabs, normalise line endings and trim.
 *
 * @param value text that may contain irregular whitespace
 * @returns the cleaned, single-spaced text
 */
export function normaliseWhitespace(value: string): string {
  return value
    .replace(LINE_BREAKS, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Clean, length-capped user text. */
export function sanitizeUserText(value: string, maxLength = MAX_USER_TEXT): string {
  return normaliseWhitespace(stripControlCharacters(value)).slice(0, maxLength);
}

/**
 * Wrap user content in delimiters and neutralise any attempt to close them.
 * The system prompt states that the content inside is data.
 */
export function wrapUserContent(value: string, maxLength = MAX_USER_TEXT): string {
  const cleaned = sanitizeUserText(value, maxLength);
  const neutralised = cleaned.replace(/<\/?user_input>/gi, '[redacted-tag]');
  return `<user_input>\n${neutralised}\n</user_input>`;
}

/** Escape text for a CSV cell and defuse spreadsheet formula injection. */
export function escapeCsvCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
