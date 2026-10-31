import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { OverviewPanel, computePlanView } from '@/features/workspace';
import { DEFAULT_PREFERENCES, writeStoredPreferences } from '@/features/accessibility';
import { todayDateOnly } from '@/lib/dates';
import { DICTIONARIES } from '@/lib/i18n';
import {
  ACCESS_LABELS,
  ACCESS_NEEDS,
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  DIETARY_LABELS,
  DIETARY_NEEDS,
  PRIORITIES,
  PRIORITY_LABELS,
  SAMPLE_PLAN_TEMPLATES,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  createSamplePlan,
  type Language,
} from '@/lib/plan';
import { renderWithProvider } from '../helpers';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const LANGUAGES: readonly Language[] = ['en', 'hi', 'bn'];

/** Ids whose displayed label is different enough that seeing the id would be raw. */
function rawIds(): string[] {
  const vocabulary: readonly (readonly [string, string])[] = [
    ...ACCESS_NEEDS.map((id) => [id, ACCESS_LABELS[id]] as const),
    ...DIETARY_NEEDS.map((id) => [id, DIETARY_LABELS[id]] as const),
    ...PRIORITIES.map((id) => [id, PRIORITY_LABELS[id]] as const),
    ...BUDGET_CATEGORIES.map((id) => [id, BUDGET_CATEGORY_LABELS[id]] as const),
    ...VENDOR_CATEGORIES.map((id) => [id, VENDOR_CATEGORY_LABELS[id]] as const),
  ];
  return vocabulary.filter(([id, label]) => !label.toLowerCase().includes(id)).map(([id]) => id);
}

describe('the sample overview labels', () => {
  it('never prints a raw access, dietary, priority or category id', async () => {
    const template = SAMPLE_PLAN_TEMPLATES[0];
    expect(template).toBeDefined();
    if (!template) return;

    const plan = createSamplePlan(template, NOW);
    const view = computePlanView(plan, todayDateOnly(NOW));
    const checked = rawIds();

    for (const language of LANGUAGES) {
      writeStoredPreferences({ ...DEFAULT_PREFERENCES, language });
      const { unmount } = renderWithProvider(
        <OverviewPanel view={view} onToggleTask={() => undefined} />,
      );
      await screen.findByRole('heading', { name: DICTIONARIES[language].workspace.risks });
      const text = document.body.textContent ?? '';
      for (const id of checked) {
        expect(text, `${language}: ${id}`).not.toContain(id);
      }
      expect(text, `${language}: planning prefix`).not.toContain('planning:');
      unmount();
    }
  });
});
