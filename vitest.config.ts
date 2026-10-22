import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import vite from "./vite.config.ts";

export default mergeConfig(vite, defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/demo/records.ts", "src/demo/finance.ts", "src/demo/access.tsx", "src/navigation.tsx", "src/components/ui/primitives.tsx", "src/components/ui/record-dialog.tsx", "src/components/ui/route-loader.tsx"],
      reporter: ["text", "json-summary"],
      thresholds: {
        "src/demo/finance.ts": { lines: 90 },
        "src/demo/records.ts": { lines: 90 },
        "src/demo/access.tsx": { lines: 80 },
        "src/navigation.tsx": { lines: 80 },
        "src/components/ui/primitives.tsx": { lines: 70 },
        "src/components/ui/record-dialog.tsx": { lines: 60 },
        "src/components/ui/route-loader.tsx": { lines: 70 },
      },
    },
  },
}));
