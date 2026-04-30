import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(self), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // MediaPipe loads WASM + JS from jsdelivr
      "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      // MediaPipe WASM binary + Tasks model
      "connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      // Camera feed rendered to canvas
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
