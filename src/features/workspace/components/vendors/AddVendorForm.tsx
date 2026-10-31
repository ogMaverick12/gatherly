'use client';

/**
 * The manual add-vendor form at the bottom of the vendors tab.
 * It only reports the chosen category and trimmed name; the workspace owns the write.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import { VENDOR_CATEGORY_LABELS, type VendorCategoryId } from '@/lib/plan';

// long-function: one view section, kept in one block so its reading order stays visible.
/** Adding a vendor by hand, for a category the plan did not list. */
export function AddVendorForm({
  onAddVendor,
}: {
  onAddVendor: (category: VendorCategoryId, name: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const [newCategory, setNewCategory] = useState<VendorCategoryId>('venue');
  const [newName, setNewName] = useState('');

  return (
    <section aria-labelledby="add-vendor-heading" className="no-print">
      <h2 id="add-vendor-heading" className="font-display text-title">
        {t.workspace.addVendor}
      </h2>
      <form
        className="mt-3 flex flex-wrap items-end gap-3 rounded-card border border-line bg-raised p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const name = newName.trim();
          onAddVendor(newCategory, name);
          setNewName('');
        }}
      >
        <div>
          <label htmlFor="new-vendor-category">
            <SectionLabel>{t.workspace.vendorCategory}</SectionLabel>
          </label>
          <select
            id="new-vendor-category"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value as VendorCategoryId)}
            className="mt-1 min-h-11 rounded-card border border-line bg-paper px-3 py-2 text-sm"
          >
            {(Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategoryId[]).map((category) => (
              <option key={category} value={category}>
                {VENDOR_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="new-vendor-name">
            <SectionLabel>{t.workspace.vendorName}</SectionLabel>
          </label>
          <input
            id="new-vendor-name"
            type="text"
            value={newName}
            maxLength={120}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="optional"
            className="mt-1 w-full min-h-11 rounded-card border border-line bg-paper px-3 py-2 text-sm"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          tone="ink"
          size="none"
          className="px-5 py-2 text-sm font-semibold"
        >
          {t.workspace.addVendor}
        </Button>
      </form>
    </section>
  );
}
