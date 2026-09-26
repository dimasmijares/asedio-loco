import * as THREE from 'three';
import { launchPoint } from '../../../shared/map';
import type { Vec3 } from '../../../shared/math';
import type { SimEvent } from './sim/sim';

const MUTE_KEY = 'asedio.mute';

// Sonido 100 % sintetizado con WebAudio: ruido filtrado, osciladores y envolventes.
export class Sfx {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private last = new Map<string, number>();
  muted = false;
  camera: THREE.Camera | null = null;
  volume = 0.7;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* sin almacenamiento */
    }
    // El navegador solo deja arrancar el audio tras un gesto del usuario.
    const unlock = () => {
      this.ensure();
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Limita cuántas veces suena lo mismo seguido (p. ej. 30 bloques rompiéndose a la vez).
  private throttle(key: string, ms: number) {
    const now = performance.now();
    if (now - (this.last.get(key) ?? -1e9) < ms) return false;
    this.last.set(key, now);
    return true;
  }

  // Volumen y panorámica según dónde está el sonido respecto a la cámara.
  private spatial(p?: Vec3): { gain: number; pan: number } {
    if (!p || !this.camera) return { gain: 1, pan: 0 };
    const v = new THREE.Vector3(...p);
    const d = v.distanceTo(this.camera.position);
    const s = v.clone().project(this.camera);
    return { gain: 1 / (1 + d / 28), pan: THREE.MathUtils.clamp(s.x, -1, 1) * 0.8 };
  }

  private out(p: Vec3 | undefined, vol: number): AudioNode | null {
    // El contexto solo se crea con un gesto del usuario (crearlo aquí daría un tirón en pleno disparo).
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return null;
    const { gain, pan } = this.spatial(p);
    const g = ctx.createGain();
    g.gain.value = vol * gain;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    g.connect(panner).connect(this.master);
    return g;
  }

  private noise(dest: AudioNode, t: number, dur: number, filter: BiquadFilterType, f0: number, f1: number, q = 1, attack = 0.005, vol = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = filter;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f0, t);
    flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(env).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private tone(dest: AudioNode, t: number, dur: number, type: OscillatorType, f0: number, f1: number, vol = 1, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ---------- sonidos ----------

  impact(mat: string, p?: Vec3, strength = 1) {
    if (!this.throttle(`hit-${mat}`, 60)) return;
    const o = this.out(p, 0.5 * Math.min(1.4, strength));
    if (!o) return;
    const t = this.ctx!.currentTime;
    switch (mat) {
      case 'glass':
        this.noise(o, t, 0.35, 'highpass', 3500, 6000, 0.7, 0.002, 0.6);
        for (const f of [2600, 3900, 5200, 6700]) this.tone(o, t + Math.random() * 0.05, 0.4 + Math.random() * 0.3, 'sine', f, f * 0.98, 0.12);
        break;
      case 'wood':
        this.noise(o, t, 0.18, 'bandpass', 900, 350, 2.5, 0.002, 0.9);
        this.tone(o, t, 0.12, 'triangle', 220, 140, 0.4);
        break;
      case 'iron':
        for (const f of [420, 1130, 1990, 2870]) this.tone(o, t, 0.9, 'sine', f, f * 0.995, 0.16);
        this.noise(o, t, 0.08, 'highpass', 2000, 3000, 1, 0.001, 0.4);
        break;
      default:
        this.noise(o, t, 0.3, 'lowpass', 700, 120, 1, 0.003, 1);
        this.tone(o, t, 0.2, 'sine', 90, 45, 0.6);
    }
  }

  boom(p?: Vec3, size = 1, kind = 'boom') {
    if (!this.throttle('boom', 80)) return;
    const o = this.out(p, 0.9 * size);
    if (!o) return;
    const t = this.ctx!.currentTime;
    if (kind === 'egg') {
      // Huevo bomba: petardo corto y agudo.
      this.noise(o, t, 0.35, 'lowpass', 2400, 300, 0.9, 0.002, 0.7);
      this.tone(o, t, 0.2, 'sine', 160, 60, 0.6);
      return;
    }
    if (kind === 'implode') {
      this.noise(o, t, 0.8, 'lowpass', 200, 2000, 1, 0.3, 0.8);
      this.tone(o, t, 0.8, 'sine', 60, 200, 0.6, 0.3);
      return;
    }
    this.noise(o, t, 1.4, 'lowpass', 1400, 60, 0.8, 0.004, 1.2);
    this.tone(o, t, 0.6, 'sine', 70, 30, 1);
    this.noise(o, t + 0.05, 0.5, 'bandpass', 3000, 800, 0.8, 0.002, 0.3);
  }

  launch(p?: Vec3) {
    const o = this.out(p, 0.45);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, 0.12, 'square', 130, 70, 0.25);
    this.noise(o, t + 0.05, 0.12, 'bandpass', 500, 300, 3, 0.002, 0.5);
    this.noise(o, t + 0.08, 0.7, 'bandpass', 500, 2200, 1.5, 0.2, 0.4);
  }

  moo(p?: Vec3) {
    const o = this.out(p, 0.55);
    if (!o) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(175, t + 0.25);
    osc.frequency.linearRampToValueAtTime(115, t + 1.1);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6;
    const lg = ctx.createGain();
    lg.gain.value = 4;
    lfo.connect(lg).connect(osc.frequency);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 650;
    f1.Q.value = 4;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'lowpass';
    f2.frequency.setValueAtTime(900, t);
    f2.frequency.linearRampToValueAtTime(500, t + 1.1);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1.4, t + 0.12);
    env.gain.setValueAtTime(1.4, t + 0.8);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(f1).connect(f2).connect(env).connect(o);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 1.25);
    lfo.stop(t + 1.25);
  }

  cluck(p?: Vec3) {
    if (!this.throttle('cluck', 150)) return;
    const o = this.out(p, 0.35);
    if (!o) return;
    const t = this.ctx!.currentTime;
    for (let i = 0; i < 3; i++) this.tone(o, t + i * 0.09, 0.07, 'square', 1000 - i * 80, 600, 0.3);
  }

  piano(p?: Vec3) {
    const o = this.out(p, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    // Un acorde disonante, como si alguien se sentara encima del teclado.
    for (const n of [0, 1, 6, 11, 13]) {
      const f = 220 * 2 ** (n / 12);
      for (const [h, v] of [
        [1, 0.3],
        [2, 0.12],
        [3, 0.06],
      ])
        this.tone(o, t, 1.6, 'sine', f * h, f * h, v, 0.004);
    }
  }

  blackhole(p?: Vec3) {
    const o = this.out(p, 0.7);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, 2.2, 'sine', 55, 32, 0.9, 0.2);
    this.tone(o, t, 2.2, 'sawtooth', 110, 60, 0.12, 0.3);
    this.noise(o, t, 2.2, 'bandpass', 2400, 120, 2, 0.4, 0.5);
  }

  magnet(p?: Vec3) {
    const o = this.out(p, 0.4);
    if (!o) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 95;
    const trem = ctx.createGain();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 18;
    const lg = ctx.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg).connect(trem.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + 0.1);
    env.gain.setValueAtTime(0.5, t + 2.3);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    osc.connect(trem).connect(env).connect(o);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 2.7);
    lfo.stop(t + 2.7);
  }

  splat(p?: Vec3) {
    const o = this.out(p, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noise(o, t, 0.25, 'lowpass', 1800, 200, 1, 0.002, 0.9);
    this.tone(o, t, 0.15, 'sine', 300, 90, 0.4);
  }

  pop(p?: Vec3) {
    const o = this.out(p, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, 0.12, 'sine', 700, 1700, 0.6);
    this.noise(o, t, 0.1, 'highpass', 2000, 5000, 1, 0.001, 0.3);
  }

  shield(p?: Vec3) {
    const o = this.out(p, 0.35);
    if (!o) return;
    const t = this.ctx!.currentTime;
    for (const [i, f] of [523, 659, 784, 1047].entries()) this.tone(o, t + i * 0.06, 0.6, 'sine', f, f, 0.2);
  }

  build(p?: Vec3) {
    const o = this.out(p, 0.45);
    if (!o) return;
    const t = this.ctx!.currentTime;
    for (let i = 0; i < 5; i++) {
      this.noise(o, t + i * 0.13, 0.08, 'bandpass', 1400, 700, 3, 0.001, 0.8);
      this.tone(o, t + i * 0.13, 0.06, 'triangle', 300, 200, 0.3);
    }
  }

  sizzle(p?: Vec3) {
    if (!this.throttle('sizzle', 120)) return;
    const o = this.out(p, 0.25);
    if (!o) return;
    this.noise(o, this.ctx!.currentTime, 0.6, 'highpass', 3000, 5000, 0.8, 0.02, 0.5);
  }

  rumble() {
    const o = this.out(undefined, 0.6);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noise(o, t, 2.5, 'lowpass', 160, 60, 1, 0.5, 1);
    this.tone(o, t, 2.5, 'sine', 45, 38, 0.5, 0.6);
  }

  kingDown() {
    const o = this.out(undefined, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    // "Wah wah waaah" de trombón triste.
    [
      [311, 0.35],
      [294, 0.35],
      [277, 0.35],
      [262, 1.1],
    ].forEach(([f, d], i) => this.tone(o, t + i * 0.36, d, 'sawtooth', f, i === 3 ? f * 0.94 : f, 0.22, 0.03));
  }

  fanfare(big = false) {
    const o = this.out(undefined, 0.45);
    if (!o) return;
    const t = this.ctx!.currentTime;
    const notes = big ? [523, 659, 784, 1047, 784, 1047] : [392, 523, 659];
    notes.forEach((f, i) => {
      this.tone(o, t + i * 0.14, big && i === notes.length - 1 ? 1.2 : 0.3, 'square', f, f, 0.12);
      this.tone(o, t + i * 0.14, big && i === notes.length - 1 ? 1.2 : 0.3, 'triangle', f / 2, f / 2, 0.2);
    });
  }

  // «¡Fuego!» al final de la cuenta atrás: golpe grave y un acorde que sube.
  fuego() {
    const o = this.out(undefined, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, 0.35, 'triangle', 110, 55, 0.5);
    [392, 523, 784].forEach((f) => this.tone(o, t + 0.04, 0.45, 'sawtooth', f, f * 1.06, 0.1, 0.02));
  }

  tick(urgent = false) {
    const o = this.out(undefined, 0.3);
    if (!o) return;
    this.tone(o, this.ctx!.currentTime, 0.06, 'square', urgent ? 1200 : 800, urgent ? 1200 : 800, 0.3);
  }

  click() {
    const o = this.out(undefined, 0.2);
    if (!o) return;
    this.tone(o, this.ctx!.currentTime, 0.04, 'square', 600, 400, 0.3);
  }

  // Traduce los eventos de la simulación (locales o recibidos por red) en sonidos.
  onSimEvent(e: SimEvent) {
    switch (e.e) {
      case 'hit':
        this.impact(e.mat, e.p, Math.min(1.5, e.f / 900));
        break;
      case 'rm':
        if (e.why === 'frac') this.impact(e.mat, e.p, 1.1);
        else if (e.why === 'melt') this.sizzle(e.p);
        break;
      case 'boom':
        // El picotazo de la gallina ya suena con su cacareo.
        if (e.kind !== 'peck') this.boom(e.p, Math.min(1.3, e.r / 3), e.kind);
        break;
      case 'fx':
        switch (e.kind) {
          case 'fire':
            this.launch(e.slot !== undefined ? launchPoint(e.slot) : undefined);
            break;
          case 'moo':
            this.moo(e.p);
            break;
          case 'cluck':
            this.cluck(e.p);
            break;
          case 'piano':
            this.piano(e.p);
            break;
          case 'blackhole':
            this.blackhole(e.p);
            break;
          case 'magnet':
            this.magnet(e.p);
            break;
          case 'stick':
          case 'split':
            this.splat(e.p);
            break;
          case 'pop':
            this.pop(e.p);
            break;
          case 'build':
            this.build(e.p);
            break;
          case 'lavaRise':
            this.rumble();
            break;
        }
        break;
      case 'shield':
        if (e.on) this.shield();
        break;
      case 'king':
        this.kingDown();
        break;
    }
  }
}

export const sfx = new Sfx();
