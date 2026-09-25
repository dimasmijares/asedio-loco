import { BOT_NAMES } from '../../../../shared/players';
import { createMatch } from '../../../../shared/match';
import type { Difficulty } from '../../../../shared/protocol';
import type { Game, Mode } from '../game';
import { MatchHost } from '../match/host';
import { MatchUI, type MatchSource } from '../match/ui';
import type { SimEvent } from '../sim/sim';

export interface SoloOptions {
  name: string;
  bots: number; // 1-3
  difficulty: Difficulty;
  fast?: boolean;
  seed?: number;
  autoplay?: boolean; // el jugador humano también lo controla un bot (pruebas)
}

// Partida local contra bots: el propio navegador es el anfitrión.
export class SoloMode implements Mode {
  host!: MatchHost;
  ui!: MatchUI;

  constructor(readonly game: Game, readonly parent: HTMLElement, readonly opts: SoloOptions) {
    this.start();
  }

  private start() {
    const o = this.opts;
    const slots = [0, 2, 1, 3].slice(0, 1 + o.bots).sort();
    const seed = o.seed ?? (Math.random() * 2 ** 31) >>> 0;
    const players = slots.map((slot, i) =>
      i === 0 ? { slot, id: 'you', name: o.name || 'Tú', bot: !!o.autoplay, difficulty: 'dificil' as Difficulty } : { slot, id: `bot${slot}`, name: BOT_NAMES[(seed + i) % BOT_NAMES.length], bot: true, difficulty: o.difficulty },
    );
    const state = createMatch(players, seed, !!o.fast);
    this.host = new MatchHost(this.game, state);
    const you = slots[0];
    const host = this.host;
    const src: MatchSource = {
      get state() {
        return host.state;
      },
      you,
      send: (input) => host.setInput(you, input),
      remaining: () => host.state.remaining,
    };
    this.ui = new MatchUI(this.game, src, this.parent, {
      onRematch: () => this.rematch(),
      onExit: () => {
        location.hash = '';
        location.reload();
      },
    });
    this.game.mode = this;
  }

  rematch() {
    this.ui.dispose();
    this.game.timeScale = 1;
    this.opts.seed = undefined;
    this.start();
  }

  onSimEvents(events: SimEvent[]) {
    this.host.onSimEvents(events);
    this.ui.onSimEvents(events);
  }

  update(dt: number) {
    this.host.update(dt);
    this.ui.update(dt);
  }

  dispose() {
    this.ui.dispose();
  }
}
