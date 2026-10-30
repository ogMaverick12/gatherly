import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

/**
 * Profile /plan with a real sample plan.
 *
 * Playwright seeds the plan, then a fresh page is throttled 4x through CDP.
 * The page records long tasks; the CDP profiler supplies function self time.
 * Run after `npm run build`; the output is meant to be redirected to a file.
 */

const PORT = process.env.PROFILE_PORT ?? '3211';
const BASE = `http://localhost:${PORT}`;
const NEXT_BIN = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const SAMPLE_BUTTON = /Open a sample plan - A 180-guest wedding/;
const IGNORED_FUNCTIONS = new Set(['(idle)', '(program)', '(root)']);

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

/** Start the built app and return the child process. */
function startServer() {
  return spawn(process.execPath, [NEXT_BIN, 'start', '-p', PORT], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

/** Seed one sample plan through the real UI, then close the page. */
async function seedPlan(context) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: SAMPLE_BUTTON }).click();
  await page.waitForURL('**/plan');
  await page
    .getByRole('heading', { name: /guests/i })
    .first()
    .waitFor();
  await page.close();
}

/** Install the in-page long-task collector before the measured navigation. */
async function addLongTaskCollector(page) {
  await page.addInitScript(() => {
    const tasks = [];
    window.__gatherlyLongTasks = tasks;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        tasks.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        });
      }
    }).observe({ entryTypes: ['longtask'] });
  });
}

/** Aggregate profiler samples into function self time, in milliseconds. */
function topFunctions(profile, limit) {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const totals = new Map();
  for (let index = 0; index < profile.samples.length; index += 1) {
    const node = nodes.get(profile.samples[index]);
    if (!node) continue;
    const { functionName, url, lineNumber } = node.callFrame;
    if (IGNORED_FUNCTIONS.has(functionName)) continue;
    const name = functionName || '(anonymous)';
    const key = `${name}\u0000${url}\u0000${lineNumber}`;
    const ms = Math.max(0, profile.timeDeltas[index] ?? 0) / 1000;
    const current = totals.get(key) ?? {
      name,
      url: url.replace(BASE, '') || '(app)',
      line: lineNumber + 1,
      selfMs: 0,
    };
    current.selfMs += ms;
    totals.set(key, current);
  }
  return [...totals.values()].sort((a, b) => b.selfMs - a.selfMs).slice(0, limit);
}

/** Load /plan under 4x CPU throttling and return tasks plus the CPU profile. */
async function profilePage(context) {
  const page = await context.newPage();
  await addLongTaskCollector(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await cdp.send('Profiler.start');
  await page.goto(`${BASE}/plan`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: /guests/i })
    .first()
    .waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);
  const longTasks = await page.evaluate(() => window.__gatherlyLongTasks ?? []);
  const { profile } = await cdp.send('Profiler.stop');
  await cdp.send('Profiler.disable');
  await page.close();
  return { longTasks, profile };
}

/** Write one line to stdout without going through the console API. */
function print(line = '') {
  process.stdout.write(`${line}\n`);
}

/** Print the report that the before/after files preserve. */
function printReport({ longTasks, profile }) {
  const longest = [...longTasks].sort((a, b) => b.duration - a.duration).slice(0, 5);
  print('Gatherly /plan profile');
  print('CPU throttling: 4x; browser: Chromium; server: next start');
  print('Long tasks are PerformanceObserver entries; self time is CDP CPU-profile time.\n');
  print('Five longest tasks:');
  if (longest.length === 0) {
    print('  (none recorded)');
  } else {
    longest.forEach((task, index) => {
      print(
        `  ${index + 1}. ${task.duration.toFixed(0)} ms at ${task.startTime.toFixed(0)} ms (${task.name})`,
      );
    });
  }
  print('\nTop 15 functions by self time:');
  const functions = topFunctions(profile, 15);
  if (functions.length === 0) {
    print('  (no samples recorded)');
  } else {
    functions.forEach((entry, index) => {
      print(
        `  ${String(index + 1).padStart(2)}. ${entry.selfMs.toFixed(1)} ms  ${entry.name}  ${entry.url}:${entry.line}`,
      );
    });
  }
}

async function main() {
  if (await isUp(BASE)) throw new Error(`Port ${PORT} is already in use.`);
  const server = startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    await waitFor(BASE);
    await seedPlan(context);
    const result = await profilePage(context);
    printReport(result);
  } finally {
    await context.close();
    await browser.close();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
