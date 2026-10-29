/**
 * Client-side file download and clipboard helpers.
 * Both stay inert outside a browser, so callers need no environment check.
 */

/** Trigger a client-side file download without a server round trip. */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Copy text to the clipboard where the browser allows it.
 *
 * @param text the plain text to copy
 * @returns true when the copy succeeded, false when it did not
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the manual path below.
  }
  return false;
}
