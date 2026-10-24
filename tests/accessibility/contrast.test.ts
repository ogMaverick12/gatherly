import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The contrast rule.
 *
 * Every colour pair that carries text is checked here, so the palette is
 * not a matter of taste but of measurement. The marigold is the interesting
 * one: it fails on paper as a text colour, so it is only ever used as a
 * fill, a marker or a border - with ink on top of it - and the
 * `marigold-ink` variant exists for the cases where text really does need
 * to be marigold.
 */

const CSS = readFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');

interface Palette {
  readonly [token: string]: string;
}

function readPalette(block: string, base: Palette = {}): Palette {
  const start = CSS.indexOf(block);
  if (start === -1) throw new Error(`The stylesheet has no ${block} block.`);
  const body = CSS.slice(start);
  const palette: Record<string, string> = { ...base };
  const pattern = /--color-([a-z-]+):\s*(#[0-9a-fA-F]{6}|rgba?\([^)]*\))/g;
  let match = pattern.exec(body);
  while (match !== null) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined && !(name in palette)) {
      palette[name] = value;
    }
    match = pattern.exec(body);
  }
  return palette;
}

function toRgb(colour: string): { r: number; g: number; b: number } {
  const hex = colour.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => character + character)
          .join('')
      : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance(colour: string): number {
  const { r, g, b } = toRgb(colour);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const light = readPalette(':root {');
const dark = readPalette("[data-theme='dark'] {");
// Calm mode only overrides a few tokens, so it is read on top of the
// light palette rather than on its own.
const calm = readPalette("[data-calm='true'] {", light);

describe('the light palette', () => {
  const TEXT_ON_PAPER: [string, string][] = [
    ['ink', 'paper'],
    ['ink-muted', 'paper'],
    ['teal', 'paper'],
    ['teal-deep', 'paper'],
    ['rose', 'paper'],
    ['marigold-ink', 'paper'],
  ];

  it.each(TEXT_ON_PAPER)('%s on %s clears 4.5:1', (foreground, background) => {
    const ratio = contrastRatio(light[foreground] as string, light[background] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the text on a marigold fill above 4.5:1', () => {
    const ratio = contrastRatio(light['on-marigold'] as string, light['marigold'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps marigold out of the text palette on paper', () => {
    // This is the rule that makes the accent decorative.
    const ratio = contrastRatio(light['marigold'] as string, light['paper'] as string);
    expect(ratio).toBeLessThan(4.5);
  });

  it('keeps paper on a teal fill above 4.5:1', () => {
    const ratio = contrastRatio(light['paper'] as string, light['teal'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the dark palette', () => {
  const TEXT_ON_PAPER: [string, string][] = [
    ['ink', 'paper'],
    ['ink-muted', 'paper'],
    ['teal', 'paper'],
    ['rose', 'paper'],
    ['marigold-ink', 'paper'],
  ];

  it.each(TEXT_ON_PAPER)('%s on %s clears 4.5:1', (foreground, background) => {
    const ratio = contrastRatio(dark[foreground] as string, dark[background] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the text on a marigold fill above 4.5:1', () => {
    const ratio = contrastRatio(dark['on-marigold'] as string, dark['marigold'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps paper on a teal fill above 4.5:1', () => {
    const ratio = contrastRatio(dark['paper'] as string, dark['teal'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the calm palette', () => {
  it('keeps the muted rose readable on paper', () => {
    const ratio = contrastRatio(calm['rose'] as string, calm['paper'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the muted marigold readable on paper', () => {
    const ratio = contrastRatio(calm['marigold-ink'] as string, calm['paper'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the text on a muted marigold fill above 4.5:1', () => {
    const ratio = contrastRatio(calm['on-marigold'] as string, calm['marigold'] as string);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
