import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { BASE, PARSED_FIELD_TYPES, PORT, ROOT } from './live-smoke-config.mjs';

/** Print one line to stdout. */
export function say(message) {
  process.stdout.write(`${message}\n`);
}

/** Read the SSE frames of a chat answer. */
export function readFrames(text) {
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
export async function waitForServer(attempts = 60) {
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
export async function startServer(env) {
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
export function modelIsMissing(status, parsed) {
  return status === 404 || parsed?.providerError === 'model_not_found';
}

/** Call one route and return the parsed body plus the raw text. */
export async function callRoute(route, body) {
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

/** Check that every parsed field has one of the published JSON types. */
export function fieldsAreTyped(fields) {
  return Object.entries(PARSED_FIELD_TYPES).every(([key, types]) => {
    const value = fields[key];
    return value !== undefined && types.includes(Array.isArray(value) ? 'array' : typeof value);
  });
}

/** Read the mode, delta and done frames from a chat stream. */
export function chatFrames(chatText) {
  const frames = readFrames(chatText);
  // A streamed answer arrives in more than one delta; one delta would mean
  // the route is buffering the whole answer again.
  const deltaFrames = frames.filter(
    (frame) =>
      frame.name === 'delta' && typeof frame.data?.text === 'string' && frame.data.text.length > 0,
  );
  return {
    frames,
    modeFrame: frames.find((frame) => frame.name === 'mode'),
    doneFrame: frames.find((frame) => frame.name === 'done'),
    deltaFrames,
    answerText: deltaFrames.map((frame) => frame.data.text).join(''),
  };
}
