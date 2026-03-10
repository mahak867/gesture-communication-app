import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gesture App",
  description: "Communication Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black">{children}</body>
    </html>
  );
}