import { defineConfig } from '@playwright/test'

// Используется установленный Google Chrome (channel: 'chrome'), отдельная загрузка браузеров не нужна.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: { baseURL: 'http://localhost:4173', channel: 'chrome', headless: true, trace: 'off' },
  webServer: {
    command: 'BASE_PATH=/ npx vite-ssg build && node scripts/serve-dist.mjs 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
