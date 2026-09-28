import { expect, test } from '@playwright/test';

// WRK-TASK-011: un rey que se lleva la lava durante el apuntado tiene su repetición al acabar el
// impacto de esa ronda, como los que caen por los disparos.
test('la caída de un rey en la lava durante el apuntado se repite al acabar el impacto', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/?bots=3&fast=1&autoplay=1&seed=5&render=4#solo');
  // Ronda 3 o más (sin escudo real), en pleno apuntado: la lava se lleva al rey de un bot.
  const victim = await page.evaluate(
    () =>
      new Promise<number>((done) => {
        const tick = () => {
          const m = (window as any).__asedio?.mode;
          const s = m?.host?.state;
          if (s && s.round >= 3 && s.phase === 'aim') {
            const p = s.players.find((q: any) => q.alive && q.bot);
            const k = m.host.sim.recs.get(1000 + p.slot);
            k.body.setTranslation({ x: k.body.translation().x, y: m.host.sim.lavaY - 0.2, z: k.body.translation().z }, true);
            return done(p.slot);
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
  );
  const seen = await page.evaluate(
    (slot) =>
      new Promise<{ cause: string; round: number; replay: number[]; banner: string }>((done) => {
        const tick = () => {
          const m = (window as any).__asedio.mode;
          const s = m.host.state;
          const banner = document.querySelector('#hud-banner')?.textContent ?? '';
          if (s.phase === 'replay' && s.replay?.includes(slot) && /lava/.test(banner)) {
            return done({ cause: s.players.find((p: any) => p.slot === slot).cause, round: s.round, replay: s.replay, banner });
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
    victim,
  );
  console.log('repetición por lava', JSON.stringify(seen));
  expect(seen.cause).toBe('lava');
  expect(seen.replay.length).toBeLessThanOrEqual(2);
  expect(seen.banner).toContain('La lava se lleva');
});
