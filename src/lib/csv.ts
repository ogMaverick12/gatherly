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

// long-function: one pass over the inputs; splitting it would only pass the same state between more functions.
export function budgetCsv(plan: Plan, budget: BudgetAllocation): string {
  const currency = plan.intake.currency;
  const rows: (string | number)[][] = [
    [
      'Category',
      'Planned (minor units)',
      `Planned (${currency})`,
      'Share of spendable %',
      'Benchmark share %',
      'Difference (points)',
      'Per guest (minor units)',
    ],
  ];

  for (const category of budget.categories) {
    rows.push([
      category.label,
      category.amountMinor,
      formatMinorPlain(category.amountMinor, currency),
      category.sharePercent,
      category.benchmarkSharePercent,
      category.varianceFromBenchmark,
      category.perGuestMinor ?? '',
    ]);
  }

  rows.push([]);
  rows.push([
    'Contingency',
    budget.contingencyMinor,
    formatMinor(budget.contingencyMinor, currency),
    '',
    '',
    '',
    '',
  ]);
  rows.push([
    'Total',
    budget.totalMinor,
    formatMinor(budget.totalMinor, currency),
    100,
    '',
    '',
    plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : '',
  ]);

  return toCsv(rows);
}

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
