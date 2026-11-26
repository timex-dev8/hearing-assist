import { defineConfig, devices } from '@playwright/test';

// Phone-sized Chromium with a fake microphone. /api is stubbed in each test.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  use: {
    ...devices['iPhone 15'],
    defaultBrowserType: 'chromium',
    channel: process.env.PW_CHANNEL ?? 'chrome',
    baseURL: 'http://localhost:4180',
    permissions: ['microphone'],
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: { command: 'npx vite --port 4180 --strictPort', url: 'http://localhost:4180', reuseExistingServer: false },
});
