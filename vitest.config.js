import os from 'node:os';
import { defineConfig } from 'vitest/config';

const THREADS = Math.max(os.cpus().length - 2, 2);

export default defineConfig({
  test: {
    // Keeps the upstream jest-style `describe`/`it`/`expect`/`vi` globals, so
    // the migrated suite reads the same as before.
    globals: true,
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/vitest/setup.js'],
    globalSetup: ['./test/vitest/setup.global.js'],
    testTimeout: 20_000,
    maxConcurrency: THREADS,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['bin/*.js', 'lib/**/*.js'],
      reporter: ['html', 'lcov', 'text']
    }
  }
});
