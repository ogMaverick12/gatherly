'use client';

import { ErrorPanel } from './error-panel';

/**
 * Last-resort fallback: replaces the root layout when the layout itself fails.
 *
 * @param props.reset Retry rendering the application.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <ErrorPanel
          title="Gatherly could not load."
          body="Your plan is stored on this device, not on the server. Try again in a moment."
          reset={reset}
        />
      </body>
    </html>
  );
}
