'use client';

import { DisplaySettings } from '@/features/accessibility/components/DisplaySettings';
import { Wordmark } from './Wordmark';
import { useAccessibility } from '@/features/accessibility/provider';
import Link from 'next/link';

// long-function: one view section, kept in one block so its reading order stays visible.
export function SiteHeader() {
  const { dictionary, preferences, setLanguage } = useAccessibility();

  return (
    <header className="no-print border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Link
          href="/"
          className="rounded-sm text-ink hover:text-teal"
          aria-label={dictionary.common.appName}
        >
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex items-center gap-5 text-sm">
            <li>
              <Link
                href="/plan"
                className="rounded-sm py-2 text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {dictionary.workspace.planTitle}
              </Link>
            </li>
            <li>
              <Link
                href="/intake"
                className="rounded-sm py-2 text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {dictionary.intake.title}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="header-language">
            {dictionary.accessibility.language}
          </label>
          <select
            id="header-language"
            value={preferences.language}
            onChange={(event) => setLanguage(event.target.value as typeof preferences.language)}
            className="min-h-[44px] rounded-pill border border-line bg-raised px-3 text-sm text-ink"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="bn">বাংলা</option>
          </select>
          <DisplaySettings />
        </div>
      </div>
    </header>
  );
}
