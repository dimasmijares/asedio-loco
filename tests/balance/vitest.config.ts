import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/balance/**/*.test.ts'], testTimeout: 3_600_000 },
});
