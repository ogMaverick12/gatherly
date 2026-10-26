/**
 * Budget services.
 *
 * The engine is split by responsibility across the modules next to this one:
 * the weights, the types, the allocation, the warnings and the scenarios. They
 * are re-exported here so every existing `@/features/budget/services` import
 * keeps working.
 */

export * from './allocate';
export * from './scenarios';
export * from './types';
export * from './warnings';
export * from './weights';
