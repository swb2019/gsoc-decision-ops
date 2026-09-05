import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GSOC Decision Ops Cloud | Security Operations Decision Platform',
  description:
    'Structured decision-making platform for corporate GSOC leaders. Train your team with synthetic vendor compromise scenarios and first-hour response playbooks.',
  keywords: [
    'GSOC',
    'security operations',
    'decision making',
    'incident response',
    'vendor management',
    'ESRM',
    'SaaS',
    'training platform',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
