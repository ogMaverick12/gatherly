import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard, downloadFile } from '@/lib/download';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('downloadFile', () => {
  it('clicks a download anchor and releases the blob URL', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:gatherly-test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const append = vi.spyOn(document.body, 'appendChild');

    downloadFile('gatherly-budget.csv', 'category,amount', 'text/csv');

    const blob = create.mock.calls[0]?.[0];
    const anchor = append.mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(blob).toBeInstanceOf(Blob);
    if (blob instanceof Blob) expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(anchor.download).toBe('gatherly-budget.csv');
    expect(anchor.rel).toBe('noopener');
    expect(anchor.href).toContain('blob:gatherly-test');
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:gatherly-test');
  });

  it('does nothing when there is no document to download into', () => {
    const create = vi.spyOn(URL, 'createObjectURL');

    try {
      vi.stubGlobal('document', undefined);
      downloadFile('plan.json', '{}', 'application/json');
    } finally {
      vi.unstubAllGlobals();
    }

    expect(create).not.toHaveBeenCalled();
  });
});

describe('copyToClipboard', () => {
  it('returns false when the browser has no clipboard API', async () => {
    vi.stubGlobal('navigator', {});

    expect(await copyToClipboard('share text')).toBe(false);
  });

  it('returns false when writing to the clipboard is refused', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('permission denied');
    });
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    expect(await copyToClipboard('share text')).toBe(false);
    expect(writeText).toHaveBeenCalledWith('share text');
  });
});
