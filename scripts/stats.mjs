#!/usr/bin/env node
/**
 * Print the numbers the documentation quotes, plus the quality lists.
 *
 * The docs claim counts: tests, files, coverage. Those numbers drift the
 * moment a file is added, so this script measures them and prints a block
 * that can be pasted into docs/DELIVERY_OUTCOMES.md.
 *
 * It also measures the shape rules in AGENTS.md - files under 200 lines,
 * logic functions under 40 lines, components under 80 lines, and JSDoc on
 * every exported declaration - against docs/quality-allowance.json.
 * A logic function may be excused only by the exact line
 * `// long-ok: data table` or `// long-ok: closed switch` above it.
 *
 * Usage:
 *   node scripts/stats.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { qualityLists } from './lib/stats-quality.mjs';
import {
  ALLOWANCE_PATH,
  countEndToEndTests,
  countFiles,
  countUnitTests,
  findFiles,
  ROOT,
  readCoverage,
} from './lib/stats-utils.mjs';

/** One list block: its heading, its entries, and the allowance comparison. */
function listBlock(heading, entries, allowance) {
  const printed = entries.length === 0 ? ['  (none)'] : entries.map((entry) => `  ${entry}`);
  return [`${heading}: ${entries.length} (allowance ${allowance})`, ...printed, ''];
}

/** The count rows shown above the coverage and quality lists. */
function buildRows(unit, endToEnd) {
  return [
    ['Unit test files', unit.files],
    ['Unit tests', unit.tests],
    ['End-to-end test files', endToEnd.files],
    ['End-to-end journeys', endToEnd.tests],
    ['Source files under `src`', countFiles(join(ROOT, 'src'), ['.ts', '.tsx'])],
    [
      'UI components',
      findFiles(
        join(ROOT, 'src'),
        (file) => file.split(sep).includes('components') && file.endsWith('.tsx'),
      ).length,
    ],
    [
      'API routes',
      findFiles(join(ROOT, 'src', 'app', 'api'), (file) => file.endsWith('route.ts')).length,
    ],
    ['Feature slices', readdirSync(join(ROOT, 'src', 'features')).length],
  ];
}

/** The printable report, including every quality list. */
function buildReport(unit, endToEnd, coverage, lists, allowance) {
  const lines = [
    '| Measure | Count |',
    '| --- | --- |',
    ...buildRows(unit, endToEnd).map(([label, value]) => `| ${label} | ${value} |`),
  ];
  if (coverage) {
    lines.push(
      '',
      `Coverage: ${coverage.statements}% statements, ${coverage.branches}% branches, ${coverage.functions}% functions, ${coverage.lines}% lines.`,
    );
  }
  lines.push(
    '',
    ...listBlock('Files over 200 lines', lists.longFiles, allowance?.filesOver200Lines ?? 0),
    ...listBlock(
      'Logic functions over 40 lines',
      lists.longLogic,
      allowance?.logicFunctionsOver40Lines ?? 0,
    ),
    ...listBlock(
      'Components over 80 lines',
      lists.longComponents,
      allowance?.componentsOver80Lines ?? 0,
    ),
    ...listBlock(
      'Exported symbols without JSDoc',
      lists.undocumented,
      allowance?.exportsWithoutJsDoc ?? 0,
    ),
  );
  return `${lines.join('\n')}\n`;
}

const unit = countUnitTests();
const endToEnd = countEndToEndTests();
const coverage = readCoverage();
const lists = qualityLists();
const allowance = existsSync(ALLOWANCE_PATH)
  ? JSON.parse(readFileSync(ALLOWANCE_PATH, 'utf8')).allowance
  : null;

process.stdout.write(buildReport(unit, endToEnd, coverage, lists, allowance));
process.stdout.write(`\nMeasured on ${new Date().toISOString().slice(0, 10)}.\n`);

if (!allowance) {
  process.stdout.write('\nNo docs/quality-allowance.json: nothing to compare against.\n');
  process.exit(0);
}

const over = [
  ['files over 200 lines', lists.longFiles.length, allowance.filesOver200Lines],
  ['logic functions over 40 lines', lists.longLogic.length, allowance.logicFunctionsOver40Lines],
  ['components over 80 lines', lists.longComponents.length, allowance.componentsOver80Lines],
  ['exported symbols without JSDoc', lists.undocumented.length, allowance.exportsWithoutJsDoc],
].filter(([, count, allowed]) => count > allowed);

if (over.length > 0) {
  process.stdout.write('\nAbove the recorded allowance:\n');
  for (const [label, count, allowed] of over) {
    process.stdout.write(`  ${label}: ${count} (allowance ${allowed})\n`);
  }
  process.exit(1);
}
