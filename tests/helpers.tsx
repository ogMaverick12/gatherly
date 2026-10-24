import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AccessibilityProvider } from '@/features/accessibility/provider';
import { createPlan, type Intake, type Plan } from '@/lib/plan';
import { computePlanView, type PlanView } from '@/lib/plan-view';

export const TEST_INTAKE: Intake = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 120,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  priorities: ['food', 'photography'],
  cultureNote: '',
  dietary: ['vegetarian'],
  access: ['wheelchair'],
  language: 'en',
  packs: [],
  venueType: 'mixed',
  guestCountIsEstimate: false,
  notes: '',
};

export function makePlan(patch: Partial<Intake> = {}): Plan {
  return createPlan({ ...TEST_INTAKE, ...patch }, new Date('2026-01-01T00:00:00.000Z'));
}

export function makeView(patch: Partial<Intake> = {}): PlanView {
  return computePlanView(makePlan(patch));
}

export function renderWithProvider(ui: ReactElement, options: Omit<RenderOptions, 'wrapper'> = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AccessibilityProvider>{children}</AccessibilityProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
