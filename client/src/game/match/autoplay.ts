import { botDecide } from '../../../../shared/bot';
import { hashString, rng, type Vec3 } from '../../../../shared/math';
import type { WorldView } from '../view';
import type { MatchSource } from './ui';

// "Puntería automática" para las pruebas: el jugador humano decide como un bot normal,
// pero manda sus entradas por el mismo camino que un humano (red incluida).
export class AutoPlayer {
  private round = -1;
  private lockAt = 0;
  private t = 0;

  constructor(readonly src: MatchSource, readonly view: WorldView) {}

  update(dt: number) {
    this.t += dt;
    const s = this.src.state;
    const you = this.src.you;
    if (you === null || s.phase !== 'aim') return;
    const me = s.players.find((p) => p.slot === you);
    if (!me || !me.alive) return;
    if (s.round !== this.round) {
      this.round = s.round;
      const kingPos: Record<number, Vec3> = {};
      for (const p of s.players) {
        const k = this.view.kingPos(p.slot);
        if (k) kingPos[p.slot] = [k.x, k.y, k.z];
      }
      const d = botDecide(s, { ...me, difficulty: 'normal' }, kingPos, rng((s.seed ^ hashString(`auto:${s.round}:${you}`)) >>> 0));
      this.src.send({ selected: d.selected, target: d.target, aim: d.aim });
      this.lockAt = this.t + Math.min(d.lockDelay, Math.max(0.3, this.src.remaining() - 0.8));
    }
    if (!me.locked && this.t >= this.lockAt) this.src.send({ locked: true, aim: me.aim });
  }
}
