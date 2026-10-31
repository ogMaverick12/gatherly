import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import RootLayout, { metadata as layoutMetadata, viewport } from '@/app/layout';
import LandingPage, { metadata as landingMetadata } from '@/app/page';
import NotFound from '@/app/not-found';
import IntakePage, { metadata as intakeMetadata } from '@/app/intake/page';
import PlanPage, { metadata as planMetadata } from '@/app/plan/page';
import { LIGHT_THEME_COLOR, DARK_THEME_COLOR } from '@/lib/theme-colors';
import { setPlan } from '@/lib/plan-store';
import { makePlan } from '@tests/support/factories';
import { renderWithProvider } from '@tests/support/helpers';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));

vi.mock('next/server', () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/font/google', () => ({
  Fraunces: () => ({ variable: '--font-display' }),
  Plus_Jakarta_Sans: () => ({ variable: '--font-sans' }),
  Noto_Sans_Devanagari: () => ({ variable: '--font-devanagari' }),
  Noto_Sans_Bengali: () => ({ variable: '--font-bengali' }),
}));

/** Render the root layout to markup with the nonce header the middleware would supply. */
async function renderLayout(headers: Headers) {
  headersMock.mockResolvedValue(headers);
  return renderToStaticMarkup(await RootLayout({ children: <p>Page body</p> }));
}

/** Query the landmarks in rendered server markup. */
function layoutBody(markup: string) {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return within(host);
}

beforeEach(() => {
  setPlan(null);
});

describe('the root layout', () => {
  it('provides the landmarks, skip link and themed script', async () => {
    const markup = await renderLayout(new Headers({ 'x-nonce': 'nonce-123' }));
    const page = layoutBody(markup);

    expect(page.getByRole('banner').tagName).toBe('HEADER');
    expect(page.getByRole('main')).toHaveTextContent('Page body');
    expect(page.getByRole('contentinfo').tagName).toBe('FOOTER');
    expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(markup).toContain('nonce="nonce-123"');
    expect(markup).toContain('gatherly:prefs:v1');
  });

  it('omits the nonce when the middleware did not supply one', async () => {
    const markup = await renderLayout(new Headers());
    const page = layoutBody(markup);

    expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(markup).not.toMatch(/<script[^>]*\snonce=/);
  });

  it('publishes the app-wide metadata and both browser chrome colours', () => {
    expect(layoutMetadata).toMatchObject({
      applicationName: 'Gatherly',
      manifest: '/manifest.webmanifest',
    });
    expect(layoutMetadata.title).toMatchObject({
      default: 'Gatherly - a calm event-planning companion',
      template: '%s - Gatherly',
    });
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: LIGHT_THEME_COLOR },
      { media: '(prefers-color-scheme: dark)', color: DARK_THEME_COLOR },
    ]);
  });
});

describe('the landing page', () => {
  it('renders its hero and publishes its metadata', () => {
    renderWithProvider(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Make room for the moments people will remember.',
      }),
    ).toBeInTheDocument();
    expect(landingMetadata.title).toBe('Gatherly - a calm event-planning companion');
  });
});

describe('the intake page', () => {
  it('renders the wizard inside its heading and publishes its metadata', () => {
    renderWithProvider(<IntakePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tell us about the celebration',
    );
    expect(screen.getByLabelText('The basics')).toBeInTheDocument();
    expect(intakeMetadata.title).toBe('Start a plan');
  });
});

describe('the plan page', () => {
  it('renders the stored plan workspace and publishes its metadata', async () => {
    setPlan(makePlan());
    renderWithProvider(<PlanPage />);

    expect(await screen.findByRole('heading', { name: /120 guests/ })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Plan sections' })).toBeInTheDocument();
    expect(planMetadata.title).toBe('Your plan');
  });
});

describe('the not-found page', () => {
  it('explains the missing page and offers the way home', async () => {
    render(await NotFound());

    expect(
      screen.getByRole('heading', { name: 'This page is not part of the plan.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });
});
