import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Read one Lighthouse report and pull out the numbers the summary compares. */
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

/** The middle value, or the mean of the two middle values. */
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

const METRICS = ['performance', 'accessibility', 'bestPractices', 'seo', 'lcp', 'tbt', 'cls'];

/** Collapse all runs of each URL/form factor into one median row. */
export function aggregate(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.url}\u0000${result.formFactor}`;
    const group = groups.get(key) ?? { ...result, values: [] };
    group.values.push(result);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const medians = Object.fromEntries(
      METRICS.map((metric) => [
        metric,
        median(group.values.map((result) => Number(result[metric]))),
      ]),
    );
    return {
      ...group,
      ...medians,
      planLoaded: group.values.every((result) => result.planLoaded),
      runs: group.values.length,
    };
  });
}

/** Format the throttling settings in the terms a reader can compare. */
export function throttlingLabel(result) {
  const settings = result.throttling;
  const method = result.throttlingMethod === 'simulate' ? 'simulated' : result.throttlingMethod;
  if (settings.downloadThroughputKbps === 0 && settings.uploadThroughputKbps === 0) {
    return `${method}; CPU ${settings.cpuSlowdownMultiplier}x; desktop preset (no network throttling); ${settings.rttMs} ms RTT`;
  }
  const down = (settings.downloadThroughputKbps / 1024).toFixed(1);
  const up = (settings.uploadThroughputKbps / 1024).toFixed(1);
  return `${method}; CPU ${settings.cpuSlowdownMultiplier}x; ${down} Mbps down / ${up} Mbps up; ${settings.requestLatencyMs} ms RTT`;
}

/** The requested mobile /plan targets, read from the median row. */
export function mobileTargets(medians) {
  const target = medians.find(
    (result) => result.formFactor === 'mobile' && result.url.endsWith('/plan'),
  );
  if (!target) {
    return ['## Mobile `/plan` targets', '', 'No mobile `/plan` result was produced.', ''];
  }
  const atLeast = (value, goal) => (value >= goal ? 'pass' : 'MISS');
  const atMost = (value, goal) => (value <= goal ? 'pass' : 'MISS');
  return [
    '## Mobile `/plan` targets',
    '',
    '| Measure | Target | Median result | Verdict |',
    '| --- | --- | ---: | --- |',
    `| Performance | 85 | ${target.performance} | ${atLeast(target.performance, 85)} |`,
    `| LCP | 2.5 s | ${(target.lcp / 1000).toFixed(2)} s | ${atMost(target.lcp / 1000, 2.5)} |`,
    `| TBT | 300 ms | ${Math.round(target.tbt)} ms | ${atMost(target.tbt, 300)} |`,
    `| CLS | 0.1 | ${target.cls.toFixed(3)} | ${atMost(target.cls, 0.1)} |`,
    `| Accessibility | 100 | ${target.accessibility} | ${atLeast(target.accessibility, 100)} |`,
    `| Best practices | 100 | ${target.bestPractices} | ${atLeast(target.bestPractices, 100)} |`,
    `| SEO | 100 | ${target.seo} | ${atLeast(target.seo, 100)} |`,
    '',
  ];
}
