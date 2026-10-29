'use client';

import { ErrorPanel } from './error-panel';

/**
 * Route-level error fallback: the rest of the app stays usable.
 *
 * @param props.reset Re-render the segment that failed.
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="That part of the plan hit a snag."
      body="Nothing you saved has been lost. Try the section again, or go back home and reopen your plan."
      reset={reset}
    />
  );
}
