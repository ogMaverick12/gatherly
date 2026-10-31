/**
 * Public accessibility API.
 *
 * The provider and hooks are client-only; the app shell mounts the provider
 * and every feature reads preferences through the hook.
 */

export { AccessibilityProvider, useAccessibility } from './provider';
export { DEFAULT_PREFERENCES, writeStoredPreferences } from './preferences';
export { DisplaySettings } from './components/DisplaySettings';
export { OfflineBanner } from './components/OfflineBanner';
export { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar';
