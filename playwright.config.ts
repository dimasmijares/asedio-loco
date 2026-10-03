import { defineConfig } from '@playwright/test';

// BASE_URL=https://asedio-loco.dimasmijares.workers.dev npx playwright test  → contra producción
// Sin BASE_URL se compila y se levanta `wrangler dev` en local.
const remote = process.env.BASE_URL;
const baseURL = remote ?? 'http://localhost:8787';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // En CI contra producción, un reintento: una prueba que solo pasa a la segunda sale como «flaky» en
  // `npm run ci:estado` y se apunta como tarea (RULE-003), pero no tumba el despliegue entero.
  retries: remote && process.env.CI ? 1 : 0,
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL,
    viewport: { width: 960, height: 600 },
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
    },
  },
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npx wrangler dev --port 8787 --local',
        url: 'http://localhost:8787/api/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
