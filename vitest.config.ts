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
      include: ["app/src/data/access.tsx", "app/src/data/edits.ts", "app/src/navigation.tsx", "app/src/components/atoms/primitives.tsx", "app/src/components/organisms/record-dialog.tsx", "app/src/components/molecules/route-loader.tsx"],
      reporter: ["text", "json-summary"],
      thresholds: {
        "app/src/navigation.tsx": { lines: 80 },
        "app/src/components/atoms/primitives.tsx": { lines: 70 },
        "app/src/components/organisms/record-dialog.tsx": { lines: 60 },
        "app/src/components/molecules/route-loader.tsx": { lines: 70 },
      },
    },
  },
}));
