'use client';

/**
 * One vendor card: the fields, the quote score and the contact link.
 * Edits stay local until a field loses focus, then are reported as a patch.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import {
  buildWhatsAppLink,
  scoreQuote,
  VENDOR_CATEGORY_BUDGET_LINE,
  type WhatsAppLink,
} from '@/features/vendors/services';
import type { Dictionary } from '@/lib/i18n';
import { formatMinor } from '@/lib/money';
import { VENDOR_CATEGORY_LABELS, type Currency, type Vendor } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import { VendorQuoteScore } from './VendorQuoteScore';
import { useVendorDraft } from './use-vendor-draft';
import { VendorIdentityFields, VendorScheduleFields } from './vendor-card-fields';

/** The category title and quote score line. */
function VendorCardHeader({
  category,
  score,
  t,
}: {
  readonly category: Vendor['category'];
  readonly score: number;
  readonly t: Dictionary;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold text-ink">{VENDOR_CATEGORY_LABELS[category]}</h3>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="font-semibold text-ink">{t.workspace.quoteScore}</span>
        <span className="tabular-nums">{score}/100</span>
      </div>
    </div>
  );
}

/** The contact link and quote-versus-plan line. */
function VendorFooter({
  whatsapp,
  quotedMinor,
  allocationMinor,
  currency,
  t,
}: {
  readonly whatsapp: WhatsAppLink;
  readonly quotedMinor: number | null;
  readonly allocationMinor: number;
  readonly currency: Currency;
  readonly t: Dictionary;
}) {
  return (
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
      {quotedMinor !== null ? (
        <span className="text-sm text-ink-muted">
          {formatMinor(quotedMinor, currency)} / {formatMinor(allocationMinor, currency)} planned
        </span>
      ) : null}
    </div>
  );
}

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
      <VendorCardHeader category={vendor.category} score={assessment.score} t={t} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <VendorIdentityFields vendor={vendor} draft={draft} t={t} onUpdate={onUpdate} />
        <VendorScheduleFields
          vendor={vendor}
          draft={draft}
          t={t}
          currency={currency}
          onUpdate={onUpdate}
        />
      </div>

      <VendorQuoteScore assessment={assessment} />

      <VendorFooter
        whatsapp={whatsapp}
        quotedMinor={vendor.quotedMinor}
        allocationMinor={allocationMinor}
        currency={currency}
        t={t}
      />
    </li>
  );
}
