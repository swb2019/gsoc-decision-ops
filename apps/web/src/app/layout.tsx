import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'GSOC Decision Ops | First-Hour Decision Training',
  description:
    'First-hour decision simulation for GSOC operations. Practice facts vs assumptions and CONTINUE/DEGRADE/PAUSE posture calls under time pressure.',
  keywords: ['GSOC', 'security operations', 'decision making', 'incident response', 'training'],
  authors: [{ name: 'Shannon Brown' }],
  openGraph: {
    title: 'GSOC Decision Ops',
    description: 'First-hour decision training for security operations leaders',
    type: 'website',
    url: 'https://swb2019.github.io/gsoc-decision-ops/',
    images: [
      {
        url: 'https://swb2019.github.io/gsoc-decision-ops/og.png',
        width: 1280,
        height: 720,
        alt: 'GSOC Decision Ops — First-Hour Decision Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GSOC Decision Ops',
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
