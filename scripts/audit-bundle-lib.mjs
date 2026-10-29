import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import { arch, platform, release } from 'node:os';
import { join, relative, sep } from 'node:path';
const ROOT = process.cwd();
const AUDIT = join(ROOT, 'audit');
const OUT = join(AUDIT, 'outputs');
const MAX = 64 * 1024 * 1024;
const CODE = ['*.ts', '*.tsx', '*.js', '*.mjs', '*.cjs'];
const ANY_TYPE =
  '(:[[:space:]]*any[[:space:]]*([;,)=>\]]|\\|)|as[[:space:]]+any\\b|<any>|any\\[\\]|=[[:space:]]*any\\b)';
const AS_CAST = '(^|[^A-Za-z0-9_])as[[:space:]]+never|as[[:space:]]+unknown[[:space:]]+as';
const HEX = '#[0-9A-Fa-f]{3,8}\\b';
const ANIME = '[\'"]anime' + 'js[\'"]';
const outsideTokens = (f) => f !== 'src/app/globals.css' && !/(^|\/)tokens\.ts$/.test(f);
const notMotion = (f) => !f.startsWith('src/lib/motion/') && f !== 'eslint.config.mjs';
/** Run a shell command, returning its status and trimmed pipes. */
export function sh(command) {
  const r = spawnSync(command, { cwd: ROOT, encoding: 'utf8', shell: true, maxBuffer: MAX });
  return { code: r.status, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() };
}
function lineCount(text) {
  return text === '' ? 0 : text.replace(/\r?\n$/, '').split(/\r?\n/).length;
}
function inventoryFiles() {
  const tracked = sh('git ls-files').out.split(/\r?\n/).filter(Boolean);
  const paths = [
    ...new Set(
      tracked.flatMap((p) => {
        const parts = p.split('/');
        return parts.slice(0, 3).map((_, i) => parts.slice(0, i + 1).join('/'));
      }),
    ),
  ].sort();
  const tree = paths.map(
    (p) =>
      `${'  '.repeat(p.split('/').length - 1)}${p.split('/').pop()}${tracked.some((f) => f.startsWith(`${p}/`)) ? '/' : ''}`,
  );
  const source = tracked.filter((f) => /^(src|scripts)\//.test(f) && /\.(ts|tsx|mjs)$/.test(f));
  const largest = source
    .map((f) => ({ f, n: lineCount(fs.readFileSync(join(ROOT, f), 'utf8')) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 25);
  const tests = tracked
    .filter((f) => /^tests\/.*\.(test|spec)\.(ts|tsx)$/.test(f))
    .map(
      (f) =>
        `| \`${f}\` | ${(fs.readFileSync(join(ROOT, f), 'utf8').match(/^\s*(?:it|test)(?:\.(?:each|skip|only|concurrent)\([^\n]*\))?\s*\(/gm) ?? []).length} |`,
    );
  return { tree, largest, tests };
}
function inventoryTables() {
  const tracked = sh('git ls-files').out.split(/\r?\n/).filter(Boolean);
  const pkg = JSON.parse(fs.readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const reasons = new Map(
    [
      ...fs
        .readFileSync(join(ROOT, 'README.md'), 'utf8')
        .replace(/\r\n/g, '\n')
        .matchAll(/^\|\s+`([^`]+)`\s+\|\s+[^|]+\s+\|\s+(.*?)\s+\|$/gm),
    ].map((m) => [m[1], m[2].trim()]),
  );
  const deps = [
    ['runtime', pkg.dependencies],
    ['dev', pkg.devDependencies],
  ].flatMap(([scope, group]) =>
    Object.keys(group).map(
      (n) => `| \`${n}\` | ${scope} | ${reasons.get(n) ?? '**MISSING FROM README**'} |`,
    ),
  );
  const routes = tracked
    .filter((f) => /^src\/app\/api\/.*\/route\.ts$/.test(f))
    .map((f) => {
      const settings = [
        ...fs
          .readFileSync(join(ROOT, f), 'utf8')
          .matchAll(/export const (runtime|dynamic|revalidate|fetchCache)\s*=\s*([^;\n]+)/g),
      ];
      return `| \`${f}\` | ${settings.length ? settings.map((m) => `${m[1]}=${m[2].trim()}`).join(', ') : '(none declared)'} |`;
    });
  return { deps, routes };
}
/** Build inventory.md from tracked files and the README. */
export function writeInventory() {
  const { tree, largest, tests } = inventoryFiles();
  const { deps, routes } = inventoryTables();
  fs.writeFileSync(
    join(AUDIT, 'inventory.md'),
    `# Inventory\n\n## File tree (three levels)\n\`\`\`text\n${tree.join('\n')}\n\`\`\`\n\n## 25 largest source files\n| File | Lines |\n| --- | --- |\n${largest.map((e) => `| \`${e.f}\` | ${e.n} |`).join('\n')}\n\n## Test declarations per file\nCounted from source declarations of \`it\`/\`test\`; parameterized declarations count once.\n| File | Declarations |\n| --- | --- |\n${tests.join('\n')}\n\n## Dependencies and README reasons\n| Package | Scope | README reason |\n| --- | --- | --- |\n${deps.join('\n')}\n\n## API routes and runtime settings\n| Route | Declared settings |\n| --- | --- |\n${routes.join('\n')}\n`,
  );
}
function grep(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: MAX });
  return r.status === 2
    ? `SEARCH ERROR: ${(r.stderr ?? '').trim() || 'git grep failed'}`
    : (r.stdout ?? '').trim() || 'none';
}
function block(title, pattern, paths = CODE, keep = (f) => !f.startsWith('scripts/audit-bundle')) {
  const args = ['grep', '-n', '-I', '-E', pattern, '--', ...paths];
  const output =
    grep(args)
      .split(/\r?\n/)
      .filter((line) => line.trim() && keep(line.split(':')[0]))
      .join('\n') || 'none';
  return `## ${title}\n\n\`git ${args.join(' ')}\`\n\n\`\`\`text\n${output}\n\`\`\`\n`;
}

