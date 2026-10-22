import { defineConfig } from "@playwright/test";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: externalBaseURL ?? "http://127.0.0.1:4173", viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium", ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) } }],
  webServer: externalBaseURL ? undefined : {
    command: "pnpm run preview --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 1000 },
  },
});
