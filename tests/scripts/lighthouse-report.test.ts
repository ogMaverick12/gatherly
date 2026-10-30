import { describe, expect, it } from 'vitest';
import { clsFinding } from '../../scripts/lighthouse-report.mjs';
import type { LighthouseResult } from '../../scripts/lighthouse-report.mjs';

function result(url: string, formFactor: string, cls: number): LighthouseResult {
  return {
    name: `${formFactor}-result`,
    url,
    formFactor,
    throttlingMethod: 'simulate',
    throttling: {
      downloadThroughputKbps: 1_474,
      uploadThroughputKbps: 737,
      cpuSlowdownMultiplier: 4,
      rttMs: 150,
      requestLatencyMs: 562.5,
    },
    planLoaded: true,
    performance: 85,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    lcp: 1_000,
    tbt: 100,
    cls,
    bfCacheReasons: [],
    reflowScore: 1,
    reflowSources: [],
    run: 1,
  };
}

describe('the generated layout-shift finding', () => {
  it('names every URL and form factor above 0.1', () => {
    const lines = clsFinding([
      result('https://gatherly.example/plan', 'mobile', 0.235),
      result('https://gatherly.example/plan', 'desktop', 0.212),
      result('https://gatherly.example/', 'mobile', 0.05),
    ]);

    const text = lines.join('\n');
    expect(text).toContain('https://gatherly.example/plan (mobile): CLS 0.235');
    expect(text).toContain('https://gatherly.example/plan (desktop): CLS 0.212');
    expect(text).not.toContain('https://gatherly.example/ (mobile)');
  });
});
