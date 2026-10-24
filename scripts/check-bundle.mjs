#!/usr/bin/env node
/**
 * Bundle budget script.
 *
 * Rebuilds the app and asserts the first-load JS for `/plan` stays within
 * 10 percent of the baseline recorded in docs/bundle-baseline.json, so moving
 * the baseline is a deliberate edit that shows up in a diff.
 * Prints the per-route table and exits non-zero when the budget breaks.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BASELINE_PATH = new URL('../docs/bundle-baseline.json', import.meta.url);
const baselineKB = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).plan;
const MAX_KB = baselineKB * 1.1;

const output = execSync('npm run build', {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});

const planLine = output.split('\n').find((line) => line.includes('/plan') && /kB/.test(line));
const sizes = [...(planLine ?? '').matchAll(/([\d.]+)\s*kB/g)].map((m) => Number(m[1]));
const firstLoadKB = sizes[sizes.length - 1];
const measuredKB = Number.isFinite(firstLoadKB) ? firstLoadKB.toFixed(1) : 'not found';

process.stdout.write(output);
process.stdout.write(
  `\nBundle budget: /plan first-load JS = ${measuredKB} kB (baseline ${baselineKB.toFixed(1)} kB, budget <= ${MAX_KB.toFixed(1)} kB).\n`,
);

if (!firstLoadKB || firstLoadKB > MAX_KB) {
  process.stdout.write('BUDGET BREACHED.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('BUDGET OK.\n');
}
