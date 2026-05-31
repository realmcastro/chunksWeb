import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    globals: false,
    reporters: ['default'],
    setupFiles: ['src/app/api/__tests__/vitest-setup.ts'],
  },
});
