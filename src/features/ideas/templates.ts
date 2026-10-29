/**
 * The idea-template catalogue.
 *
 * Four groups are concatenated into one list; the scorer filters by event type
 * and ranks the rest, so order here is only a stable tie-breaker.
 */

import { BIRTHDAY_IDEAS } from './templates/birthday';
import { COMMUNITY_IDEAS } from './templates/community';
import { GENERIC_IDEAS } from './templates/generic';
import type { IdeaTemplate } from './templates/template';
import { WEDDING_IDEAS } from './templates/wedding';

/**
 * Every idea template, in the order the scoring expects. The groups are kept
 * apart only so no one file has to hold all of them.
 */
export const TEMPLATES: readonly IdeaTemplate[] = [
  ...GENERIC_IDEAS,
  ...WEDDING_IDEAS,
  ...BIRTHDAY_IDEAS,
  ...COMMUNITY_IDEAS,
];
