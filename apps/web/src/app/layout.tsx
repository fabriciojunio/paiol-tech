import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@paiol/ui/globals.css';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/components/toast-provider';
import { OfflineBanner } from '@/components/offline-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Paiol Tech — Suas dívidas na palma da mão',
  description: 'Tudo que você deve, na palma da mão. Gestão simples de dívidas rurais.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paiol',
  },
};

export const viewport: Viewport = {
  themeColor: '#3d6b2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <OfflineBanner />
            <main className="min-h-screen bg-background">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
