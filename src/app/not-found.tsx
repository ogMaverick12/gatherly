import Link from 'next/link';
import { connection } from 'next/server';

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
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-muted">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">This page is not part of the plan.</h1>
      <p className="mt-4 text-lg text-ink-muted">
        The link may be old, or the address may have a typo. Your saved plan is still on this
        device.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-pill bg-ink px-6 py-3 font-semibold text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Go home
      </Link>
    </div>
  );
}
