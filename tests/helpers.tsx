import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AccessibilityProvider } from '@/features/accessibility/provider';
import type { Intake } from '@/lib/plan';
import { computePlanView, type PlanView } from '@/lib/plan-view';
import { makePlan } from './factories';

export { makePlan, TEST_INTAKE } from './factories';

export function makeView(patch: Partial<Intake> = {}): PlanView {
  return computePlanView(makePlan(patch));
}

export function renderWithProvider(ui: ReactElement, options: Omit<RenderOptions, 'wrapper'> = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AccessibilityProvider>{children}</AccessibilityProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