function searchBlocks() {
  const api =
    spawnSync('git', ['grep', '-L', '-E', 'createRoute|createGetRoute', '--', 'src/app/api'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).stdout?.trim() || 'none';
  return [
    block("'any' types (type positions)", ANY_TYPE),
    block('ts-ignore, ts-expect-error, ts-nocheck', '@ts-(ignore|expect-error|nocheck)'),
    block('non-null assertions', '([A-Za-z0-9_$)]|\\])' + '!([^=!]|$)'),
    block("'as never' and 'as unknown as'", AS_CAST),
    block('console.*', 'console\\.'),
    block('eslint-' + 'disable', 'eslint-' + 'disable'),
    block('TO' + 'DO and FIX' + 'ME', 'TO' + 'DO|FIX' + 'ME'),
    block(
      'hex colours outside globals.css and tokens.ts',
      HEX,
      ['*.ts', '*.tsx', '*.css'],
      outsideTokens,
    ),
    block('anime' + 'js imports outside src/lib/motion', ANIME, CODE, notMotion),
    block('dangerouslySet' + 'InnerHTML', 'dangerouslySet' + 'InnerHTML'),
    block('process.env', 'process\\.env'),
    `## API routes without createRoute/createGetRoute\n\n\`git grep -L -E 'createRoute|createGetRoute' -- 'src/app/api'\`\n\n\`\`\`text\n${api}\n\`\`\`\n`,
  ];
}

/** Build checks.md; size lists come only from stats's raw transcript. */
export function writeChecks() {
  const raw = fs.readFileSync(join(OUT, 'stats.txt'), 'utf8');
  const stats = `## Files over 200 lines, functions over 40 lines, exports without JSDoc\n\nSource: only \`node scripts/stats.mjs\` (raw transcript below).\n\n\`\`\`text\n${raw}\n\`\`\`\n`;
  fs.writeFileSync(join(AUDIT, 'checks.md'), `# Checks\n\n${searchBlocks().join('\n')}${stats}`);
}

/** Scan tracked files and audit/ without ever returning the matched text. */
export function scanSecrets() {
  const patterns = [
    ['AIza key', new RegExp('AI' + 'za[0-9A-Za-z_-]{35}', 'g')],
    ['sk- key', new RegExp('sk' + '-[A-Za-z0-9]{20,}', 'g')],
    ['Bearer token', new RegExp('Bear' + 'er\\s+[A-Za-z0-9._~+/-]{20,}', 'g')],
    ['private key', new RegExp('-{5}' + 'BEGIN', 'g')],
  ];
  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  const files = [
    ...sh('git ls-files -z')
      .out.split('\0')
      .filter((f) => f && fs.existsSync(join(ROOT, f)))
      .map((f) => [join(ROOT, f), f]),
    ...walk(AUDIT)
      .filter((f) => !f.endsWith('secrets.txt'))
      .map((f) => [f, relative(ROOT, f).split(sep).join('/')]),
  ];
  const hits = [];
  for (const [full, shown] of files) {
    const text = fs.readFileSync(full, 'utf8');
    for (const [name, pattern] of patterns)
      for (const m of text.matchAll(pattern))
        hits.push(`${shown}:${text.slice(0, m.index).split(/\r?\n/).length} ${name}`);
  }
  const unique = [...new Set(hits)].sort();
  fs.writeFileSync(
    join(AUDIT, 'secrets.txt'),
    `# Secret pattern scan\n# Only file:line and the pattern name are recorded; matched text is never written.\n${unique.length ? unique.join('\n') : 'no hits'}\n`,
  );
  return unique;
}

/** Write REPORT.md with provenance and the command result table. */
export function writeReport(results) {
  const status = sh('git status --short').out;
  const rows = results.map(
    (r, i) =>
      `| ${i + 1} | \`${r.command}\` | ${r.code} | ${r.duration} ms | \`audit/outputs/${r.name}.txt\` |`,
  );
  fs.writeFileSync(
    join(AUDIT, 'REPORT.md'),
    `# Audit bundle report\n\nGenerated: ${new Date().toISOString()}\nCommit: ${sh('git rev-parse HEAD').out}\nBranch: ${sh('git rev-parse --abbrev-ref HEAD').out}\nNode: ${process.version}\nnpm: ${sh('npm --version').out}\nOS: ${platform()} ${release()} ${arch()}\n\n## Working tree at report time\n\`\`\`text\n${status || '(empty)'}\n\`\`\`\n\n## Commands\n| # | Command | Exit code | Duration | Raw transcript |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nA non-zero exit for \`npm audit\` or \`npx depcheck\` is recorded, not hidden; see NOTES.md.\nThe only skipped command is live-smoke, which the owner runs with keys.\n`,
  );
  if (status) process.exitCode = 1;
}

/** Write audit/git.txt with history since the root commit. */
export function writeGitLog() {
  const range = `${sh('git rev-list --max-parents=0 HEAD').out.split(/\r?\n/)[0]}..HEAD`;
  fs.writeFileSync(
    join(AUDIT, 'git.txt'),
    `$ git log --oneline --stat ${range}\n${sh(`git log --oneline --stat ${range}`).out}\n\n$ git diff --stat ${range}\n${sh(`git diff --stat ${range}`).out}\n`,
  );
}
