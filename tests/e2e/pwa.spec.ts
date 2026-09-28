import { expect, test } from '@playwright/test';

// PWA (WRK-TASK-009): el manifiesto se sirve con su tipo, es válido y Chromium no pone pegas para
// instalar la aplicación. La instalación en un Android y en un iPhone se prueba a mano (WRK-TASK-040).
test('el manifiesto es válido y la aplicación se puede instalar', async ({ page }) => {
  const res = await page.request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-type']).toMatch(/application\/(manifest\+)?json/);
  const m = await res.json();
  expect(m).toMatchObject({ start_url: '/', display: 'fullscreen', orientation: 'any' });
  for (const icon of m.icons) {
    const r = await page.request.get(icon.src);
    expect(r.ok(), icon.src).toBe(true);
    expect(r.headers()['content-type']).toBe('image/png');
  }
  await page.goto('/');
  const cdp = await page.context().newCDPSession(page);
  const app = await cdp.send('Page.getAppManifest');
  expect(app.errors, JSON.stringify(app.errors)).toEqual([]);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  console.log('instalabilidad', JSON.stringify(inst.installabilityErrors));
  expect(inst.installabilityErrors).toEqual([]);
  // Un enlace de sala sigue entrando en la sala (el manifiesto no cambia las rutas).
  await page.goto('/#ABCD');
  await expect(page.locator('#join, #name')).not.toHaveCount(0);
});
