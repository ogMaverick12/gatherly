import { computePlanView } from './plan-view';
import type { ChatMessage, Idea, Milestone, Plan, TaskArea, Vendor } from '@/lib/plan';
import type { PlanView } from './plan-view';

/**
 * The changes the workspace can make to a plan.
 *
 * Each one takes the stored plan and returns the next one, so the panel never
 * mutates state in place and every rule about what a change means is a plain
 * function that can be read (and tested) on its own.
 */

/** Store the generated ladder, so exports and shares carry the dates with it. */
export function toStoredMilestones(milestones: PlanView['milestones']): Milestone[] {
  return milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    date: milestone.date,
    offsetDays: milestone.offsetDays,
    done: milestone.done,
    owner: milestone.owner,
    whyItMatters: milestone.whyItMatters,
  }));
}

/** A stable id for a task created from an idea's title. */
export function taskId(title: string): string {
  return `task_${Date.now().toString(36)}_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)}`;
}

/**
 * Flips the done flag on one task.
 * @param plan the current plan
 * @param id the task id to toggle
 * @returns a new plan with the task flipped; unknown ids are ignored
 */
export function withTaskToggled(plan: Plan, id: string): Plan {
  return {
    ...plan,
    tasks: plan.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
  };
}

/**
 * Flips one milestone and re-stores the whole ladder.
 * @param plan the current plan
 * @param id the milestone id to toggle
 * @returns a new plan whose milestones come from the recomputed plan view
 */
export function withMilestoneToggled(plan: Plan, id: string): Plan {
  const merged = computePlanView(plan).milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    date: milestone.date,
    offsetDays: milestone.offsetDays,
    done: milestone.id === id ? !milestone.done : milestone.done,
    owner: milestone.owner,
    whyItMatters: milestone.whyItMatters,
  }));
  return { ...plan, milestones: merged };
}

/**
 * Applies a partial change to one vendor.
 * @param plan the current plan
 * @param id the vendor id to update
 * @param patch the fields to overwrite; fields not named keep their values
 * @returns a new plan with the vendor patched; an unknown id leaves vendors unchanged
 */
export function withVendorUpdated(plan: Plan, id: string, patch: Partial<Vendor>): Plan {
  return {
    ...plan,
    vendors: plan.vendors.map((vendor) => (vendor.id === id ? { ...vendor, ...patch } : vendor)),
  };
}

/**
 * Appends a new, uncontacted vendor to the plan.
 * @param plan the current plan
 * @param category the vendor category to add
 * @param name the vendor's name; may be empty while it is still a placeholder
 * @returns a new plan with the vendor added at the end of the list
 */
export function withVendorAdded(plan: Plan, category: Vendor['category'], name: string): Plan {
  return {
    ...plan,
    vendors: [
      ...plan.vendors,
      {
        id: `vendor_${Date.now().toString(36)}_${category}`,
        category,
        name,
        status: 'to_contact',
        quotedMinor: null,
        depositMinor: null,
        dueDate: null,
        phone: '',
        notes: '',
      },
    ],
  };
}

/** Turn an idea into a task, once, keeping the idea in the plan as the source. */
export function withIdeaApplied(plan: Plan, idea: Idea): Plan {
  const area: TaskArea = idea.tags.includes('accessibility')
    ? 'accessibility'
    : idea.tags.includes('catering')
      ? 'catering'
      : idea.tags.includes('budget')
        ? 'budget'
        : idea.tags.includes('logistics')
          ? 'logistics'
          : 'general';
  const already = plan.tasks.some((task) => task.title === idea.title);
  return {
    ...plan,
    ideas: plan.ideas.some((stored) => stored.id === idea.id) ? plan.ideas : [...plan.ideas, idea],
    tasks: already
      ? plan.tasks
      : [...plan.tasks, { id: taskId(idea.title), title: idea.title, done: false, area }],
  };
}

/**
 * Replaces the stored ideas, used when a new set is generated.
 * @param plan the current plan
 * @param ideas the ideas to keep, in display order
 * @returns a new plan with the ideas copied into it
 */
export function withIdeasStored(plan: Plan, ideas: readonly Idea[]): Plan {
  return { ...plan, ideas: [...ideas] };
}

/** The chat keeps its last 200 messages and no more. */
export function withChatMessage(plan: Plan, message: ChatMessage): Plan {
  return { ...plan, chat: [...plan.chat, message].slice(-200) };
}
