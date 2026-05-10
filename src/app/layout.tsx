import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexus POS & Ombor',
  description: 'Murakkab Savdo Nuqtasi va Ombor Boshqaruv Tizimi',
};

import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>
        <ToastProvider>
          <LanguageProvider>
            <main>{children}</main>
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
