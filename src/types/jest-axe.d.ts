/**
 * Types for jest-axe.
 *
 * The package ships no declarations, so this describes the small part of it
 * the accessibility tests use: the analyser and the matcher that turns its
 * result into a failed assertion.
 */

declare module 'jest-axe' {
  export interface AxeResult {
    readonly violations: readonly unknown[];
    readonly passes: readonly unknown[];
    readonly incomplete: readonly unknown[];
    readonly inapplicable: readonly unknown[];
  }

  export function axe(
    element: Element | Element[] | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResult>;
}
