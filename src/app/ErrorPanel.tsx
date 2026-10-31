'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Calm recovery panel shared by the route and global error boundaries.
 *
 * @param props.title What failed, in plain words.
 * @param props.body One sentence about what is still safe.
 * @param props.reset Re-render the failed segment.
 */
export function ErrorPanel({
  title,
  body,
  reset,
}: {
  title: string;
  body: string;
  reset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div
      role="alert"
      aria-labelledby="error-heading"
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-24 text-center"
    >
      <h1
        id="error-heading"
        ref={heading}
        tabIndex={-1}
        className="font-display text-4xl text-ink focus:outline-none"
      >
        {title}
      </h1>
      <p className="mt-4 text-lg text-ink-muted">{body}</p>
      <Button onClick={reset} size="none" className="mt-8 px-6 py-3 font-semibold">
        Try again
      </Button>
    </div>
  );
}
