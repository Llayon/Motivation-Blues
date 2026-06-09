import { defineConfig, devices } from '@playwright/test';

const rawProductionBaseUrl =
  process.env.PROD_SMOKE_BASE_URL ?? 'https://llayon.github.io/Motivation-Blues/';
const productionBaseUrl = rawProductionBaseUrl.endsWith('/')
  ? rawProductionBaseUrl
  : `${rawProductionBaseUrl}/`;

export default defineConfig({
  testDir: './tests/prod-smoke',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 15_000
  },
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: productionBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
