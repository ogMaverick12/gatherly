import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { aggregate, mobileTargets, throttlingLabel } from './lighthouse-stats.mjs';

/**
 * Turn Lighthouse JSON reports into the one-page summary.
 *
 * Every comparison row is a median across the runs. Findings are generated
 * from those rows, so a layout-shift sentence cannot drift from the table.
 */

/** Turn a Lighthouse source value into a short label. */
function describeSource(source) {
  const value = source?.source;
  if (typeof value === 'string') return value;
  if (value?.type === 'text') return value.value;
  if (value?.url) return value.url;
  return value?.value ?? 'unattributed';
}

/** List every URL/form factor whose median CLS is above the target. */
export function clsFinding(results) {
  const rows = results.filter((result) => result.cls > 0.1);
  const lines = ['### Layout shift', ''];
  if (rows.length === 0) {
    lines.push('No URL/form factor has a median CLS above 0.1.');
  } else {
    for (const result of rows) {
      lines.push(`- ${result.url} (${result.formFactor}): CLS ${result.cls.toFixed(3)}`);
    }
  }
  lines.push('');
  return lines;
}

/** The forced-reflow source rows, generated from the reports. */
function reflowFinding(results) {
  const rows = results.flatMap((result) =>
    result.reflowSources.map((source) => ({
      report: `${result.url} (${result.formFactor})`,
      label: describeSource(source),
      time: source.reflowTime,
    })),
  );
  const lines = ['### Forced reflow', ''];
  if (rows.length === 0) {
    lines.push('No forced-reflow source rows were reported.');
  } else {
    for (const row of rows) {
      lines.push(`- ${row.report}: ${row.label}, ${Math.round(row.time)} ms`);
    }
  }
  lines.push('');
  return lines;
}

/** The back/forward-cache reasons, generated from the reports. */
function bfCacheFinding(results) {
  const reasons = [...new Set(results.flatMap((result) => result.bfCacheReasons))].filter(Boolean);
  const lines = ['### Back/forward cache', ''];
  if (reasons.length === 0) {
    lines.push('No back/forward-cache reasons were reported.');
  } else {
    for (const reason of reasons) lines.push(`- ${reason}`);
  }
  lines.push('');
  return lines;
}

/** Build SUMMARY.md from the reports that were just produced. */
export function writeSummary(out, results) {
  const medians = aggregate(results);
  const runCount = new Set(results.map((result) => result.run ?? 1)).size;
  const lines = [
    '# Lighthouse summary',
    '',
    'The built app was served with `next start`. Chromium was launched through Playwright',
    'with a CDP port, the sample wedding plan was created, and a priming visit registered',
    'the service worker before Lighthouse ran with `--disable-storage-reset` against that',
    'same profile. A discarded warm-up audit primed the browser before the measured runs.',
    'The table below is the median',
    `of ${runCount} run${runCount === 1 ? '' : 's'} per URL/form factor; raw reports are in`,
    '`run-1/`, `run-2/` and so on.',
    '',
    '| URL | Form factor | Throttling | Plan loaded | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const result of medians) {
    lines.push(
      `| ${result.url} | ${result.formFactor} | ${throttlingLabel(result)} | ${result.planLoaded ? 'yes' : 'no'} | ${result.performance} | ${result.accessibility} | ${result.bestPractices} | ${result.seo} | ${(result.lcp / 1000).toFixed(2)} s | ${Math.round(result.tbt)} ms | ${result.cls.toFixed(3)} |`,
    );
  }
  lines.push(
    '',
    ...mobileTargets(medians),
    '## Findings',
    '',
    ...clsFinding(medians),
    ...reflowFinding(results),
    ...bfCacheFinding(results),
  );
  writeFileSync(join(out, 'SUMMARY.md'), `${lines.join('\n')}\n`);
}
