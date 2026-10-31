'use client';

/**
 * The vendors tab: coverage, the per-category checklist and the add form.
 * Updates are passed straight through to the workspace controller.
 */

import type { Vendor, VendorCategoryId } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import { AddVendorForm } from './vendors/AddVendorForm';
import { VendorChecklist } from './vendors/VendorChecklist';
import { VendorCoverage } from './vendors/VendorCoverage';

/** The vendors tab: coverage, the checklist per category, and a way to add one. */
export function VendorsPanel({
  view,
  onUpdateVendor,
  onAddVendor,
}: {
  view: PlanView;
  onUpdateVendor: (id: string, patch: Partial<Vendor>) => void;
  onAddVendor: (category: VendorCategoryId, name: string) => void;
}) {
  return (
    <div className="space-y-6">
      <VendorCoverage view={view} />
      <VendorChecklist view={view} onUpdateVendor={onUpdateVendor} onAddVendor={onAddVendor} />
      <AddVendorForm onAddVendor={onAddVendor} />
    </div>
  );
}
