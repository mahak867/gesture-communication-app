import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterSW } from './components/RegisterSW';

export const metadata: Metadata = {
  title: 'GestureTalk – communication board for patients who cannot speak',
  description:
    'Free, offline communication aid for hospital patients who cannot speak: yes/no, needs, pain scale, typing with prediction, switch scanning, camera gestures and a sensor glove. English and Hindi.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'GestureTalk' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#111316' },
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
