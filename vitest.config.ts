import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom so any future tests can access browser APIs:
    // localStorage, navigator, speechSynthesis, window, document etc.
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.ts'],
    // Give tests access to global browser-like APIs
    globals: true,
  },
});
