import type { ProviderIdea } from '@/lib/api-schema';
import { formatMinor } from '@/lib/money';
import type { CityTier, Idea } from '@/lib/plan';
import type { IdeaContext } from './context';
import { TEMPLATES } from './templates';

function tierNote(tier: CityTier): string {
  if (tier === 'tier1') return 'a high-cost city, where permits and peak-season dates go early';
  if (tier === 'tier2') return 'a regional city, where the venue calendar fills a few months out';
  return 'a smaller town, where the local suppliers know each other and the dates move slower';
}

/**
 * Turn validated model ideas into the shape the app stores and shows.
 *
 * @param ideas the schemas' ideas, already checked by the route
 * @returns the same ideas with an id and the provider source
 */
export function providerIdeas(ideas: readonly ProviderIdea[]): Idea[] {
  return ideas.map((idea, index) => ({
    id: `provider-idea-${index + 1}`,
    title: idea.title,
    body: idea.body,
    rationale: idea.rationale,
    costImpactMinor: null,
    tags: idea.tags,
    source: 'provider',
  }));
}

export function generateIdeas(context: IdeaContext): Idea[] {
  const applicable = TEMPLATES.filter(
    (template) => template.eventTypes === 'all' || template.eventTypes.includes(context.eventType),
  );
  const scored = applicable
    .map((template) => ({
      template,
      score: template.relevance(context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.template.id.localeCompare(b.template.id));

  return scored.slice(0, 12).map(({ template }) => ({
    id: template.id,
    title: template.title,
    body: template.body,
    rationale: template.rationale(context),
    costImpactMinor: null,
    tags: [...template.tags],
    source: 'basic' as const,
  }));
}

/** A short, plan-specific summary used by the assistant and the overview. */
export function describePlanShape(context: IdeaContext): string {
  return `${context.guests} guests, ${formatMinor(context.perGuestMinor, context.currency)} per guest, in ${tierNote(context.cityTier)}.`;
}
