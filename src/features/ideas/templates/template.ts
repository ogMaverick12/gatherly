/**
 * The idea-template shape.
 *
 * A template carries fixed words plus two closures that tune and score them
 * against the user's context, so no template needs to know about any other.
 */

import type { EventType } from '@/lib/plan';
import type { IdeaContext } from '../context';

/** One idea template: the words, plus the two functions that tune them. */
export type CostImpact = 'none' | 'low' | 'medium' | 'high';

export interface IdeaTemplate {
  readonly id: string;
  readonly eventTypes: readonly EventType[] | 'all';
  readonly title: string;
  readonly body: string;
  readonly rationale: (context: IdeaContext) => string;
  readonly costImpact: CostImpact;
  readonly tags: readonly string[];
  /** 0 excludes the idea, higher numbers are more relevant. */
  readonly relevance: (context: IdeaContext) => number;
}
