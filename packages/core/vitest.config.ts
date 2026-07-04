// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // これを明示
    pool: "threads",
    testTimeout: 10000,
    isolate: false,
    maxWorkers: 1,
  },
});
