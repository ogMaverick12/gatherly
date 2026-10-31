import { connection } from 'next/server';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SectionLabel } from '@/components/ui/SectionLabel';

/**
 * The unknown-path page.
 *
 * `connection()` keeps the page dynamic so the middleware nonce reaches its
 * scripts; a prerendered not-found page cannot carry a per-request nonce.
 */
export default async function NotFound() {
  await connection();

  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <SectionLabel spacing="page" size="sm">
        404
      </SectionLabel>
      <h1 className="mt-3 font-display text-4xl text-ink">This page is not part of the plan.</h1>
      <p className="mt-4 text-lg text-ink-muted">
        The link may be old, or the address may have a typo. Your saved plan is still on this
        device.
      </p>
      <ButtonLink href="/" size="none" className="mt-8 px-6 py-3 font-semibold">
        Go home
      </ButtonLink>
    </div>
  );
}
