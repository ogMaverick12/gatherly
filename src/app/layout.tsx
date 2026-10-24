import type { Metadata, Viewport } from 'next';
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

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  axes: ['SOFT', 'WONK'],
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'swap',
  preload: false,
  variable: '--font-devanagari',
});

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  display: 'swap',
  preload: false,
  variable: '--font-bengali',
});

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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF6EE' },
    { media: '(prefers-color-scheme: dark)', color: '#17120F' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${devanagari.variable} ${bengali.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        <AccessibilityProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-5 focus:py-3 focus:text-paper focus:shadow-lift"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <ServiceWorkerRegistrar />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
