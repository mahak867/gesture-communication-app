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
