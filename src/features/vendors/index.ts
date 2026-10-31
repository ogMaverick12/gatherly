/**
 * Public vendor API: checklist, coverage, quote scoring and contact links.
 */

export { VENDOR_CATEGORY_BUDGET_LINE, missingVendorCategories, vendorChecklist } from './checklist';
export { buildWhatsAppLink, normalisePhone } from './contact';
export type { WhatsAppLink } from './contact';
export { computeVendorCoverage } from './coverage';
export type { VendorCoverage } from './coverage';
export { scoreQuote } from './quotes';
export type { QuoteAssessment } from './quotes';
export { nextStatus, vendorCoverageShare } from './status';
