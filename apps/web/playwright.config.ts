import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for AuthKit's end-to-end tests.
 *
 * Two projects run in sequence:
 *   1. `setup` provisions a fresh account and saves its storage state (cookie).
 *   2. `features` reuses that storage state so its specs start authenticated.
 *
 * The `webServer` block boots the Next.js frontend (pointed at the e2e backend
 * on :8081 via the e2e:web script). The backend + test database are started by
 * the `test:e2e` npm script that wraps this run.
 */
export default defineConfig({
  testDir: "__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "features",
      testIgnore: [/auth\.setup\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/chromium.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Playwright starts BOTH servers and waits until each answers before running
  // any test, so there is no race between the suite and a still-booting backend.
  // The test database (port 5433) is brought up by the `test:e2e` npm script.
  webServer: [
    {
      command: "npm run e2e:backend",
      // /v3/api-docs is public (permitAll) and returns 200 once Spring is up.
      url: "http://localhost:8081/api/v1/v3/api-docs",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run e2e:web",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
