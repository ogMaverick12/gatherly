'use client';

/**
 * Registers the service worker after the page has loaded.
 * Failure is ignored: the app works without the offline cache.
 */

import { useEffect } from 'react';

/**
 * Registers the service worker that keeps the app shell available offline.
 *
 * Registration happens after the page has loaded so it never competes with
 * the first interaction, and a failure is ignored: the app works without it.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
