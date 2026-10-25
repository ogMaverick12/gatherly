#!/usr/bin/env node
/**
 * Prove the live AI path.
 *
 * The Basic mode is deterministic and always works, but a judge with a key
 * will press the live path, so it has to be proven rather than assumed. This
 * script starts a production build with one provider at a time and calls the
 * three AI routes against it.
 *
 * For every provider that has a key it checks that:
 *   - the answer says the provider answered, not Basic mode,
 *   - the answer has the shape the route promises,
 *   - no key appears anywhere in the answer.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/live-smoke.mjs
 *
 * The keys are read from the environment and never printed. A provider with
 * no key is skipped and reported as skipped.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PORT = Number(process.env.PORT ?? 3211);
const BASE = `http://127.0.0.1:${PORT}`;

const PROVIDERS = [
  { id: 'gemini', keyName: 'GEMINI_API_KEY', modelName: 'GATHERLY_GEMINI_MODEL' },
  { id: 'openrouter', keyName: 'OPENROUTER_API_KEY', modelName: 'GATHERLY_OPENROUTER_MODEL' },
];

/** Mirrors src/lib/ai/config.ts, so a missing env still prints the id that failed. */
const DEFAULT_MODELS = {
  gemini: 'gemini-3.6-flash',
  openrouter: 'google/gemini-3.8-flash',
};

const results = [];

function say(message) {
  process.stdout.write(`${message}\n`);
}

/** The shape of the parse answer, mirrored from src/lib/api-schema.ts. */
const PARSED_FIELD_TYPES = {
  eventType: ['string', 'null'],
  eventDate: ['string', 'null'],
  guests: ['number', 'null'],
  cityTier: ['string', 'null'],
  currency: ['string', 'null'],
  budgetMinor: ['number', 'null'],
  priorities: ['array'],
  dietary: ['array'],
  access: ['array'],
  notes: ['string'],
};

/** The shape of an idea, mirrored from src/lib/api-schema.ts. */
function ideaShapeIsRight(idea) {
  return (
    typeof idea === 'object' &&
    idea !== null &&
    typeof idea.title === 'string' &&
    idea.title.length > 0 &&
    typeof idea.body === 'string' &&
    idea.body.length > 0 &&
    typeof idea.rationale === 'string' &&
    Array.isArray(idea.tags)
  );
}

/** Read the SSE frames of a chat answer. */
function readFrames(text) {
  const frames = [];
  for (const block of text.split('\n\n')) {
    const lines = block.split('\n').filter(Boolean);
    const name = lines.find((line) => line.startsWith('event: '))?.slice(7);
    const raw = lines.find((line) => line.startsWith('data: '))?.slice(6);
    if (!name || raw === undefined) continue;
    try {
      frames.push({ name, data: JSON.parse(raw) });
    } catch {
      frames.push({ name, data: null });
    }
  }
  return frames;
}

/** Wait for the server to answer. */
async function waitForServer(attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`, { redirect: 'manual' });
      if (response.status < 500) return true;
    } catch {
      // The server is not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/** Start `next start` with the provider selected, and wait for it. */
async function startServer(providerId, env) {
  const child = spawn(
    process.execPath,
    [join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '--port', String(PORT)],
    {
      cwd: ROOT,
      env: { ...process.env, ...env, NODE_ENV: 'production' },
      stdio: 'ignore',
    },
  );
  const ready = await waitForServer();
  return { child, ready };
}

/** The routes report the failure kind, so a missing model is not guessed from prose. */
function modelIsMissing(status, parsed) {
  return status === 404 || parsed?.providerError === 'model_not_found';
}

/** Call one route and return the parsed body plus the raw text. */
async function callRoute(route, body) {
  const response = await fetch(`${BASE}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { status: response.status, parsed, text };
}

/** The sample plan summary the routes expect. */
const PLAN_SUMMARY = 'A 120-guest wedding in a tier 2 city on 2026-12-05 with an indoor venue.';

const SNAPSHOT = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 120,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  contingencyMinor: 800_000,
  perGuestMinor: 83_333,
  categories: [{ label: 'Catering', amountMinor: 2_700_000, sharePercent: 30 }],
  healthScore: 62,
  healthBand: 'attention',
  nextMilestone: 'Shortlist venues',
  nextMilestoneDate: '2026-09-06',
  overdueCount: 0,
  milestonesDone: 3,
  milestonesTotal: 12,
  vendorCoveragePercent: 25,
  outstandingVendors: ['Sharma Caterers'],
  plates: 360,
  drinks: 480,
  dietary: ['vegetarian'],
  tasksDone: 2,
  tasksTotal: 6,
  topRisks: ['The venue is not booked yet.'],
};

const IDEAS_CONTEXT = {
  guests: 120,
  eventType: 'wedding',
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  perGuestMinor: 83_333,
  priorities: ['food'],
  dietary: ['vegetarian'],
  month: 12,
};

