import { escapeCsvCell } from '@/lib/security/sanitize';
import type { Plan } from '@/lib/plan';
import { formatMinor, formatMinorPlain } from '@/lib/money';
import type { BudgetAllocation } from '@/features/budget/services';

/**
 * CSV export.
 *
 * Cells are quoted and formula-like values are defused, so a plan opened in
 * a spreadsheet cannot execute anything.
 */

export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(',')).join('\r\n');
}

/** Excel and other spreadsheet tools read UTF-8 more reliably with a BOM. */
export function withBom(csv: string): string {
  return `﻿${csv}`;
}

/** The budget CSV header row. */
function budgetHeader(currency: Plan['intake']['currency']): (string | number)[] {
  return [
    'Category',
    'Planned (minor units)',
    `Planned (${currency})`,
    'Share of spendable %',
    'Benchmark share %',
    'Difference (points)',
    'Per guest (minor units)',
  ];
}

/** One category row, with the formatted and per-guest amounts. */
function budgetCategoryRow(
  category: BudgetAllocation['categories'][number],
  currency: Plan['intake']['currency'],
): (string | number)[] {
  return [
    category.label,
    category.amountMinor,
    formatMinorPlain(category.amountMinor, currency),
    category.sharePercent,
    category.benchmarkSharePercent,
    category.varianceFromBenchmark,
    category.perGuestMinor ?? '',
  ];
}

/** The contingency row. */
function budgetContingencyRow(
  budget: BudgetAllocation,
  currency: Plan['intake']['currency'],
): (string | number)[] {
  return [
    'Contingency',
    budget.contingencyMinor,
    formatMinor(budget.contingencyMinor, currency),
    '',
    '',
    '',
    '',
  ];
}

/** The total row, including the per-guest total when there are guests. */
function budgetTotalRow(
  plan: Plan,
  budget: BudgetAllocation,
  currency: Plan['intake']['currency'],
): (string | number)[] {
  return [
    'Total',
    budget.totalMinor,
    formatMinor(budget.totalMinor, currency),
    100,
    '',
    '',
    plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : '',
  ];
}

/**
 * Render a plan's budget allocation as a spreadsheet-ready CSV.
 *
 * @param plan the plan whose currency and guest count label the columns
 * @param budget the computed allocation, in integer minor units (paise)
 * @returns CSV text with a header, one row per category and totals
 */
export function budgetCsv(plan: Plan, budget: BudgetAllocation): string {
  const currency = plan.intake.currency;
  const rows = [
    budgetHeader(currency),
    ...budget.categories.map((category) => budgetCategoryRow(category, currency)),
    [],
    budgetContingencyRow(budget, currency),
    budgetTotalRow(plan, budget, currency),
  ];
  return toCsv(rows);
}

/**
 * Render the plan's milestones as a spreadsheet-ready CSV.
 *
 * @param plan the plan holding the milestones
 * @returns CSV text with title, date, offset, done flag and rationale
 */
export function milestonesCsv(plan: Plan): string {
  const rows: (string | number)[][] = [
    ['Milestone', 'Date', 'Days before the event', 'Done', 'Why it matters'],
  ];
  for (const milestone of plan.milestones) {
    rows.push([
      milestone.title,
      milestone.date ?? 'not scheduled',
      Math.abs(milestone.offsetDays),
      milestone.done ? 'yes' : 'no',
      milestone.whyItMatters,
    ]);
  }
  return toCsv(rows);
}

/**
 * Render the plan's vendors as a spreadsheet-ready CSV.
 *
 * @param plan the plan holding the vendors
 * @returns CSV text with category, name, status, quote and payment details
 */
export function vendorsCsv(plan: Plan): string {
  const rows: (string | number)[][] = [
    ['Category', 'Name', 'Status', 'Quote (minor units)', 'Payment due', 'Notes'],
  ];
  for (const vendor of plan.vendors) {
    rows.push([
      vendor.category,
      vendor.name,
      vendor.status,
      vendor.quotedMinor ?? '',
      vendor.dueDate ?? '',
      vendor.notes,
    ]);
  }
  return toCsv(rows);
}
