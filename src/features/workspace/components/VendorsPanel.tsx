'use client';

import { useEffect, useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanView } from '@/lib/plan-view';
import {
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_LABELS,
  type Vendor,
  type VendorCategoryId,
  type VendorStatus,
} from '@/lib/plan';
import { formatMinor, fromMajorUnits, toMajorUnits } from '@/lib/money';
import {
  buildWhatsAppLink,
  scoreQuote,
  VENDOR_CATEGORY_BUDGET_LINE,
} from '@/features/vendors/services';

const FIELD_CLASS =
  'mt-1 w-full min-h-[44px] rounded-card border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70';

function VendorCard({
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

  const [name, setName] = useState(vendor.name);
  const [quote, setQuote] = useState(
    vendor.quotedMinor === null ? '' : String(toMajorUnits(vendor.quotedMinor, currency)),
  );
  const [phone, setPhone] = useState(vendor.phone);
  const [notes, setNotes] = useState(vendor.notes);

  useEffect(() => {
    setName(vendor.name);
    setQuote(vendor.quotedMinor === null ? '' : String(toMajorUnits(vendor.quotedMinor, currency)));
    setPhone(vendor.phone);
    setNotes(vendor.notes);
  }, [vendor.name, vendor.quotedMinor, vendor.phone, vendor.notes, currency]);

  const budgetLine = VENDOR_CATEGORY_BUDGET_LINE[vendor.category];
  const allocationMinor = view.allocationByCategory[budgetLine] ?? 0;
  const assessment = scoreQuote(vendor, allocationMinor, view.plan.intake.eventDate);
  const whatsapp = buildWhatsAppLink({ ...vendor, name, phone }, view.plan.intake.eventType);

  const commitQuote = () => {
    const trimmed = quote.trim();
    if (trimmed === '') {
      onUpdate(vendor.id, { quotedMinor: null });
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setQuote(
        vendor.quotedMinor === null ? '' : String(toMajorUnits(vendor.quotedMinor, currency)),
      );
      return;
    }
    onUpdate(vendor.id, { quotedMinor: fromMajorUnits(parsed, currency) });
  };

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
        <div>
          <label
            htmlFor={`vendor-name-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {t.workspace.vendorName}
          </label>
          <input
            id={`vendor-name-${vendor.id}`}
            type="text"
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => onUpdate(vendor.id, { name })}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor={`vendor-status-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {t.workspace.vendorStatus}
          </label>
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
        </div>

        <div>
          <label
            htmlFor={`vendor-quote-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {t.workspace.vendorQuote} ({currency})
          </label>
          <input
            id={`vendor-quote-${vendor.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            onBlur={commitQuote}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor={`vendor-due-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {t.workspace.vendorDue}
          </label>
          <input
            id={`vendor-due-${vendor.id}`}
            type="date"
            value={vendor.dueDate ?? ''}
            onChange={(event) => onUpdate(vendor.id, { dueDate: event.target.value || null })}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor={`vendor-phone-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            Phone
          </label>
          <input
            id={`vendor-phone-${vendor.id}`}
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={32}
            onChange={(event) => setPhone(event.target.value)}
            onBlur={() => onUpdate(vendor.id, { phone })}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor={`vendor-notes-${vendor.id}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {t.workspace.vendorNotes}
          </label>
          <input
            id={`vendor-notes-${vendor.id}`}
            type="text"
            value={notes}
            maxLength={600}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => onUpdate(vendor.id, { notes })}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <details className="mt-3 rounded-card border border-line bg-paper p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          {t.workspace.quoteScore}: {assessment.score}/100
        </summary>
        <ul className="mt-2 space-y-1.5">
          {assessment.components.map((component) => (
            <li key={component.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{component.label}</span>
                <span className="tabular-nums text-ink-muted">
                  {component.earned}/{component.max}
                </span>
              </div>
              <p className="text-xs text-ink-muted">{component.detail}</p>
            </li>
          ))}
        </ul>
      </details>

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

export function VendorsPanel({
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
  const [newCategory, setNewCategory] = useState<VendorCategoryId>('venue');
  const [newName, setNewName] = useState('');

  return (
    <div className="space-y-6">
      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="font-display text-title">
          {t.workspace.coverage}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {view.coverage.overallPercent}% of the planned vendor budget is booked.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {view.coverage.categories.map((category) => (
            <li
              key={category.category}
              className="rounded-card border border-line bg-raised px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{category.label}</span>
                <span className="tabular-nums text-sm text-ink-muted">
                  {category.coveragePercent}%
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-line"
                role="presentation"
              >
                <div
                  className="h-full rounded-pill bg-teal"
                  style={{ width: `${Math.max(2, category.coveragePercent)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {category.hasVendor
                  ? VENDOR_STATUS_LABELS[category.status as VendorStatus]
                  : t.common.none}
              </p>
            </li>
          ))}
        </ul>
      </section>

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
            <label
              htmlFor="new-vendor-category"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
            >
              {t.workspace.vendorCategory}
            </label>
            <select
              id="new-vendor-category"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value as VendorCategoryId)}
              className="mt-1 min-h-[44px] rounded-card border border-line bg-paper px-3 py-2 text-sm"
            >
              {(Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategoryId[]).map((category) => (
                <option key={category} value={category}>
                  {VENDOR_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[12rem] flex-1">
            <label
              htmlFor="new-vendor-name"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
            >
              {t.workspace.vendorName}
            </label>
            <input
              id="new-vendor-name"
              type="text"
              value={newName}
              maxLength={120}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="optional"
              className="mt-1 w-full min-h-[44px] rounded-card border border-line bg-paper px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-5 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            {t.workspace.addVendor}
          </button>
        </form>
      </section>
    </div>
  );
}
