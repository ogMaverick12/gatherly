'use client';

/**
 * A single-choice chip group built from real radios in a fieldset.
 * The legend and help text are wired to the group for screen readers.
 */

import { useId } from 'react';

/** One radio option rendered as a chip. */
export interface RadioChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
}

/**
 * A single-choice group styled as chips.
 *
 * Real radios inside a fieldset with a legend, so keyboard and screen-reader
 * behaviour is the platform's, not something this component re-implements.
 */
export function RadioChips<T extends string>({
  legend,
  help,
  options,
  value,
  onChange,
  name,
  columns = false,
}: {
  legend: string;
  help?: string;
  options: readonly RadioChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  columns?: boolean;
}) {
  const helpId = useId();
  return (
    <fieldset aria-describedby={help ? helpId : undefined} className="min-w-0">
      <legend className="font-display text-title">{legend}</legend>
      {help ? (
        <p id={helpId} className="mt-1 text-sm text-ink-muted">
          {help}
        </p>
      ) : null}
      <div className={`mt-3 grid gap-2 ${columns ? 'sm:grid-cols-3' : 'flex flex-wrap'}`}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors duration-200 ${
                checked
                  ? 'border-teal bg-teal text-paper'
                  : 'border-line-strong bg-raised text-ink hover:border-teal'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.hint ? (
                  <span className={checked ? 'text-paper/80' : 'text-ink-muted'}>
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
