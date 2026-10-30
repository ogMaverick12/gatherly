import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { writeSummary } from './lighthouse-report.mjs';
import { readResult } from './lighthouse-stats.mjs';

/**
 * Run Lighthouse against a real sample plan.
 *
 * Lighthouse's own storage reset makes /plan land on the empty state, so this
 * script starts the built app, opens Chromium with a CDP port, creates a sample
 * plan in that browser, and only then runs both form factors.
 */

const BASE = 'http://localhost:3210';
const DEBUG_PORT = 9333;
const OUT = join(process.cwd(), 'audit', 'lighthouse');
const NEXT_BIN = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const NPX_CLI = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const LIGHTHOUSE = 'lighthouse@13.6.0';
const RUNS = Number.parseInt(process.env.LIGHTHOUSE_RUNS ?? '3', 10);
const PAGES = [
  { slug: 'landing', path: '/' },
  { slug: 'intake', path: '/intake' },
  { slug: 'plan', path: '/plan' },
];

/** True when the URL answers successfully. */
async function isUp(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

/** Wait until a URL answers, or fail after the timeout. */
async function waitFor(url, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await isUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

/** Start `next start` and return the child process. */
function startServer() {
  return spawn(process.execPath, [NEXT_BIN, 'start', '-p', '3210'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

/** Run Playwright in a short-lived process that seeds the plan, then exits. */
function createPlan() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(process.cwd(), 'scripts', 'sample-plan.mjs')], {
      env: { ...process.env, CDP_PORT: String(DEBUG_PORT), BASE_URL: BASE },
      stdio: 'inherit',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`The sample plan setup exited with code ${String(code)}.`));
    });
  });
}

/** Run Lighthouse against the already-open browser. */
function runLighthouse(outDir, name, path, desktop) {
  const output = join(outDir, name);
  const args = [
    '--yes',
    LIGHTHOUSE,
    `${BASE}${path}`,
    `--port=${DEBUG_PORT}`,
    '--disable-storage-reset',
    '--output=json',
    '--output=html',
    `--output-path=${output}`,
    '--quiet',
  ];
  if (desktop) args.push('--preset=desktop');

  const result = spawnSync(process.execPath, [NPX_CLI, ...args], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Lighthouse failed for ${name}:\n${result.stderr || result.stdout}`);
  }
}

/** Close every page except the browser itself so audits do not accumulate tabs. */
async function closePages() {
  const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const targets = await response.json();
  for (const target of targets) {
    if (target.type === 'page') {
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${target.id}`);
    }
  }
}

/** Launch a minimal Chromium with a CDP port that Lighthouse can attach to. */
function launchChrome(profile) {
  return spawn(
    chromium.executablePath(),
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
}

/** Stop Chromium and wait briefly for its profile lock to clear. */
async function stopChrome(chrome) {
  chrome.kill();
  await new Promise((resolve) => {
    if (chrome.exitCode !== null) return resolve(undefined);
    chrome.once('exit', () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

/** Run one discarded audit so the measured runs do not pay V8's first-plan cost. */
async function warmUp() {
  const dir = mkdtempSync(join(tmpdir(), 'gatherly-lighthouse-warmup-'));
  try {
    runLighthouse(dir, 'plan-mobile', '/plan', false);
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
/** Run every page on both form factors for each configured run. */
async function runAudits() {
  const results = [];
  for (let run = 1; run <= RUNS; run += 1) {
    const outDir = join(OUT, `run-${run}`);
    mkdirSync(outDir, { recursive: true });
    for (const { slug, path } of PAGES) {
      runLighthouse(outDir, `${slug}-mobile`, path, false);
      await closePages();
      runLighthouse(outDir, `${slug}-desktop`, path, true);
      await closePages();
      results.push(
        { ...readResult(outDir, `${slug}-mobile`), run },
        { ...readResult(outDir, `${slug}-desktop`), run },
      );
    }
  }
  return results;
}

async function main() {
  if (!Number.isInteger(RUNS) || RUNS < 1) {
    throw new Error('LIGHTHOUSE_RUNS must be a positive integer.');
  }
  if (await isUp(BASE)) {
    throw new Error('Port 3210 is already in use; stop that server before auditing.');
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'gatherly-lighthouse-'));
  const server = startServer();
  const chrome = launchChrome(profile);
  try {
    await waitFor(BASE);
    await waitFor(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    await createPlan();
    await closePages();
    await warmUp();
    await closePages();
    writeSummary(OUT, await runAudits());
  } finally {
    await stopChrome(chrome);
    server.kill();
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Windows can keep a profile lock briefly; a temp directory is harmless.
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
