'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { Vendor, VendorCategoryId } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import { VendorCard } from './VendorCard';

// long-function: one view section, kept in one block so its reading order stays visible.
/** Every category the event needs, with the vendors recorded against it. */
export function VendorChecklist({
  view,
  onUpdateVendor,
  onAddVendor,
}: {
  view: PlanView;
  onUpdateVendor: (id: string, patch: Partial<Vendor>) => void;
  onAddVendor: (category: VendorCategoryId, name: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="checklist-heading">
      <h2 id="checklist-heading" className="font-display text-title">
        {t.workspace.vendorsChecklist}
      </h2>

      <ul className="mt-3 space-y-3">
        {view.coverage.categories.map((category) => {
          const vendors = view.plan.vendors.filter(
            (vendor) => vendor.category === category.category,
          );
          return (
            <li key={category.category}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {category.label}
              </h3>
              {vendors.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onAddVendor(category.category, '')}
                  className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-pill border border-dashed border-line-strong px-4 py-2 text-sm text-ink-muted transition-colors duration-200 hover:border-ink hover:text-ink"
                >
                  {t.workspace.addVendor}
                </button>
              ) : (
                <ul className="mt-2 space-y-3">
                  {vendors.map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      view={view}
                      onUpdate={onUpdateVendor}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
