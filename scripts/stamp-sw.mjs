import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Stamp the service worker with the build id.
 *
 * Next writes a fresh `.next/BUILD_ID` on every build. The worker uses it to
 * version its caches, so a deploy cannot keep serving the previous shell.
 */

const root = process.cwd();
const buildId = readFileSync(join(root, '.next', 'BUILD_ID'), 'utf8').trim();
if (!buildId) throw new Error('The build id is empty.');

const workerPath = join(root, 'public', 'sw.js');
const source = readFileSync(workerPath, 'utf8');
const placeholder = /^const BUILD_ID = .*;$/m;
if (!placeholder.test(source)) {
  throw new Error('public/sw.js has no BUILD_ID placeholder to stamp.');
}

const stamped = source.replace(placeholder, `const BUILD_ID = ${JSON.stringify(buildId)};`);
writeFileSync(workerPath, stamped);
