import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GSOC Decision Ops | First-Hour Decision Toolkit',
  description:
    'Structured decision-making toolkit for corporate GSOC leaders facing vendor compromises and cyber-adjacent operational disruptions.',
  keywords: [
    'GSOC',
    'security operations',
    'decision making',
    'incident response',
    'vendor management',
    'ESRM',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="scanline pointer-events-none fixed inset-0 z-50" />
        {children}
      </body>
    </html>
  );
}
