import type { Metadata } from 'next';
import { LandingContent } from '@/features/workspace/landing-page';

/** Browser-tab metadata for the landing page. */
export const metadata: Metadata = {
  title: 'Gatherly - a calm event-planning companion',
  description:
    'Gatherly turns budgets, dates, vendor questions and the "what should we do next?" feeling into one warm workspace for weddings, birthdays and community gatherings.',
};

/**
 * The page is rendered per request so the Content-Security-Policy nonce
 * issued by the middleware can be applied to the scripts Next.js emits.
 */
export const dynamic = 'force-dynamic';

/** Render the marketing landing page. */
export default function LandingPage() {
  return <LandingContent />;
}
