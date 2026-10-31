/**
 * The site footer.
 * It repeats the privacy promise and links to the two ways into the product.
 */

import Link from 'next/link';
import { en } from '@/lib/i18n/en';
import { Wordmark } from './Wordmark';

/** Close every page with the privacy note and links to intake and the plan. */
export function SiteFooter() {
  return (
    <footer className="no-print mt-10 border-t border-line bg-paper-raised sm:mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:py-10">
        <div>
          <Wordmark className="text-ink" markLabel={en.common.gatherlyMark} />
          <p className="mt-2 max-w-prose">
            Your plan stays on this device. No account, no upload, no tracking.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-5">
          <li>
            <Link href="/intake" className="underline-offset-4 hover:text-ink hover:underline">
              Start a plan
            </Link>
          </li>
          <li>
            <Link href="/plan" className="underline-offset-4 hover:text-ink hover:underline">
              Open your plan
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
