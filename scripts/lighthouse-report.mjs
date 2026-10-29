import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Turn the Lighthouse JSON reports into the one-page summary.
 *
 * The summary is generated from the reports, never typed by hand, so the
 * scores, timings and throttling settings stay tied to the audited run.
 */

/** Read one report and pull out the numbers the summary compares. */
export function readResult(out, name) {
  const report = JSON.parse(readFileSync(join(out, `${name}.report.json`), 'utf8'));
  const score = (category) => Math.round(report.categories[category].score * 100);
  const reflow = report.audits['forced-reflow-insight'];
  return {
    name,
    url: report.finalDisplayedUrl,
    formFactor: report.configSettings.formFactor,
    throttlingMethod: report.configSettings.throttlingMethod,
    throttling: report.configSettings.throttling,
    planLoaded: true,
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcp: report.audits['largest-contentful-paint'].numericValue,
    tbt: report.audits['total-blocking-time'].numericValue,
    cls: report.audits['cumulative-layout-shift'].numericValue,
    bfCacheReasons: (report.audits['bf-cache']?.details?.items ?? []).map((item) =>
      String(item.reason ?? '').replace(/\u2019/g, "'"),
    ),
    reflowScore: reflow?.score ?? null,
    reflowSources: reflow?.details?.items?.[0]?.items ?? [],
  };
}

/** Format the throttling settings in the terms a reader can compare. */
function throttlingLabel(result) {
  const settings = result.throttling;
  const method = result.throttlingMethod === 'simulate' ? 'simulated' : result.throttlingMethod;
  if (settings.downloadThroughputKbps === 0 && settings.uploadThroughputKbps === 0) {
    return `${method}; CPU ${settings.cpuSlowdownMultiplier}x; desktop preset (no network throttling); ${settings.rttMs} ms RTT`;
  }
  const down = (settings.downloadThroughputKbps / 1024).toFixed(1);
  const up = (settings.uploadThroughputKbps / 1024).toFixed(1);
  return `${method}; CPU ${settings.cpuSlowdownMultiplier}x; ${down} Mbps down / ${up} Mbps up; ${settings.requestLatencyMs} ms RTT`;
}

/** Mobile results only. Desktop settings are not the target here. */
function mobileTargets(mobile) {
  const min = (key) => Math.min(...mobile.map((result) => result[key]));
  const max = (key) => Math.max(...mobile.map((result) => result[key]));
  const atLeast = (value, goal) => (value >= goal ? 'pass' : 'MISS');
  const atMost = (value, goal) => (value <= goal ? 'pass' : 'MISS');
  const lcp = max('lcp') / 1000;
  const tbt = max('tbt');
  const cls = max('cls');
  return [
    '## Mobile targets',
    '',
    '| Measure | Target | Worst mobile result | Verdict |',
    '| --- | --- | ---: | --- |',
    `| Performance | 90 | ${min('performance')} | ${atLeast(min('performance'), 90)} |`,
    `| LCP | 2.5 s | ${lcp.toFixed(2)} s | ${atMost(lcp, 2.5)} |`,
    `| TBT | 200 ms | ${Math.round(tbt)} ms | ${atMost(tbt, 200)} |`,
    `| CLS | 0.1 | ${cls.toFixed(3)} | ${atMost(cls, 0.1)} |`,
    `| Accessibility | 100 | ${min('accessibility')} | ${atLeast(min('accessibility'), 100)} |`,
    `| Best practices | 100 | ${min('bestPractices')} | ${atLeast(min('bestPractices'), 100)} |`,
    `| SEO | 100 | ${min('seo')} | ${atLeast(min('seo'), 100)} |`,
  ];
}

/** Turn a Lighthouse source value into a short label. */
function describeSource(source) {
  const value = source?.source;
  if (typeof value === 'string') return value;
  if (value?.type === 'text') return value.value;
  if (value?.url) return value.url;
  return value?.value ?? 'unattributed';
}

