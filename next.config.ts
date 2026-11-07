import type { NextConfig } from 'next';

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; MediaPipe needs WASM compilation.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  // MediaPipe WASM + gesture model (camera mode only)
  "connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com",
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
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), bluetooth=(self)' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    },
  ],
};

export default nextConfig;
