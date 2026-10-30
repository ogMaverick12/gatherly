'use client';

import { useSyncExternalStore } from 'react';

/**
 * The wide layout breakpoint used by the workspace grid.
 * Kept in one place so the CSS breakpoint and the mounted rail cannot drift.
 */
const WIDE_QUERY = '(min-width: 64rem)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when the viewport can show the desktop health rail. */
export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
