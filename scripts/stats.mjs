#!/usr/bin/env node
/**
 * Print the numbers the documentation quotes, plus the three quality lists.
 *
 * The docs claim counts: tests, files, coverage. Those numbers drift the
 * moment a file is added, so this script measures them and prints a block
 * that can be pasted into docs/DELIVERY_OUTCOMES.md.
 *
 * It also measures the shape rules in AGENTS.md - files under 200 lines,
 * functions under 40 lines, JSDoc on every exported function and constant -
 * against docs/quality-allowance.json and exits 1 when a count is above the
 * allowance recorded there. Lower the allowance when the count drops; never
 * raise it silently.
 *
 * Usage:
 *   node scripts/stats.mjs
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const NODE = process.execPath;
const VITEST_CLI = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const PLAYWRIGHT_CLI = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const ALLOWANCE_PATH = join(ROOT, 'docs', 'quality-allowance.json');
const SOURCE_FOLDERS = [join(ROOT, 'src'), join(ROOT, 'scripts')];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mjs'];

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

/** A function-like node the size rule applies to. */
function isMeasuredFunction(node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessor(node) ||
    ts.isSetAccessor(node)
  ) {
    return true;
  }
  if (
    ts.isPropertyAssignment(node) &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  ) {
    return true;
  }
  return (
    ts.isVariableDeclaration(node) &&
    Boolean(node.initializer) &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  );
}

/** The name a report should show for a measured function. */
function functionName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  const parent = node.parent;
  if (parent && ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  if (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
    return node.parent.name.text;
  }
  return '(anonymous)';
}

/** The source files the three lists measure. */
function sourceFiles() {
  return SOURCE_FOLDERS.flatMap((folder) =>
    findFiles(folder, (file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))),
  );
}

/** The three quality lists: long files, long functions, undocumented exports. */
// long-function: one AST walk collects all three lists; three walks would parse every file three times.
function qualityLists() {
  const longFiles = [];
  const longFunctions = [];
  const undocumented = [];

  for (const file of sourceFiles()) {
    const text = readFileSync(file, 'utf8');
    const shown = relative(ROOT, file).split(sep).join('/');
    const lineCount = text.split('\n').length;
    if (lineCount > 200) longFiles.push(`${shown} (${lineCount} lines)`);

    const source = ts.createSourceFile(
      shown,
      text,
      ts.ScriptTarget.Latest,
      true,
      shown.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : shown.endsWith('.mjs')
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TS,
    );
    const lines = text.split('\n');

    const visit = (node) => {
      const start = source.getLineAndCharacterOfPosition(node.getStart(source, false)).line;
      const end = source.getLineAndCharacterOfPosition(node.getEnd()).line;
      if (isMeasuredFunction(node) && node.body && end - start + 1 > 40) {
        const declared = lines[start];
        const reasonAbove = lines
          .slice(Math.max(0, start - 4), start)
          .some((line) => line.includes('long-function:'));
        longFunctions.push({
          where: `${shown}:${start + 1} ${functionName(node)} (${end - start + 1} lines)`,
          justified: reasonAbove || declared.includes('long-function:'),
        });
      }
      if (isDocumentedExport(node)) {
        const before = text.slice(node.getFullStart(), node.getStart(source, false));
        if (!before.includes('/**')) {
          undocumented.push(`${shown}:${start + 1} ${functionName(node)}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { longFiles, longFunctions, undocumented };
}

/** True for an exported function or constant, the two things that need a JSDoc block. */
function isDocumentedExport(node) {
  const exported = node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );
  if (!exported) return false;
  if (ts.isFunctionDeclaration(node)) return true;
  if (ts.isVariableStatement(node)) return true;
  return false;
}

const unit = countUnitTests();
const endToEnd = countEndToEndTests();
const coverage = readCoverage();
const lists = qualityLists();
const unjustified = lists.longFunctions.filter((entry) => !entry.justified);

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

/** One list block: its heading, its entries, and the allowance comparison. */
function listBlock(heading, entries, allowance) {
  const printed = entries.length === 0 ? ['  (none)'] : entries.map((entry) => `  ${entry}`);
  return [`${heading}: ${entries.length} (allowance ${allowance})`, ...printed, ''];
}

const allowance = existsSync(ALLOWANCE_PATH)
  ? JSON.parse(readFileSync(ALLOWANCE_PATH, 'utf8')).allowance
  : null;

lines.push(
  '',
  ...listBlock('Files over 200 lines', lists.longFiles, allowance?.filesOver200Lines ?? 0),
  ...listBlock(
    'Functions over 40 lines',
    lists.longFunctions.map((entry) => `${entry.where}${entry.justified ? ' [reason]' : ''}`),
    allowance?.functionsOver40Lines ?? 0,
  ),
  ...listBlock(
    'Exported functions and constants without JSDoc',
    lists.undocumented,
    allowance?.exportsWithoutJsDoc ?? 0,
  ),
  `Functions over 40 lines without a reason comment: ${unjustified.length} (allowance ${allowance?.functionsOver40LinesWithoutReason ?? 0})`,
);

process.stdout.write(`${lines.join('\n')}\n`);
process.stdout.write(`\nMeasured on ${new Date().toISOString().slice(0, 10)}.\n`);

if (!allowance) {
  process.stdout.write('\nNo docs/quality-allowance.json: nothing to compare against.\n');
  process.exit(0);
}

const over = [
  ['files over 200 lines', lists.longFiles.length, allowance.filesOver200Lines],
  ['functions over 40 lines', lists.longFunctions.length, allowance.functionsOver40Lines],
  [
    'functions over 40 lines without a reason',
    unjustified.length,
    allowance.functionsOver40LinesWithoutReason,
  ],
  ['exports without JSDoc', lists.undocumented.length, allowance.exportsWithoutJsDoc],
].filter(([, count, allowed]) => count > allowed);

if (over.length > 0) {
  process.stdout.write('\nAbove the recorded allowance:\n');
  for (const [label, count, allowed] of over) {
    process.stdout.write(`  ${label}: ${count} (allowance ${allowed})\n`);
  }
  process.exit(1);
}
