import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterSW } from './components/RegisterSW';

export const metadata: Metadata = {
  title: 'GestureTalk – sign glove that speaks for people who cannot',
  description: 'A sensor glove and app that learn the personal signs of people who cannot speak (ALS, stroke, ICU) and translate them into speech. Offline and open hardware.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'GestureTalk' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f3ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1113' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