async function checkProvider(provider) {
  const key = process.env[provider.keyName];
  const model = process.env[provider.modelName] ?? DEFAULT_MODELS[provider.id];
  const checks = [];

  if (!key) {
    checks.push({ route: '/api/parse', result: 'skipped', detail: 'no key in the environment' });
    checks.push({ route: '/api/ideas', result: 'skipped', detail: 'no key in the environment' });
    checks.push({ route: '/api/chat', result: 'skipped', detail: 'no key in the environment' });
    return checks;
  }

  const server = await startServer(provider.id, {
    GATHERLY_AI_PROVIDER: provider.id,
    [provider.keyName]: key,
  });

  try {
    if (!server.ready) {
      for (const route of ['/api/parse', '/api/ideas', '/api/chat']) {
        checks.push({ route, result: 'fail', detail: 'the server did not start' });
      }
      return checks;
    }

    // Parse: free text into plan fields.
    const parse = await callRoute('/api/parse', {
      text: 'A wedding on 5 December for 120 guests in Pune, about 8 lakh rupees.',
    });
    if (modelIsMissing(parse.status, parse.parsed)) {
      say(`MODEL NOT FOUND: ${model} - set ${provider.modelName}`);
      checks.push({ route: '/api/parse', result: 'fail', detail: `model not found: ${model}` });
      return checks;
    }
    const parseOk =
      parse.status === 200 &&
      parse.parsed?.mode === 'provider' &&
      parse.parsed?.provider === provider.id &&
      parse.parsed?.fields &&
      Object.entries(PARSED_FIELD_TYPES).every(([key, types]) => {
        const value = parse.parsed.fields[key];
        return value !== undefined && types.includes(Array.isArray(value) ? 'array' : typeof value);
      }) &&
      !parse.text.includes(key);
    checks.push({
      route: '/api/parse',
      result: parseOk ? 'pass' : 'fail',
      detail: parseOk
        ? `mode=${parse.parsed.mode}, provider=${parse.parsed.provider}`
        : `status=${parse.status}, mode=${parse.parsed?.mode}, provider=${parse.parsed?.provider}`,
    });

    // Ideas: a list of ideas with the promised shape.
    const ideas = await callRoute('/api/ideas', {
      planSummary: PLAN_SUMMARY,
      context: IDEAS_CONTEXT,
    });
    if (modelIsMissing(ideas.status, ideas.parsed)) {
      say(`MODEL NOT FOUND: ${model} - set ${provider.modelName}`);
      checks.push({ route: '/api/ideas', result: 'fail', detail: `model not found: ${model}` });
      return checks;
    }
    const ideasOk =
      ideas.status === 200 &&
      ideas.parsed?.mode === 'provider' &&
      ideas.parsed?.provider === provider.id &&
      Array.isArray(ideas.parsed?.ideas) &&
      ideas.parsed.ideas.length > 0 &&
      ideas.parsed.ideas.every(ideaShapeIsRight) &&
      !ideas.text.includes(key);
    checks.push({
      route: '/api/ideas',
      result: ideasOk ? 'pass' : 'fail',
      detail: ideasOk
        ? `mode=${ideas.parsed.mode}, ${ideas.parsed.ideas.length} ideas`
        : `status=${ideas.status}, mode=${ideas.parsed?.mode}, provider=${ideas.parsed?.provider}`,
    });

    // Chat: the stream says which provider answered, then the answer.
    const chat = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What should we do next?',
        planSummary: PLAN_SUMMARY,
        snapshot: SNAPSHOT,
      }),
    });
    const chatText = await chat.text();
    const frames = readFrames(chatText);
    const modeFrame = frames.find((frame) => frame.name === 'mode');
    const doneFrame = frames.find((frame) => frame.name === 'done');
    // A streamed answer arrives in more than one delta; one delta would mean
    // the route is buffering the whole answer again.
    const deltaFrames = frames.filter(
      (frame) =>
        frame.name === 'delta' &&
        typeof frame.data?.text === 'string' &&
        frame.data.text.length > 0,
    );
    const answerText = deltaFrames.map((frame) => frame.data.text).join('');
    if (modelIsMissing(chat.status, doneFrame?.data)) {
      say(`MODEL NOT FOUND: ${model} - set ${provider.modelName}`);
      checks.push({ route: '/api/chat', result: 'fail', detail: `model not found: ${model}` });
      return checks;
    }
    const chatOk =
      chat.status === 200 &&
      modeFrame?.data?.provider === provider.id &&
      modeFrame?.data?.live === true &&
      deltaFrames.length > 1 &&
      answerText.length > 0 &&
      doneFrame?.data?.mode === 'provider' &&
      !chatText.includes(key);
    checks.push({
      route: '/api/chat',
      result: chatOk ? 'pass' : 'fail',
      detail: chatOk
        ? `provider=${modeFrame.data.provider}, ${deltaFrames.length} deltas, ${frames.length} frames`
        : `status=${chat.status}, provider=${modeFrame?.data?.provider}, live=${modeFrame?.data?.live}, deltas=${deltaFrames.length}, mode=${doneFrame?.data?.mode}`,
    });
  } finally {
    server.child.kill();
  }

  return checks;
}

async function main() {
  if (!existsSync(join(ROOT, '.next'))) {
    say('No production build found. Run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  const tested = PROVIDERS.filter((provider) => Boolean(process.env[provider.keyName]));

  say(`Live smoke test. Providers with a key: ${tested.map((p) => p.id).join(', ') || 'none'}.`);

  for (const provider of PROVIDERS) {
    if (!process.env[provider.keyName]) {
      say(`\n${provider.id}: no ${provider.keyName} in the environment, skipped.`);
      results.push({ provider: provider.id, checks: [] });
      continue;
    }

    const model = process.env[provider.modelName] ?? 'the default model';
    say(`\n${provider.id} (model ${model}):`);
    const checks = await checkProvider(provider);
    for (const check of checks) {
      say(`  ${check.route.padEnd(12)} ${check.result.toUpperCase()} ${check.detail}`);
    }
    results.push({ provider: provider.id, model, checks });
  }

  const failures = results
    .flatMap((entry) => entry.checks)
    .filter((check) => check.result === 'fail');
  say(
    `\n${failures.length === 0 ? 'All live checks passed or were skipped.' : `${failures.length} live checks failed.`}`,
  );
  if (failures.length > 0) process.exitCode = 1;
}

await main();
