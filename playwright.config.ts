import { defineConfig, devices } from '@playwright/test'

const BASE = process.env.E2E_URL ?? 'http://localhost:3100'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npm run generate && npx nuxi preview',
    env: { PORT: '3100' },
    url: BASE,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 180_000,
  },
})
