import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GestureTalk – Sign Language Communication",
  description:
    "Real-time sign language to voice and text — on-device AI hand tracking, no data uploaded. " +
    "Designed for people with speech and hearing challenges. Works on any device: phone, tablet, desktop.",
  manifest: "/manifest.json",
  keywords: [
    "sign language",
    "AAC",
    "assistive technology",
    "gesture recognition",
    "speech synthesis",
    "accessibility",
    "communication aid",
    "mediapipe",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GestureTalk",
  },
  openGraph: {
    title: "GestureTalk – Sign Language Communication",
    description: "Real-time gesture-to-voice communication, powered by on-device AI.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
