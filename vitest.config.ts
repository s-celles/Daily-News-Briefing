import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'main.js'],
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      obsidian: path.resolve(__dirname, './tests/mocks/obsidian.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'main.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
