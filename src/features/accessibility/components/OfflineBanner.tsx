'use client';

/**
 * A banner shown while the browser is offline.
 * It explains that the plan still works and only the AI routes are affected.
 */

import { useEffect, useState } from 'react';
import { useAccessibility } from '../AccessibilityProvider';

/**
 * Offline banner.
 *
 * The plan is entirely in the browser, so being offline changes nothing
 * except the availability of the AI routes. The banner says that plainly.
 */
export function OfflineBanner() {
  const { dictionary } = useAccessibility();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <p
      role="status"
      className="mt-4 rounded-card border border-marigold bg-marigold/10 px-4 py-3 text-sm text-ink"
    >
      {dictionary.workspace.offline}
    </p>
  );
}
