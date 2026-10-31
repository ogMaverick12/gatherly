import { describe, expect, it } from 'vitest';
import { AccessibilityProvider, ServiceWorkerRegistrar } from '@/features/accessibility/app-shell';
import { IntakeForm, IntakeHeading } from '@/features/intake/form-page';
import { LandingContent } from '@/features/workspace/landing-page';
import { PlanWorkspace } from '@/features/workspace/plan-page';
import { SiteFooter, SiteHeader } from '@/features/workspace/site-chrome';

/**
 * The app imports client-only entry points so a server page never pulls a whole
 * feature barrel. These are the public exports each entry point promises.
 */
describe('app client entry points', () => {
  it('expose the components the app shell and pages render', () => {
    const components = [
      AccessibilityProvider,
      ServiceWorkerRegistrar,
      IntakeForm,
      IntakeHeading,
      LandingContent,
      PlanWorkspace,
      SiteFooter,
      SiteHeader,
    ];

    for (const component of components) {
      expect(typeof component).toBe('function');
    }
  });
});
