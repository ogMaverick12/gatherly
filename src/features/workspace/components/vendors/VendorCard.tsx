'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import {
  buildWhatsAppLink,
  scoreQuote,
  VENDOR_CATEGORY_BUDGET_LINE,
} from '@/features/vendors/services';
import { formatMinor } from '@/lib/money';
import {
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_LABELS,
  type Vendor,
  type VendorStatus,
} from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import { FIELD_CLASS, VendorField } from './VendorField';
import { VendorQuoteScore } from './VendorQuoteScore';
import { useVendorDraft } from './use-vendor-draft';

/** One vendor: what is known about them, and what to do next. */
export function VendorCard({
  vendor,
  view,
  onUpdate,
}: {
  vendor: Vendor;
  view: PlanView;
  onUpdate: (id: string, patch: Partial<Vendor>) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const currency = view.plan.intake.currency;
  const draft = useVendorDraft(vendor, currency, onUpdate);

  const budgetLine = VENDOR_CATEGORY_BUDGET_LINE[vendor.category];
  const allocationMinor = view.allocationByCategory[budgetLine] ?? 0;
  const assessment = scoreQuote(vendor, allocationMinor, view.plan.intake.eventDate);
  const whatsapp = buildWhatsAppLink(
    { ...vendor, name: draft.name, phone: draft.phone },
    view.plan.intake.eventType,
  );

  return (
    <li className="rounded-card border border-line bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{VENDOR_CATEGORY_LABELS[vendor.category]}</h3>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-semibold text-ink">{t.workspace.quoteScore}</span>
          <span className="tabular-nums">{assessment.score}/100</span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            onChange={(event) =>
              onUpdate(vendor.id, { status: event.target.value as VendorStatus })
            }
            className={FIELD_CLASS}
          >
            {(Object.keys(VENDOR_STATUS_LABELS) as VendorStatus[]).map((status) => (
              <option key={status} value={status}>
                {VENDOR_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </VendorField>

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
      </div>

      <VendorQuoteScore assessment={assessment} />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {whatsapp.href ? (
          <a
            href={whatsapp.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-teal px-4 py-2 text-sm font-medium text-teal transition-colors duration-200 hover:bg-teal hover:text-paper"
          >
            {t.workspace.contact}
          </a>
        ) : (
          <span className="text-sm text-ink-muted">{whatsapp.reason ?? t.workspace.noPhone}</span>
        )}
        {vendor.quotedMinor !== null ? (
          <span className="text-sm text-ink-muted">
            {formatMinor(vendor.quotedMinor, currency)} / {formatMinor(allocationMinor, currency)}{' '}
            planned
          </span>
        ) : null}
      </div>
    </li>
  );
}
