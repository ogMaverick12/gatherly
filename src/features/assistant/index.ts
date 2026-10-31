/**
 * Public assistant API: the deterministic answer, intent, parsing and snapshot.
 */

export { buildBasicAnswer, renderSnapshotForModel, topShare } from './answer';
export { classifyIntent } from './intent';
export { parseFreeText } from './parse';
export { buildSnapshot } from './snapshot';
export type { PlanSnapshot } from '@/lib/plan-snapshot';
