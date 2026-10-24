#!/usr/bin/env node
/**
 * Bundle budget script.
 *
 * Rebuilds the app and asserts the first-load JS for `/plan` stays within
 * 10 percent of the baseline measured in this working tree (161 kB).
 * Prints the per-route table and exits non-zero when the budget breaks.
 */

import { execSync } from 'node:child_process';

const BASELINE_KB = 161;
const MAX_KB = BASELINE_KB * 1.10;

const output = execSync('npm run build', {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});

const planLine = output.split('\n').find(
  (line) => line.includes('/plan') && /kB/.test(line),
);
const sizes = [...planLine.matchAll(/([\d.]+)\s*kB/g)].map((m) => Number(m[1]));
const firstLoadKB = sizes[sizes.length - 1];

process.stdout.write(output);
process.stdout.write(`\nBundle budget: /plan first-load JS = ${firstLoadKB} kB (baseline ${BASELINE_KB} kB, budget <= ${MAX_KB} kB).\n`);

if (!firstLoadKB || firstLoadKB > MAX_KB) {
  process.stdout.write('BUDGET BREACHED.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('BUDGET OK.\n');
}
