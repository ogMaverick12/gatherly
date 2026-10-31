'use client';

/**
 * A multi-select chip group built from real checkboxes in a fieldset.
 * It supports a maximum selection and announces the limit in text.
 */

import { useId } from 'react';

export interface ChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
}

/** One checkbox rendered as a chip label. */
function ChipLabel<T extends string>({
  option,
  checked,
  muted,
  onToggle,
}: {
  option: ChipOption<T>;
  checked: boolean;
  muted: boolean;
  onToggle: (value: T) => void;
}) {
  return (
    <label
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors duration-200 ${
        checked
          ? 'border-teal bg-teal text-paper'
          : 'border-line-strong bg-raised text-ink hover:border-teal'
      } ${muted ? 'opacity-50' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(option.value)}
        className="sr-only"
      />
      <span>{option.label}</span>
    </label>
  );
}

/**
 * A group of checkboxes styled as chips.
 *
 * Real checkboxes inside a fieldset, so keyboard and screen-reader
 * behaviour is the platform's, not something we re-implemented.
 */
export function ChipGroup<T extends string>({
  legend,
  help,
  options,
  value,
  onChange,
  max,
  error,
  errorMessage,
}: {
  legend: string;
  help?: string;
  options: readonly ChipOption<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  max?: number;
  error?: boolean;
  errorMessage?: string;
}) {
  const helpId = useId();
  const errorId = useId();

  const toggle = (option: T) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    if (max !== undefined && value.length >= max) return;
    onChange([...value, option]);
  };

  const atLimit = max !== undefined && value.length >= max;

  return (
    <fieldset
      aria-describedby={error && errorMessage ? errorId : help ? helpId : undefined}
      aria-invalid={error || undefined}
      className="min-w-0"
    >
      <legend className="font-display text-title">{legend}</legend>
      {help ? (
        <p id={helpId} className="mt-1 text-sm text-ink-muted">
          {help}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <ChipLabel
              key={option.value}
              option={option}
              checked={checked}
              muted={atLimit && !checked}
              onToggle={toggle}
            />
          );
        })}
      </div>

      {atLimit ? (
        <p className="mt-2 text-sm text-ink-muted">{max} chosen. Remove one to change it.</p>
      ) : null}

      {error && errorMessage ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-rose">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
