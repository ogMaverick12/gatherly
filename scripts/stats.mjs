#!/usr/bin/env node
/**
 * Print the numbers the documentation quotes.
 *
 * The docs claim counts: tests, files, coverage. Those numbers drift the
 * moment a file is added, so this script measures them and prints a block
 * that can be pasted into docs/DELIVERY_OUTCOMES.md.
 *
 * Usage:
 *   node scripts/stats.mjs
 *
 * It asks the test runners how many tests they hold, counts the source
 * files, and reads the last coverage report. It never prints anything else
 * about the project.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const NODE = process.execPath;
const VITEST_CLI = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const PLAYWRIGHT_CLI = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');

/** Every file under a folder that matches the extension list. */
function countFiles(folder, extensions) {
  if (!existsSync(folder)) return 0;
  let total = 0;
  for (const entry of readdirSync(folder)) {
    const full = join(folder, entry);
    if (statSync(full).isDirectory()) {
      total += countFiles(full, extensions);
    } else if (extensions.some((extension) => entry.endsWith(extension))) {
      total += 1;
    }
  }
  return total;
}

/** Files under a folder that match a predicate on their path. */
function findFiles(folder, predicate) {
  if (!existsSync(folder)) return [];
  const found = [];
  for (const entry of readdirSync(folder)) {
    const full = join(folder, entry);
    if (statSync(full).isDirectory()) {
      found.push(...findFiles(full, predicate));
    } else if (predicate(full)) {
      found.push(full);
    }
  }
  return found;
}

/** Run a command and return its stdout as text. */
function run(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return '';
  }
}

/** The unit tests Vitest runs, counted from a real run so parameterized tests count once per case. */
function countUnitTests() {
  const tmp = join(ROOT, 'node_modules', '.vitest', 'stats-run.json');
  const output = run(NODE, [VITEST_CLI, 'run', '--reporter=json', '--outputFile', tmp]);
  if (!output.trim() && !existsSync(tmp)) return { files: 0, tests: 0 };
  try {
    const report = JSON.parse(readFileSync(tmp, 'utf8'));
    const files = Array.isArray(report.testResults) ? report.testResults.length : 0;
    return { files, tests: report.numTotalTests ?? 0 };
  } catch {
    return { files: 0, tests: 0 };
  } finally {
    try {
      rmSync(tmp, { force: true });
    } catch {
      /* the temp file is only a scratchpad for this count */
    }
  }
}

/** The journeys Playwright holds, counted without running them. */
function countEndToEndTests() {
  const output = run(NODE, [PLAYWRIGHT_CLI, 'test', '--list']);
  const match = output.match(/Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/);
  if (!match) return { files: 0, tests: 0 };
  return { files: Number(match[2]), tests: Number(match[1]) };
}

/** The coverage numbers from the last report, if there is one. */
function readCoverage() {
  const summary = join(ROOT, 'coverage', 'coverage-summary.json');
  if (!existsSync(summary)) return null;
  const report = JSON.parse(readFileSync(summary, 'utf8'));
  const total = report.total;
  if (!total) return null;
  return {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct,
  };
}

const unit = countUnitTests();
const endToEnd = countEndToEndTests();
const coverage = readCoverage();

const rows = [
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

const lines = [
  '| Measure | Count |',
  '| --- | --- |',
  ...rows.map(([label, value]) => `| ${label} | ${value} |`),
];

if (coverage) {
  lines.push(
    '',
    `Coverage: ${coverage.statements}% statements, ${coverage.branches}% branches, ${coverage.functions}% functions, ${coverage.lines}% lines.`,
  );
}

process.stdout.write(`${lines.join('\n')}\n`);
process.stdout.write(`\nMeasured on ${new Date().toISOString().slice(0, 10)}.\n`);
