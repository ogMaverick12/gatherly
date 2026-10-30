/** The fields this repository reads from a Lighthouse result. */
export interface LighthouseResult {
  readonly name: string;
  readonly url: string;
  readonly formFactor: string;
  readonly throttlingMethod: string;
  readonly throttling: {
    readonly downloadThroughputKbps: number;
    readonly uploadThroughputKbps: number;
    readonly cpuSlowdownMultiplier: number;
    readonly rttMs: number;
    readonly requestLatencyMs: number;
  };
  readonly planLoaded: boolean;
  readonly performance: number;
  readonly accessibility: number;
  readonly bestPractices: number;
  readonly seo: number;
  readonly lcp: number;
  readonly tbt: number;
  readonly cls: number;
  readonly bfCacheReasons: readonly string[];
  readonly reflowScore: number | null;
  readonly reflowSources: readonly {
    readonly source?: string | { readonly value?: string; readonly url?: string };
    readonly reflowTime: number;
  }[];
  readonly run?: number;
}

/** List every URL/form factor whose median CLS is above the target. */
export function clsFinding(results: readonly LighthouseResult[]): string[];

/** Build SUMMARY.md from the reports that were just produced. */
export function writeSummary(out: string, results: readonly LighthouseResult[]): void;
