import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    maxForks: 1,
    exclude: [
      'src/components/LoginForm.test.jsx',
      'src/pages/tools/MinifyBeautifyTool.test.jsx',
    ],
  },
});
