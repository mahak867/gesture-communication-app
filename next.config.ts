import type { NextConfig } from 'next';

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts.
  "script-src 'self' 'unsafe-inline'",
  "worker-src 'self'",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), bluetooth=(self)' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    },
  ],
};

export default nextConfig;
