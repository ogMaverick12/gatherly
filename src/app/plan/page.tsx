import type { Metadata } from 'next';
import { PlanWorkspace } from '@/features/workspace/components/PlanWorkspace';

export const metadata: Metadata = {
  title: 'Your plan',
  description:
    'Your Gatherly plan: budget maths, a backwards timeline, the vendor checklist, plan health, ideas and exports.',
};

/** Rendered per request so the CSP nonce applies. See app/page.tsx. */
export const dynamic = 'force-dynamic';

export default function PlanPage() {
  return <PlanWorkspace />;
}
