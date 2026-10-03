import { botName, soloSlots } from '../../../../shared/players';
import { createMatch } from '../../../../shared/match';
import type { Difficulty } from '../../../../shared/protocol';
import type { Game, Mode } from '../game';
import { MatchHost } from '../match/host';
import { MatchUI, type MatchSource } from '../match/ui';
import type { SimEvent } from '../sim/sim';
import { tutorialPending } from '../../ui/tutorial';

export interface SoloOptions {
  name: string;
  bots: number; // 1-3
  difficulty: Difficulty;
  fast?: boolean;
  seed?: number;
  autoplay?: boolean; // el jugador humano también lo controla un bot (pruebas)
  onChangeRivals?: () => void; // «Cambiar rivales» al final (R-07 F8)
}

// Partida local contra bots: el propio navegador es el anfitrión.
export class SoloMode implements Mode {
  host!: MatchHost;
  ui!: MatchUI;
  // Con el engranaje abierto la partida se para (R-07 F9): ni reloj ni física.
  paused = false;
  private simWasPaused = false;

  constructor(readonly game: Game, readonly parent: HTMLElement, readonly opts: SoloOptions) {
    this.start();
  }

  private start() {
    const o = this.opts;
    // Huecos y nombres de los bots de shared/players: los mismos que anuncia «Jugar solo».
    const slots = soloSlots(o.bots);
    const seed = o.seed ?? (Math.random() * 2 ** 31) >>> 0;
    const players = slots.map((slot, i) =>
      i === 0 ? { slot, id: 'you', name: o.name || 'Jugador', bot: !!o.autoplay, difficulty: 'dificil' as Difficulty } : { slot, id: `bot${slot}`, name: botName(slot), bot: true, difficulty: o.difficulty },
    );
    const state = createMatch(players, seed, !!o.fast);
    this.host = new MatchHost(this.game, state);
    if (tutorialPending() && !o.autoplay) this.host.firstAimBonus = 10;
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
    const exit = () => {
      location.hash = '';
      location.reload();
    };
    this.ui = new MatchUI(this.game, src, this.parent, {
      onRematch: () => this.rematch(),
      rematchLabel: 'Otra partida',
      onChangeRivals: o.onChangeRivals,
      onExit: exit,
      onLeave: exit,
      leaveText: () => 'La partida se acaba y vuelves a la portada.',
      pause: (on) => this.pause(on),
      pauseNote: 'Partida en pausa',
    });
    this.game.mode = this;
  }

  pause(on: boolean) {
    if (on === this.paused) return;
    this.paused = on;
    if (on) this.simWasPaused = this.game.simPaused;
    this.game.simPaused = on || this.simWasPaused;
  }

  rematch() {
    this.pause(false);
    this.ui.dispose();
    this.opts.seed = undefined;
    this.start();
  }

  onSimEvents(events: SimEvent[]) {
    this.host.onSimEvents(events);
    this.ui.onSimEvents(events);
  }

  update(dt: number) {
    if (!this.paused) this.host.update(dt);
    this.ui.update(dt);
  }

  dispose() {
    this.ui.dispose();
  }
}
