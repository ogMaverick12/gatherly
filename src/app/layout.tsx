import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import {
  Fraunces,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import { AccessibilityProvider } from '@/features/accessibility/provider';
import { ServiceWorkerRegistrar } from '@/features/accessibility/components/ServiceWorkerRegistrar';
import { SiteHeader } from '@/features/workspace/components/SiteHeader';
import { SiteFooter } from '@/features/workspace/components/SiteFooter';

// Optional loading keeps a late web-font swap from moving the header and copy.
const display = Fraunces({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-display',
  axes: ['SOFT', 'WONK'],
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-sans',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'optional',
  preload: false,
  variable: '--font-devanagari',
});

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  display: 'optional',
  preload: false,
  variable: '--font-bengali',
});

// Runs before paint so a stored dark theme never flashes light; the nonce above
// is what lets this one inline script through the policy.
const THEME_SCRIPT =
  "(function(){try{var p=JSON.parse(localStorage.getItem('gatherly:prefs:v1')||'null');" +
  "var t=p&&p.theme;var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);" +
  "document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();";

/** App-wide metadata: title template, description, manifest and icons. */
export const metadata: Metadata = {
  metadataBase: new URL('https://gatherly.example'),
  title: {
    default: 'Gatherly - a calm event-planning companion',
    template: '%s - Gatherly',
  },
  description:
    'Gatherly turns budgets, dates, vendor questions and the "what should we do next?" feeling into one warm workspace for weddings, birthdays and community gatherings.',
  applicationName: 'Gatherly',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon.svg' }],
  },
  openGraph: {
    title: 'Gatherly',
    description: 'Plan a celebration without losing the day.',
    type: 'website',
  },
};

/** Mobile viewport and theme colours for light and dark browser chrome. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF6EE' },
    { media: '(prefers-color-scheme: dark)', color: '#17120F' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * App shell: fonts, skip link, header, footer and accessibility provider.
 *
 * @param props.children The page rendered inside the main landmark.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      lang="en"
      data-text-size="standard"
      data-calm="false"
      data-motion="on"
      className={`${display.variable} ${sans.variable} ${devanagari.variable} ${bengali.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-[100svh] flex-col bg-paper text-ink antialiased">
        <AccessibilityProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-5 focus:py-3 focus:text-paper focus:shadow-lift"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <ServiceWorkerRegistrar />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
