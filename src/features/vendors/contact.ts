import type { Vendor } from '@/lib/plan';

/** Phone numbers, and turning one into a WhatsApp link the user taps. */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    return digits.length >= 8 ? `+${digits}` : null;
  }
  if (!digits) return null;
  if (digits.length < 8 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : digits;
}

export interface WhatsAppLink {
  readonly href: string | null;
  readonly message: string;
  readonly reason: string | null;
}

export function buildWhatsAppLink(vendor: Vendor, eventLabel: string): WhatsAppLink {
  const message = `Hello ${vendor.name || 'there'}, I am planning ${eventLabel} and would love to ask about your availability and pricing.`;
  const phone = normalisePhone(vendor.phone);
  if (!phone) {
    return {
      href: null,
      message,
      reason: vendor.phone.trim()
        ? 'That number does not look complete yet, so there is no link to open.'
        : 'Add a phone number to open a chat.',
    };
  }
  return {
    href: `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`,
    message,
    reason: null,
  };
}
