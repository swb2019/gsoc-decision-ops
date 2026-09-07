import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './identity.css';

const inter = localFont({
  src: '../../public/brand/Manrope.ttf',
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: '../../public/brand/JetBrainsMono.ttf',
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#191c19',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Hourglass Command | Glasshouse / 06:10',
  description:
    'A synthetic security leadership exercise. Make a bounded plan, coordinate accountable action, and inspect what was known at each decision. Free, local, and account-free.',
  keywords: [
    'Hourglass Command',
    'security operations',
    'decision making',
    'incident response',
    'training',
  ],
  authors: [{ name: 'Shannon Brown' }],
  openGraph: {
    title: 'Hourglass Command',
    description: 'First-hour decision training for security operations leaders',
    type: 'website',
    url: 'https://swb2019.github.io/gsoc-decision-ops/',
    images: [
      {
        url: 'https://swb2019.github.io/gsoc-decision-ops/og.png',
        width: 1280,
        height: 720,
        alt: 'Hourglass Command — First-Hour Decision Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hourglass Command',
    description: 'First-hour decision training for security operations leaders',
    images: ['https://swb2019.github.io/gsoc-decision-ops/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased font-sans selection:bg-ops-accent-green-500/30 selection:text-ops-dark-50">
        {children}
      </body>
    </html>
  );
}
