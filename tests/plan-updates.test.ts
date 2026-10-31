import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  taskId,
  toStoredMilestones,
  withChatMessage,
  withIdeaApplied,
  withIdeasStored,
  withMilestoneToggled,
  withTaskToggled,
  withVendorAdded,
  withVendorUpdated,
  computePlanView,
} from '@/features/workspace';
import type { ChatMessage, Idea, PlanTask, Vendor } from '@/lib/plan';
import { makePlan, makeVendor } from './factories';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeIdea(patch: Partial<Idea> = {}): Idea {
  return {
    id: 'idea_1',
    title: 'Add a welcome drink',
    body: 'A small, useful touch.',
    rationale: 'It gives guests something to do on arrival.',
    costImpactMinor: null,
    tags: [],
    source: 'basic',
    ...patch,
  };
}

function makeTask(patch: Partial<PlanTask> = {}): PlanTask {
  return {
    id: 'task_1',
    title: 'Book the venue',
    done: false,
    area: 'vendors',
    ...patch,
  };
}

function makeMessage(content: string): ChatMessage {
  return {
    id: `chat_${content}`,
    role: 'assistant',
    content,
    mode: 'basic',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('storing milestone and task changes', () => {
  it('keeps the computed ladder fields when storing milestones', () => {
    const milestones = computePlanView(makePlan(), '2026-10-22').milestones;
    const stored = toStoredMilestones(milestones);
    expect(stored[0]).toEqual({
      id: milestones[0]?.id,
      title: milestones[0]?.title,
      date: milestones[0]?.date,
      offsetDays: milestones[0]?.offsetDays,
      done: milestones[0]?.done,
      owner: milestones[0]?.owner,
      whyItMatters: milestones[0]?.whyItMatters,
    });
  });

  it('flips a known task and leaves unknown ids alone', () => {
    const plan = { ...makePlan(), tasks: [makeTask()] };
    const flipped = withTaskToggled(plan, 'task_1');
    expect(flipped.tasks[0]?.done).toBe(true);
    expect(withTaskToggled(plan, 'missing')).toEqual(plan);
  });

  it('flips a known milestone and restores the ladder', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T00:00:00.000Z'));
    const plan = makePlan();
    const first = computePlanView(plan, '2026-10-22').milestones[0];
    expect(first).toBeDefined();
    const flipped = withMilestoneToggled(plan, first?.id ?? '');
    expect(flipped.milestones[0]?.done).toBe(!first?.done);
    expect(withMilestoneToggled(plan, 'missing').milestones[0]?.done).toBe(first?.done);
  });
});

describe('vendor changes', () => {
  const vendor: Vendor = makeVendor();

  it('patches a known vendor and ignores an unknown id', () => {
    const plan = { ...makePlan(), vendors: [vendor] };
    expect(withVendorUpdated(plan, 'v1', { status: 'quoted' }).vendors[0]?.status).toBe('quoted');
    expect(withVendorUpdated(plan, 'missing', { status: 'quoted' }).vendors).toEqual([vendor]);
  });

  it('adds an uncontacted vendor with a stable id', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const plan = withVendorAdded(makePlan(), 'venue', 'Hall');
    expect(plan.vendors[0]).toMatchObject({
      id: 'vendor_mjuohs00_venue',
      category: 'venue',
      name: 'Hall',
      status: 'to_contact',
    });
  });
});

describe('idea changes', () => {
  it.each([
    ['accessibility', 'accessibility'],
    ['catering', 'catering'],
    ['budget', 'budget'],
    ['logistics', 'logistics'],
    ['other', 'general'],
  ])('maps the %s tag to the %s task area', (tag, area) => {
    const plan = withIdeaApplied(makePlan(), makeIdea({ id: tag, tags: [tag] }));
    expect(plan.tasks[0]?.area).toBe(area);
  });

  it('stores an idea and its task once', () => {
    const idea = makeIdea();
    const once = withIdeaApplied(makePlan(), idea);
    const twice = withIdeaApplied(once, idea);
    expect(twice.ideas).toEqual([idea]);
    expect(twice.tasks).toHaveLength(1);
  });

  it('keeps the existing task when the title is already present', () => {
    const plan = { ...makePlan(), tasks: [makeTask({ title: 'Add a welcome drink' })] };
    expect(withIdeaApplied(plan, makeIdea()).tasks).toEqual(plan.tasks);
  });

  it('replaces stored ideas with a copy of the new set', () => {
    const ideas = [makeIdea()];
    const plan = withIdeasStored(makePlan(), ideas);
    expect(plan.ideas).toEqual(ideas);
    expect(plan.ideas).not.toBe(ideas);
  });
});

describe('chat changes', () => {
  it('keeps only the latest 200 messages', () => {
    let plan = makePlan();
    for (let index = 0; index < 201; index += 1) {
      plan = withChatMessage(plan, makeMessage(`message ${index}`));
    }
    expect(plan.chat).toHaveLength(200);
    expect(plan.chat.at(-1)?.content).toBe('message 200');
  });

  it('builds a readable task id from the title', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(taskId('  Venue & food!  ')).toBe('task_mjuohs00_venue-food');
  });
});
