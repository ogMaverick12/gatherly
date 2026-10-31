#!/usr/bin/env node
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

/**
 * Capture the seven phone-sized screenshots used in the review.
 *
 * The npm script builds first, so these always show the current code. The
 * sample plan is opened through the real landing page, so the screenshots show
 * the same state a reviewer sees.
 */

const PORT = process.env.SHOTS_PORT ?? '3212';
const BASE = `http://localhost:${PORT}`;
const OUT = join(process.cwd(), 'audit', 'screens');
const NEXT_BIN = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const SAMPLE = /Open a sample plan - A 180-guest wedding/;
const VIEWPORT = { width: 390, height: 844 };
const SECTIONS = [
  ['Budget', 'Where the money goes', '03-budget.png'],
  ['Timeline', 'Milestones', '04-timeline.png'],
  ['Vendors', 'Coverage', '05-vendors.png'],
  ['Ideas', 'Ideas for this plan', '06-ideas.png'],
  ['Assistant', 'Ask about your plan', '07-assistant.png'],
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

/** Start the built app and return the child process. */
function startServer() {
  return spawn(process.execPath, [NEXT_BIN, 'start', '-p', PORT], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

/** Navigate with the settled layout and fonts a screenshot needs. */
async function settle(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

/** Click one section in the phone bottom bar and wait for its heading. */
async function openSection(page, label, heading) {
  const nav = page.getByRole('navigation', { name: 'Plan sections' });
  const button = nav.getByRole('button', { name: new RegExp(`^${label}`) });
  // The bottom bar is fixed above the panel; dispatch the button's own click
  // so a hit-test against the content underneath cannot swallow it.
  await button.evaluate((node) => node.click());
  await page.getByRole('heading', { name: heading }).first().waitFor();
  await page.waitForTimeout(250);
}

/** Open a sample plan through the landing page and wait for its overview. */
async function openSamplePlan(page) {
  await settle(page, '/');
  await page.getByRole('button', { name: SAMPLE }).click();
  await page.waitForURL('**/plan');
  await page
    .getByRole('heading', { name: /guests/i })
    .first()
    .waitFor();
  await page.waitForTimeout(400);
}

/** Capture the intake, then open a sample plan and every workspace section. */
async function capture(browser) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });

  try {
    await settle(page, '/intake');
    await page.getByRole('heading', { name: 'Tell us about the celebration' }).waitFor();
    await page.screenshot({ path: join(OUT, '01-intake-step-1.png') });

    await openSamplePlan(page);
    await page.screenshot({ path: join(OUT, '02-overview.png') });

    for (const [label, heading, file] of SECTIONS) {
      await openSection(page, label, heading);
      await page.screenshot({ path: join(OUT, file) });
    }
  } finally {
    await context.close();
  }
}

async function main() {
  if (await isUp(BASE)) throw new Error(`Port ${PORT} is already in use.`);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const server = startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    await waitFor(BASE);
    await capture(browser);
    process.stdout.write(`Wrote seven screenshots to ${OUT}\n`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
