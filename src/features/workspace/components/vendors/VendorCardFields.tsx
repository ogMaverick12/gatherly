'use client';

/**
 * The editable field groups on a vendor card.
 */

import type { Dictionary } from '@/lib/i18n';
import { VENDOR_STATUS_LABELS, type Currency, type Vendor, type VendorStatus } from '@/lib/plan';
import { FIELD_CLASS, VendorField } from './VendorField';
import type { VendorDraft } from './use-vendor-draft';

/** The vendor's name and status fields. */
export function VendorIdentityFields({
  vendor,
  draft,
  t,
  onUpdate,
}: {
  readonly vendor: Vendor;
  readonly draft: VendorDraft;
  readonly t: Dictionary;
  readonly onUpdate: (id: string, patch: Partial<Vendor>) => void;
}) {
  return (
    <>
      <VendorField id={`vendor-name-${vendor.id}`} label={t.workspace.vendorName}>
        <input
          id={`vendor-name-${vendor.id}`}
          type="text"
          value={draft.name}
          maxLength={120}
          onChange={(event) => draft.setName(event.target.value)}
          onBlur={() => onUpdate(vendor.id, { name: draft.name })}
          className={FIELD_CLASS}
        />
      </VendorField>

      <VendorField id={`vendor-status-${vendor.id}`} label={t.workspace.vendorStatus}>
        <select
          id={`vendor-status-${vendor.id}`}
          value={vendor.status}
          onChange={(event) => onUpdate(vendor.id, { status: event.target.value as VendorStatus })}
          className={FIELD_CLASS}
        >
          {(Object.keys(VENDOR_STATUS_LABELS) as VendorStatus[]).map((status) => (
            <option key={status} value={status}>
              {VENDOR_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </VendorField>
    </>
  );
}

/** The quote, due date, phone and notes fields. */
export function VendorScheduleFields({
  vendor,
  draft,
  t,
  currency,
  onUpdate,
}: {
  readonly vendor: Vendor;
  readonly draft: VendorDraft;
  readonly t: Dictionary;
  readonly currency: Currency;
  readonly onUpdate: (id: string, patch: Partial<Vendor>) => void;
}) {
  return (
    <>
      <VendorField
        id={`vendor-quote-${vendor.id}`}
        label={`${t.workspace.vendorQuote} (${currency})`}
      >
        <input
          id={`vendor-quote-${vendor.id}`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={draft.quote}
          onChange={(event) => draft.setQuote(event.target.value)}
          onBlur={draft.commitQuote}
          className={FIELD_CLASS}
        />
      </VendorField>

      <VendorField id={`vendor-due-${vendor.id}`} label={t.workspace.vendorDue}>
        <input
          id={`vendor-due-${vendor.id}`}
          type="date"
          value={vendor.dueDate ?? ''}
          onChange={(event) => onUpdate(vendor.id, { dueDate: event.target.value || null })}
          className={FIELD_CLASS}
        />
      </VendorField>

      <VendorField id={`vendor-phone-${vendor.id}`} label="Phone">
        <input
          id={`vendor-phone-${vendor.id}`}
          type="tel"
          inputMode="tel"
          value={draft.phone}
          maxLength={32}
          onChange={(event) => draft.setPhone(event.target.value)}
          onBlur={() => onUpdate(vendor.id, { phone: draft.phone })}
          className={FIELD_CLASS}
        />
      </VendorField>

      <VendorField id={`vendor-notes-${vendor.id}`} label={t.workspace.vendorNotes}>
        <input
          id={`vendor-notes-${vendor.id}`}
          type="text"
          value={draft.notes}
          maxLength={600}
          onChange={(event) => draft.setNotes(event.target.value)}
          onBlur={() => onUpdate(vendor.id, { notes: draft.notes })}
          className={FIELD_CLASS}
        />
      </VendorField>
    </>
  );
}
