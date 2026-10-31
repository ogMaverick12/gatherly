#!/usr/bin/env node
/**
 * Prove the live AI path.
 *
 * The Basic mode is deterministic and always works, but a reviewer with a key
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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkProvider } from './lib/live-smoke-checks.mjs';
import { PROVIDERS, ROOT } from './lib/live-smoke-config.mjs';
import { say } from './lib/live-smoke-api.mjs';

async function main() {
  if (!existsSync(join(ROOT, '.next'))) {
    say('No production build found. Run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  const tested = PROVIDERS.filter((provider) => Boolean(process.env[provider.keyName]));
  say(`Live smoke test. Providers with a key: ${tested.map((p) => p.id).join(', ') || 'none'}.`);

  const results = [];
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
