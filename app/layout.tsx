import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GestureTalk – Sign Language Communication",
  description:
    "Real-time sign language to voice and text — designed for people with speech and hearing challenges.",
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
