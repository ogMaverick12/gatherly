import type { Metadata } from 'next';
import { IntakeForm } from '@/features/intake/components/IntakeForm';
import { IntakeHeading } from '@/features/intake/components/IntakeHeading';

/** Browser-tab metadata for the intake wizard. */
export const metadata: Metadata = {
  title: 'Start a plan',
  description:
    'Tell Gatherly about your event: type, date, guests, city tier, budget, priorities, dietary and access needs, language and optional packs.',
};

/** Rendered per request so the CSP nonce applies. See app/page.tsx. */
export const dynamic = 'force-dynamic';

/** Render the multi-step intake wizard shell. */
export default function IntakePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <IntakeHeading />
      <IntakeForm />
    </div>
  );
}
