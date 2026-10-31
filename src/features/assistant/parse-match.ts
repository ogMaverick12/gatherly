/**
 * Matching helpers for the parser's published keyword tables.
 *
 * They only look for words already in a table; nothing is inferred.
 */

/**
 * Return the first table value whose words occur in the text.
 *
 * @param text the lower-cased input
 * @param table the keyword table to scan in order
 * @returns the matching value, or null
 */
export function matchFirst<T>(
  text: string,
  table: readonly { value: T; words: readonly string[] }[],
): T | null {
  for (const entry of table) {
    for (const word of entry.words) {
      if (text.includes(word)) return entry.value;
    }
  }
  return null;
}

/**
 * Return every distinct table value whose words occur in the text.
 *
 * @param text the lower-cased input
 * @param table the keyword table to scan in order
 * @returns the matching values, in table order
 */
export function matchAll<T>(
  text: string,
  table: readonly { value: T; words: readonly string[] }[],
): T[] {
  const found: T[] = [];
  for (const entry of table) {
    const matched = entry.words.some((word) => text.includes(word));
    if (matched && !found.includes(entry.value)) found.push(entry.value);
  }
  return found;
}
