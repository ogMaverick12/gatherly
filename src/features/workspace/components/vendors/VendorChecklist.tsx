'use client';

/**
 * The vendor checklist, grouped by the categories the event needs.
 * A category with no vendor shows an add button instead of an empty list.
 */

import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import type { Vendor, VendorCategoryId } from '@/lib/plan';
import type { PlanView } from '../../plan-view';
import { VendorCard } from './VendorCard';

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
              <h3>
                <SectionLabel size="sm">{category.label}</SectionLabel>
              </h3>
              {vendors.length === 0 ? (
                <Button
                  onClick={() => onAddVendor(category.category, '')}
                  variant="quiet"
                  size="compact"
                  className="mt-2 border border-dashed border-line-strong"
                >
                  {t.workspace.addVendor}
                </Button>
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
