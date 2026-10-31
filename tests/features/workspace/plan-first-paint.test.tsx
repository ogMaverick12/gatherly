import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AccessibilityProvider } from '@/features/accessibility';
import { PlanWorkspace } from '@/features/workspace';

describe('the plan page first paint', () => {
  it('renders a neutral skeleton instead of claiming there is no plan', () => {
    const html = renderToString(
      <AccessibilityProvider>
        <PlanWorkspace />
      </AccessibilityProvider>,
    );

    expect(html).toContain('Loading your plan');
    expect(html).not.toContain('There is no plan yet.');
  });
});
