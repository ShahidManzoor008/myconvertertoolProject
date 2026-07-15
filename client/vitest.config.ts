import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    maxForks: 1,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    setupFiles: './src/setupTests.js',
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      '.turbo',
    ],
  },
});
