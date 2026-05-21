import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/server/lib'),
    },
  },
});
