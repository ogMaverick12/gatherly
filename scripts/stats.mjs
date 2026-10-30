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
 * every exported function and constant - against docs/quality-allowance.json.
 * A logic function may be excused only by the exact line
 * `// long-ok: data table` or `// long-ok: closed switch` above it.
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
const LONG_OK_TAGS = new Set(['// long-ok: data table', '// long-ok: closed switch']);

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

/** True when the body contains JSX, which marks a PascalCase function as a component. */
function containsJsx(node) {
  let found = false;
  const visit = (child) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

/** True for a PascalCase function that renders JSX. */
function isReactComponent(node, name) {
  return /^[A-Z]/.test(name) && containsJsx(node);
}

/** True when the exact long-ok tag sits in the three lines above the function. */
function hasLongOkTag(lines, start) {
  return lines.slice(Math.max(0, start - 3), start).some((line) => LONG_OK_TAGS.has(line.trim()));
}

/** Record one function in the component or logic list when it exceeds its limit. */
function addFunctionMeasurement(node, sourceFile, shown, lines, lists) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, false)).line;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
  const length = end - start + 1;
  const name = functionName(node);
  const where = `${shown}:${start + 1} ${name} (${length} lines)`;
  if (isReactComponent(node, name)) {
    if (length > 80) lists.longComponents.push(where);
    return;
  }
  if (length > 40 && !hasLongOkTag(lines, start)) lists.longLogic.push(where);
}

/** Record an exported function or constant whose doc block is missing. */
function addUndocumented(node, sourceFile, shown, lists) {
  if (!isDocumentedExport(node)) return;
  const before = sourceFile.text.slice(node.getFullStart(), node.getStart(sourceFile, false));
  if (before.includes('/**')) return;
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, false)).line;
  lists.undocumented.push(`${shown}:${start + 1} ${functionName(node)}`);
}

/** Walk the AST once, collecting all four quality lists. */
function visitNode(node, sourceFile, shown, lines, lists) {
  if (isMeasuredFunction(node) && node.body) {
    addFunctionMeasurement(node, sourceFile, shown, lines, lists);
  }
  addUndocumented(node, sourceFile, shown, lists);
  ts.forEachChild(node, (child) => visitNode(child, sourceFile, shown, lines, lists));
}

/** The source files the quality lists measure. */
function sourceFiles() {
  return SOURCE_FOLDERS.flatMap((folder) =>
    findFiles(folder, (file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))),
  );
}

/** Measure one file: its length, function sizes and undocumented exports. */
function measureFile(file, lists) {
  const text = readFileSync(file, 'utf8');
  const shown = relative(ROOT, file).split(sep).join('/');
  const lines = text.split('\n');
  if (lines.length > 200) lists.longFiles.push(`${shown} (${lines.length} lines)`);
  const sourceFile = ts.createSourceFile(
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
  visitNode(sourceFile, sourceFile, shown, lines, lists);
}

/** The quality lists: long files, long logic, long components, undocumented exports. */
function qualityLists() {
  const lists = { longFiles: [], longLogic: [], longComponents: [], undocumented: [] };
  for (const file of sourceFiles()) measureFile(file, lists);
  return lists;
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
    'Exported functions and constants without JSDoc',
    lists.undocumented,
    allowance?.exportsWithoutJsDoc ?? 0,
  ),
);

process.stdout.write(`${lines.join('\n')}\n`);
process.stdout.write(`\nMeasured on ${new Date().toISOString().slice(0, 10)}.\n`);

if (!allowance) {
  process.stdout.write('\nNo docs/quality-allowance.json: nothing to compare against.\n');
  process.exit(0);
}

const over = [
  ['files over 200 lines', lists.longFiles.length, allowance.filesOver200Lines],
  ['logic functions over 40 lines', lists.longLogic.length, allowance.logicFunctionsOver40Lines],
  ['components over 80 lines', lists.longComponents.length, allowance.componentsOver80Lines],
  ['exports without JSDoc', lists.undocumented.length, allowance.exportsWithoutJsDoc],
].filter(([, count, allowed]) => count > allowed);

if (over.length > 0) {
  process.stdout.write('\nAbove the recorded allowance:\n');
  for (const [label, count, allowed] of over) {
    process.stdout.write(`  ${label}: ${count} (allowance ${allowed})\n`);
  }
  process.exit(1);
}
