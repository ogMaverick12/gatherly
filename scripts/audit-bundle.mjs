#!/usr/bin/env node
/**
 * Build the reproducible audit bundle.
 *
 * Every command runs through child_process and records its command line,
 * start time, exit code, duration and untrimmed stdout/stderr in
 * audit/outputs/. A failure is recorded, not thrown. `--secrets-only` rescans
 * after the hand-written notes are added.
 */
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  scanSecrets,
  sh,
  writeChecks,
  writeGitLog,
  writeInventory,
  writeReport,
} from './audit-bundle-lib.mjs';

const ROOT = process.cwd();
const AUDIT = join(ROOT, 'audit');
const OUT = join(AUDIT, 'outputs');
const MAX = 64 * 1024 * 1024;
const COMMANDS = [
  ['check', 'npm run check'],
  ['build', 'npm run build'],
  ['coverage', 'npm run test:coverage'],
  ['e2e', 'npx playwright test'],
  ['audit-all', 'npm audit'],
  ['audit-prod', 'npm audit --omit=dev'],
  ['depcheck', 'npx depcheck'],
  ['bundle-budget', 'node scripts/check-bundle.mjs'],
  ['stats', 'node scripts/stats.mjs'],
  ['lighthouse', 'node scripts/lighthouse.mjs'],
  ['live-smoke', 'live-smoke'],
];
const results = [];

/** Run one command synchronously, preserving both full pipes. */
function run(name, command) {
  const started = new Date();
  const r = spawnSync(command, { cwd: ROOT, encoding: 'utf8', shell: true, maxBuffer: MAX });
  const duration = Date.now() - started.getTime();
  writeFileSync(
    join(OUT, `${name}.txt`),
    `command: ${command}\nstart: ${started.toISOString()}\n\n${r.stdout ?? ''}${r.stderr ?? ''}\n\nexit code: ${r.status ?? 'spawn-error'}\nduration: ${duration} ms\n`,
  );
  return { name, command, code: r.status ?? -1, duration };
}

/** Record the deliberately unrun live smoke command. */
function skip(name, command) {
  const started = new Date();
  writeFileSync(
    join(OUT, `${name}.txt`),
    `command: ${command}\nstart: ${started.toISOString()}\nexit code: skipped\nduration: 0 ms\n\nskipped: run by the owner, output sent separately\n`,
  );
  return { name, command, code: 'skipped', duration: 0 };
}

/** Run the bundle or the post-notes secret rescan. */
function main() {
  mkdirSync(OUT, { recursive: true });
  if (!readFileSync(join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/).includes('audit/'))
    appendFileSync(join(ROOT, '.gitignore'), '\naudit/\n');
  if (process.argv.includes('--secrets-only')) {
    const hits = scanSecrets();
    if (hits.length)
      console.error(`Secret scan found ${hits.length} hit(s); see audit/secrets.txt. Do not zip.`);
    else process.stdout.write('Secret scan: no hits.\n');
    process.exitCode = hits.length ? 2 : 0;
    return;
  }
  if (sh('git status --short').out) {
    console.error('Working tree is not clean. Commit first; REPORT.md must show an empty status.');
    process.exitCode = 1;
    return;
  }
  rmSync(OUT, { recursive: true, force: true });
  rmSync(join(AUDIT, 'lighthouse'), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const [name, command] of COMMANDS)
    results.push(name === 'live-smoke' ? skip(name, command) : run(name, command));
  if (existsSync(join(AUDIT, 'lighthouse')))
    cpSync(join(AUDIT, 'lighthouse'), join(OUT, 'lighthouse'), { recursive: true });
  sh('git -c core.autocrlf=false checkout -- public/sw.js');
  writeInventory();
  writeChecks();
  const hits = scanSecrets();
  writeReport(results);
  writeGitLog();
  if (hits.length) {
    console.error(`Secret scan found ${hits.length} hit(s); see audit/secrets.txt. Do not zip.`);
    process.exitCode = 2;
    return;
  }
  if (results.some((r) => r.code !== 0 && r.code !== 'skipped')) process.exitCode = 1;
  process.stdout.write('Audit bundle written to audit/.\n');
}

main();
