import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIdeas } from '@/features/workspace/hooks/use-ideas';
import { getDictionary } from '@/lib/i18n';
import type { Idea } from '@/lib/plan';
import { makeView } from '@tests/support/helpers';

const IDEA: Idea = {
  id: 'idea-1',
  title: 'Ask for a second tasting',
  body: 'Two plates for the table.',
  rationale: 'You have guests to feed.',
  costImpactMinor: null,
  tags: ['food'],
  source: 'basic',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIdeas', () => {
  it('sends the guest and date context the route needs and accepts a reply without notices', async () => {
    let request: RequestInit | undefined;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      request = init;
      return new Response(JSON.stringify({ mode: 'provider', ideas: [IDEA] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const onStoreIdeas = vi.fn();
    const view = makeView({ guests: 0, eventDate: null });
    const { result } = renderHook(() => useIdeas(view, vi.fn(), onStoreIdeas, getDictionary('en')));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(request?.body)) as {
      context: { perGuestMinor: number; month: number | null };
    };
    expect(body.context.perGuestMinor).toBe(0);
    expect(body.context.month).toBeNull();
    expect(result.current.mode).toBe('provider');
    expect(result.current.ideas).toEqual([IDEA]);
    expect(result.current.notices).toEqual([]);
    expect(onStoreIdeas).toHaveBeenCalledWith([IDEA]);
  });

  it('shows the generic error when the route refuses the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    );
    const onStoreIdeas = vi.fn();
    const { result } = renderHook(() =>
      useIdeas(makeView(), vi.fn(), onStoreIdeas, getDictionary('en')),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.notices).toEqual(['Something went wrong. Please try again.']);
    expect(result.current.loading).toBe(false);
    expect(onStoreIdeas).not.toHaveBeenCalled();
  });
});
