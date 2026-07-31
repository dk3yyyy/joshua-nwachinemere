import { defineConfig, devices } from '@playwright/test';
import { resolvePreviewPort } from './scripts/preview-port.js';

const host = '127.0.0.1';
const port = await resolvePreviewPort(process.env);
const baseURL = `http://${host}:${port}/`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --host ${host} --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
