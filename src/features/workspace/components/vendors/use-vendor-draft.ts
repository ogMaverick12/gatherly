'use client';

/**
 * Local draft state for the editable fields on a vendor card.
 * Values are committed on blur, so a half-typed quote never reaches the stored plan.
 */

import { useEffect, useState } from 'react';
import { fromMajorUnits, toMajorUnits } from '@/lib/money';
import type { Currency, Vendor } from '@/lib/plan';

export interface VendorDraft {
  readonly name: string;
  readonly quote: string;
  readonly phone: string;
  readonly notes: string;
  setName(value: string): void;
  setQuote(value: string): void;
  setPhone(value: string): void;
  setNotes(value: string): void;
  /** Write the typed quote back, or reset the box when it is not a number. */
  commitQuote(): void;
}

/**
 * The four editable fields of a vendor card.
 *
 * Typing stays local until the field loses focus, so a half-typed quote never
 * reaches the stored plan; a value the user never finished typing is discarded
 * rather than stored as zero.
 */
export function useVendorDraft(
  vendor: Vendor,
  currency: Currency,
  onUpdate: (id: string, patch: Partial<Vendor>) => void,
): VendorDraft {
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

  return { name, quote, phone, notes, setName, setQuote, setPhone, setNotes, commitQuote };
}
