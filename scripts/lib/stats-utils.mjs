import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Repository root, resolved from this nested module. */
export const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The running Node binary, used to launch local CLIs without a shell. */
export const NODE = process.execPath;

/** The installed Vitest CLI entry point. */
export const VITEST_CLI = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');

/** The installed Playwright CLI entry point. */
export const PLAYWRIGHT_CLI = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');

/** The recorded quality allowance the shape checks compare against. */
export const ALLOWANCE_PATH = join(ROOT, 'docs', 'quality-allowance.json');

/** Source folders scanned by the shape checks. */
export const SOURCE_FOLDERS = [join(ROOT, 'src'), join(ROOT, 'scripts')];

/** File extensions scanned by the shape checks. */
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mjs'];

/** Every file under a folder that matches the extension list. */
export function countFiles(folder, extensions) {
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
export function findFiles(folder, predicate) {
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
export function countUnitTests() {
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
export function countEndToEndTests() {
  const output = run(NODE, [PLAYWRIGHT_CLI, 'test', '--list']);
  const match = output.match(/Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/);
  if (!match) return { files: 0, tests: 0 };
  return { files: Number(match[2]), tests: Number(match[1]) };
}

/** The coverage numbers from the last report, if there is one. */
export function readCoverage() {
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
