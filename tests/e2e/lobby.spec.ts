import { expect, test, type Page } from '@playwright/test';

// Fase 0.6: un jugador crea la sala, otro entra con el enlace y ambos ven la lista.
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('crear sala, unirse por enlace y ver la lista de conectados', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  const errA = watchErrors(a);
  const errB = watchErrors(b);

  await a.goto('/');
  await a.fill('#name', 'Ana');
  await a.click('#create');
  await expect(a.locator('#lobby h2')).toHaveText(/Sala [A-Z]{4}/);
  const link = await a.inputValue('#room-link');
  expect(link).toMatch(/#[A-Z]{4}$/);

  await b.goto(link);
  await b.fill('#name', 'Beto<script>');
  await b.click('#join');

  for (const p of [a, b]) {
    await expect(p.locator('#player-list li[data-player]')).toHaveCount(2);
    await expect(p.locator('#player-list')).toContainText('Ana');
    await expect(p.locator('#player-list')).toContainText('Betoscript');
  }
  await expect(a.locator('#start')).toBeVisible();
  await expect(b.locator('#waiting')).toBeVisible();

  // Reconexión: B recarga y conserva su hueco (no aparece un tercer jugador).
  await b.reload();
  await expect(b.locator('#player-list li[data-player]')).toHaveCount(2);
  await expect(a.locator('#player-list li[data-player]')).toHaveCount(2);
  await expect(a.locator('#player-list .tag.off')).toHaveCount(0);

  expect(errA).toEqual([]);
  expect(errB).toEqual([]);
});