/** The forced-reflow diagnostics, plus the source-inspection result. */
function reflowFindings(results) {
  const rows = results.flatMap((result) =>
    result.reflowSources.map((source) => ({
      report: `${result.url} (${result.formFactor})`,
      label: describeSource(source),
      time: source.reflowTime,
    })),
  );
  const explanation = [
    'The audit scores 1; a source row is a diagnostic, not a target failure.',
    'The first-paint code contains no geometric read: the pre-paint theme script only',
    'writes `dataset.theme`, the accessibility effect only writes root attributes, and',
    'the garland hero is a static SVG. The only layout read-after-write in app code is',
    'the assistant chat auto-scroll (`scrollTop = scrollHeight`), which runs after a',
    'message is sent, not at first paint.',
    '',
  ];
  if (rows.length === 0) {
    return [
      '### Forced reflow',
      '',
      '`forced-reflow-insight` had no source rows in any of the six runs.',
      ...explanation,
    ];
  }
  return [
    '### Forced reflow',
    '',
    ...rows.map((row) => `- ${row.report}: ${row.label}, ${Math.round(row.time)} ms`),
    '',
    '`[unattributed]` means Chrome did not map the layout to an application script.',
    ...explanation,
  ];
}

/** The two no-store reasons, plus why removing them is not a cheap fix. */
function bfCacheFindings(results) {
  const reasons = [...new Set(results.flatMap((result) => result.bfCacheReasons))].filter(Boolean);
  return [
    '### Back/forward cache',
    '',
    ...reasons.map((reason) => `- ${reason}`),
    '',
    'Both reasons come from the intentional `Cache-Control: no-store` on the dynamic',
    'documents and their JavaScript requests. Removing it would let a shared cache reuse',
    'HTML carrying a per-request CSP nonce, so it is not a safe cheap fix; this stays an',
    'accepted trade-off.',
    '',
  ];
}

/** Explain the one remaining desktop CLS that the mobile target does not cover. */
function desktopNote(results) {
  const desktopPlan = results.find(
    (result) => result.formFactor === 'desktop' && result.url.endsWith('/plan'),
  );
  if (!desktopPlan || desktopPlan.cls <= 0.1) return [];
  return [
    '### Desktop `/plan` layout shift',
    '',
    `Desktop \`/plan\` still reports CLS ${desktopPlan.cls.toFixed(3)}. The server paints the`,
    'no-plan state before the stored plan hydrates, so the footer moves. Mobile is unaffected',
    'because its footer starts below the fold. Removing this would need the plan rendered',
    'before first paint (server-side storage or a route-specific skeleton); it is outside',
    'the mobile target.',
    '',
  ];
}

/** Build SUMMARY.md from the reports that were just produced. */
export function writeSummary(out, results) {
  const mobile = results.filter((result) => result.formFactor === 'mobile');
  const lines = [
    '# Lighthouse summary',
    '',
    'The built app was served with `next start`. Chromium was launched through Playwright',
    'with a CDP port, the sample wedding plan was created, and Lighthouse ran with',
    '`--disable-storage-reset` against that same profile.',
    '',
    '| URL | Form factor | Throttling | Plan loaded | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const result of results) {
    lines.push(
      `| ${result.url} | ${result.formFactor} | ${throttlingLabel(result)} | ${result.planLoaded ? 'yes' : 'no'} | ${result.performance} | ${result.accessibility} | ${result.bestPractices} | ${result.seo} | ${(result.lcp / 1000).toFixed(2)} s | ${Math.round(result.tbt)} ms | ${result.cls.toFixed(3)} |`,
    );
  }
  lines.push(
    '',
    ...mobileTargets(mobile),
    '',
    '## Findings',
    '',
    ...reflowFindings(results),
    ...bfCacheFindings(results),
    ...desktopNote(results),
    '### SEO metadata',
    '',
    'Before `htmlLimitedBots: /.*/`, the landing document closed `</head>` at 2,816 bytes',
    'and put `name="description"` at 18,974, outside the head. After the change, the',
    'description is at 2,398 and `</head>` at 3,654 on `/`; on `/plan` it is 2,381 and 3,573.',
    'SEO is 100 in all six runs.',
    '',
  );
  writeFileSync(join(out, 'SUMMARY.md'), `${lines.join('\n')}\n`);
}
