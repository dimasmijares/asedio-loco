import type { Quat, Vec3 } from '../../../../shared/math';

interface Sample {
  t: number;
  p: Vec3;
  q: Quat;
}

// Retraso de reproducción: los clientes van un poco por detrás del anfitrión para tener
// siempre dos instantáneas entre las que interpolar aunque la red tenga algo de variación.
export const INTERP_DELAY = 0.12;

function slerp(a: Quat, b: Quat, t: number): Quat {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const bb: Quat = dot < 0 ? [-b[0], -b[1], -b[2], -b[3]] : b;
  dot = Math.abs(dot);
  if (dot > 0.9995) {
    const r: Quat = [a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t];
    const n = Math.hypot(...r) || 1;
    return [r[0] / n, r[1] / n, r[2] / n, r[3] / n];
  }
  const th = Math.acos(dot);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
}

export class Interpolator {
  private buf = new Map<number, Sample[]>();
  private still = new Set<number>(); // cuerpos cuya última pose ya se aplicó
  private offset: number | null = null; // hora del anfitrión − hora local (con la menor latencia vista)
  private lastSeen = 0;
  delay = INTERP_DELAY;

  // Llamar al recibir cualquier mensaje con hora del anfitrión.
  observeClock(hostT: number, localNow = performance.now() / 1000) {
    const sample = hostT - localNow;
    if (this.offset === null || sample > this.offset) this.offset = sample;
    // Deriva lenta hacia abajo para adaptarse si la latencia sube de forma sostenida.
    else this.offset -= Math.min(0.002, (this.offset - sample) * 0.02);
    this.lastSeen = localNow;
  }

  // Hora del anfitrión que se está reproduciendo ahora.
  renderTime(localNow = performance.now() / 1000) {
    return this.offset === null ? -Infinity : localNow + this.offset - this.delay;
  }

  // Pose final conocida (estado completo): se fija sin interpolar.
  set(id: number, t: number, p: Vec3, q: Quat) {
    this.buf.set(id, [{ t, p, q }]);
    this.still.delete(id);
  }

  push(t: number, id: number, p: Vec3, q: Quat) {
    let arr = this.buf.get(id);
    if (!arr) this.buf.set(id, (arr = []));
    const last = arr[arr.length - 1];
    if (last && t <= last.t) return;
    // Si llevaba rato quieto, su última pose "vale" hasta justo antes de esta muestra.
    if (last && t - last.t > 0.25) last.t = t - 1 / 15;
    arr.push({ t, p, q });
    if (arr.length > 30) arr.splice(0, arr.length - 30);
    this.still.delete(id);
  }

  remove(id: number) {
    this.buf.delete(id);
    this.still.delete(id);
  }

  clear() {
    this.buf.clear();
    this.still.clear();
  }

  sample(apply: (id: number, p: Vec3, q: Quat) => void, localNow = performance.now() / 1000) {
    const rt = this.renderTime(localNow);
    for (const [id, arr] of this.buf) {
      if (!arr.length) continue;
      // Descartar las muestras que ya han quedado atrás (dejando una anterior a rt).
      while (arr.length > 1 && arr[1].t <= rt) arr.shift();
      const a = arr[0];
      const b = arr[1];
      if (!b) {
        // Última pose conocida: se aplica una vez y el cuerpo se queda quieto.
        if (!this.still.has(id)) {
          apply(id, a.p, a.q);
          this.still.add(id);
        }
        continue;
      }
      this.still.delete(id);
      if (rt <= a.t) {
        apply(id, a.p, a.q);
        continue;
      }
      const k = (rt - a.t) / (b.t - a.t);
      apply(id, [a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k, a.p[2] + (b.p[2] - a.p[2]) * k], slerp(a.q, b.q, k));
    }
  }

  get age() {
    return performance.now() / 1000 - this.lastSeen;
  }
}
