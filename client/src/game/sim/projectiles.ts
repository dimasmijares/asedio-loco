import { AMMO, type AmmoId } from '../../../../shared/ammo';
import { landingPoint, launchVelocity, type Aim } from '../../../../shared/ballistics';
import { buildCastle } from '../../../../shared/castle';
import { castleOrigin, launchPoint } from '../../../../shared/map';
import { v3, type Vec3 } from '../../../../shared/math';
import { RAPIER } from './rapier';
import type { Rec, Sim } from './sim';

export interface ProjectileBehavior {
  maxLife?: number;
  onLaunch?(owner: number): void; // munición sin cuerpo (defensiva, piano)
  onSpawn?(r: Rec): void;
  onStep?(r: Rec, dt: number): void;
  onContact?(r: Rec, other: Rec | null): void;
}

const tv = (v: { x: number; y: number; z: number }): Vec3 => [v.x, v.y, v.z];


// Ajustes de equilibrio (WRK-TASK-021, medidos con tests/balance/destrozo).
const LOG_SPIN = 12; // rad/s que mantiene el tronco al rodar
// Gallina bombardera (WRK-TASK-028): botes cortos y bajos hacia el castillo más cercano y, en
// cada uno, un racimo de huevos que explotan al tocar algo.
const CHICKEN_BOUNCES = 3;
const CHICKEN_HOP: [number, number] = [2.5, 4.5]; // m/s en horizontal y hacia arriba en cada bote
const EGGS = [6, 5, 5]; // huevos por bote
export const EGG_SCALE = 0.45; // un proyectil de gallina a esta escala es un huevo
const EGG_RADIUS = 2.2;
const EGG_FORCE = 72;
const EGG_KING = 0.3; // los huevos apenas le hacen daño al rey: es munición de destrozo
const EGG_FUSE = 1.5; // s: si no toca nada antes, explota igual
const MAGNET_TIME = 2.3; // s que dura el campo del imán
const MAGNET_STRENGTH = 26;
// Vaca: cráter que rompe piedra cerca del centro. Sandía: carga pegada que revienta desde dentro.
const COW_RADIUS = 4.8;
const COW_FORCE = 120;
const MELON_RADIUS = 4.0;
const MELON_FORCE = 130;
const MELON_PIERCE = 2;

export function behaviorFor(id: AmmoId, sim: Sim, aim?: Aim): ProjectileBehavior {
  switch (id) {
    case 'rock':
      return { maxLife: 6 };

    case 'log': {
      let rolling = false;
      return {
        maxLife: 7.5,
        onContact() {
          rolling = true;
        },
        onStep(r) {
          if (!rolling) return;
          // Sigue rodando: mantiene el giro alrededor de su eje largo.
          const w = r.body.angvel();
          const sp = Math.hypot(w.x, w.y, w.z);
          if (sp < LOG_SPIN && sp > 0.01) {
            const k = LOG_SPIN / sp;
            r.body.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true);
          }
        },
      };
    }

    case 'coconuts': {
      let split = false;
      return {
        maxLife: 6,
        onStep(r) {
          if (split || r.body.linvel().y > 0) return;
          split = true;
          const p = tv(r.body.translation());
          const v = tv(r.body.linvel());
          sim.removeRec(r, 'proj');
          sim.events.push({ e: 'fx', kind: 'split', p });
          const side = v3.norm([v[2], 0, -v[0]]);
          const fwd = v3.norm([v[0], 0, v[2]]);
          // Abanico cerrado: los 4 caen repartidos sobre el mismo castillo, no por media isla.
          const offs: [number, number][] = [
            [1.3, 0.5],
            [-1.3, 0.5],
            [0.55, -0.8],
            [-0.55, -0.8],
          ];
          for (const [s, f] of offs) {
            const dv = v3.add(v3.scale(side, s), v3.scale(fwd, f));
            sim.spawnProjectile(AMMO.coconuts, r.slot, v3.add(p, v3.scale(dv, 0.15)), v3.add(v, dv), { scale: 0.72, behavior: { maxLife: 5 } });
          }
        },
      };
    }

    case 'cow': {
      let mooed = false;
      return {
        maxLife: 6,
        onSpawn(r) {
          sim.events.push({ e: 'fx', kind: 'moo', p: tv(r.body.translation()), id: r.id });
        },
        onStep(r) {
          if (!mooed && sim.time - r.born! > 0.9) {
            mooed = true;
            sim.events.push({ e: 'fx', kind: 'moo', p: tv(r.body.translation()), id: r.id });
          }
        },
        onContact(r) {
          if (sim.time - r.born! < 0.08) return;
          const p = tv(r.body.translation());
          sim.removeRec(r, 'proj');
          sim.explode(p, COW_RADIUS, COW_FORCE, r.slot, 'cow');
        },
      };
    }

    case 'melon': {
      let stuckAt = -1;
      return {
        maxLife: 7,
        onContact(r, other) {
          if (stuckAt >= 0) return;
          stuckAt = sim.time;
          const p = tv(r.body.translation());
          sim.events.push({ e: 'fx', kind: 'stick', p, id: r.id });
          r.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          r.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
          if (other && other.kind !== 'proj') {
            // Se pega al bloque: unión fija en la pose relativa actual.
            const pa = tv(other.body.translation());
            const qa = other.body.rotation();
            const inv = { x: -qa.x, y: -qa.y, z: -qa.z, w: qa.w };
            const rel = rotateR(inv, v3.sub(p, pa));
            const relQ = mulR(inv, r.body.rotation());
            sim.world.createImpulseJoint(RAPIER.JointData.fixed({ x: rel[0], y: rel[1], z: rel[2] }, relQ, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }), other.body, r.body, true);
          } else {
            r.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
          }
          sim.later(2, () => {
            if (!sim.recs.has(r.id)) return;
            const q = tv(r.body.translation());
            sim.removeRec(r, 'proj');
            sim.explode(q, MELON_RADIUS, MELON_FORCE, r.slot, 'melon', { pierce: MELON_PIERCE });
          });
        },
      };
    }

    case 'chicken': {
      let bounces = 0;
      let lastBounce = -1;
      const egg = (r: Rec): ProjectileBehavior => {
        const boom = (e: Rec) => {
          const p = tv(e.body.translation());
          sim.removeRec(e, 'proj');
          sim.explode(p, EGG_RADIUS, EGG_FORCE, r.slot, 'egg', { king: EGG_KING });
        };
        return {
          maxLife: EGG_FUSE + 0.5,
          onStep: (e) => void (sim.time - e.born! > EGG_FUSE && boom(e)),
          onContact: (e) => void (sim.time - e.born! > 0.05 && boom(e)),
        };
      };
      return {
        maxLife: 7,
        onSpawn(r) {
          sim.events.push({ e: 'fx', kind: 'cluck', p: tv(r.body.translation()), id: r.id });
        },
        onContact(r) {
          if (sim.time - lastBounce < 0.2) return;
          lastBounce = sim.time;
          const p = tv(r.body.translation());
          sim.events.push({ e: 'fx', kind: 'cluck', p, id: r.id });
          // Racimo: los huevos salen en corona hacia fuera y hacia arriba.
          const n = EGGS[bounces];
          const turn = Math.random() * Math.PI * 2;
          for (let i = 0; i < n; i++) {
            const a = turn + (i / n) * Math.PI * 2;
            const h = 1.5 + Math.random() * 2;
            sim.spawnProjectile(AMMO.chicken, r.slot, v3.add(p, [0, 0.35, 0]), [Math.cos(a) * h, 2.5 + Math.random() * 1.5, Math.sin(a) * h], { scale: EGG_SCALE, behavior: egg(r) });
          }
          bounces++;
          if (bounces >= CHICKEN_BOUNCES) {
            sim.removeRec(r, 'proj');
            sim.events.push({ e: 'boom', p, r: 1.2, kind: 'peck' });
            return;
          }
          // Bote corto y bajo hacia el castillo rival más cercano: se queda encima soltando huevos.
          let best: Vec3 | null = null;
          for (const k of sim.kings.values()) {
            if (k.slot === r.slot) continue;
            const c = castleOrigin(k.slot);
            if (!best || Math.hypot(c[0] - p[0], c[2] - p[2]) < Math.hypot(best[0] - p[0], best[2] - p[2])) best = c;
          }
          const v = r.body.linvel();
          const to = best ? v3.norm([best[0] - p[0], 0, best[2] - p[2]]) : v3.norm([v.x, 0, v.z]);
          const d = best ? Math.hypot(best[0] - p[0], best[2] - p[2]) : 9;
          const hop = Math.min(CHICKEN_HOP[0], d);
          r.body.setLinvel({ x: to[0] * hop, y: CHICKEN_HOP[1], z: to[2] * hop }, true);
          r.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        },
      };
    }

    case 'piano':
      return {
        // El piano no vuela: cae en vertical sobre el punto donde caería el disparo.
        onLaunch(owner) {
          const a = aim!;
          const p0 = launchPoint(owner);
          const land = landingPoint(p0, launchVelocity(a), 1.5, { drag: AMMO.piano.drag, windFactor: AMMO.piano.windFactor, wind: sim.wind }) ?? p0;
          sim.events.push({ e: 'fx', kind: 'pianoMark', p: land, slot: owner });
          sim.later(1.1, () => {
            sim.spawnProjectile(AMMO.piano, owner, [land[0], land[1] + 22, land[2]], [0, -4, 0], {
              behavior: {
                maxLife: 6,
                onSpawn: (r) => {
                  r.body.setAngvel({ x: 0.3, y: 0.8, z: 0.2 }, true);
                  sim.events.push({ e: 'fx', kind: 'piano', p: land, id: r.id });
                },
              },
            });
          });
        },
      };

    case 'blackhole': {
      let opened = false;
      return {
        maxLife: 6,
        onContact(r) {
          if (opened) return;
          opened = true;
          const p = v3.add(tv(r.body.translation()), [0, 0.8, 0]);
          sim.removeRec(r, 'proj');
          sim.addField({ kind: 'blackhole', p, until: sim.time + 2.2, radius: 5.5, strength: 50, owner: r.slot });
          sim.events.push({ e: 'fx', kind: 'blackhole', p, slot: r.slot });
          sim.later(2.2, () => sim.explode(p, 4, 9, r.slot, 'implode'));
        },
      };
    }

    case 'magnet': {
      let on = false;
      return {
        maxLife: 6,
        onContact(r) {
          if (on) return;
          on = true;
          const p = v3.add(tv(r.body.translation()), [0, 1.5, 0]);
          sim.removeRec(r, 'proj');
          sim.addField({ kind: 'magnet', p, until: sim.time + MAGNET_TIME, radius: 10, strength: MAGNET_STRENGTH, owner: r.slot });
          sim.events.push({ e: 'fx', kind: 'magnet', p, slot: r.slot });
        },
      };
    }

    case 'snowball': {
      let touching = 0;
      let radius = AMMO.snowball.radius;
      return {
        maxLife: 8,
        onContact() {
          touching = 0.25;
        },
        onStep(r, dt) {
          touching -= dt;
          // Mientras toque algo (suelo o bloques) está rodando.
          sim.world.contactPairsWith(r.col, () => (touching = 0.1));
          if (touching <= 0) return;
          const v = r.body.linvel();
          const sp = Math.hypot(v.x, v.z);
          if (sp < 1.2) return;
          // Una bola que crece coge inercia: mientras rueda no baja de 9 m/s.
          if (sp < 9) r.body.setLinvel({ x: (v.x / sp) * 9, y: v.y, z: (v.z / sp) * 9 }, true);
          if (radius >= 1.6) return;
          // Crece al rodar: nuevo colisionador más grande, misma densidad (más masa).
          radius = Math.min(1.6, radius + dt * 0.8);
          sim.world.removeCollider(r.col, false);
          sim.byHandle.delete(r.col.handle);
          const a = AMMO.snowball;
          r.col = sim.world.createCollider(
            RAPIER.ColliderDesc.ball(radius)
              .setDensity(a.density)
              .setFriction(a.friction)
              .setRestitution(a.restitution)
              .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS | RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
              .setContactForceEventThreshold(40),
            r.body,
          );
          sim.byHandle.set(r.col.handle, r);
          r.size = [radius * 2, radius * 2, radius * 2];
          sim.events.push({ e: 'grow', id: r.id, r: radius / a.radius });
        },
      };
    }

    case 'scaffold':
      return {
        onLaunch(owner) {
          const alive = sim.aliveBlockIds(owner);
          const missing = buildCastle(owner)
            .blocks.filter((b) => !alive.has(b.id))
            .sort((a, b) => a.p[1] - b.p[1]);
          let built = 0;
          for (const b of missing) {
            if (built >= 10) break;
            let blocked = false;
            sim.world.intersectionsWithShape({ x: b.p[0], y: b.p[1], z: b.p[2] }, { x: b.q[0], y: b.q[1], z: b.q[2], w: b.q[3] }, new RAPIER.Cuboid(b.size[0] * 0.45, b.size[1] * 0.45, b.size[2] * 0.45), (c) => {
              if (sim.byHandle.has(c.handle) || sim.staticHandles.has(c.handle)) blocked = true;
              return !blocked;
            });
            if (blocked || b.p[1] - b.size[1] / 2 < sim.lavaY) continue;
            sim.addBlock(b, true);
            sim.events.push({ e: 'spawn', id: b.id, mat: b.mat, size: b.size, p: b.p, q: b.q, slot: owner });
            built++;
          }
          sim.events.push({ e: 'fx', kind: 'build', p: launchPoint(owner), slot: owner });
        },
      };

    case 'bubble':
      return {
        onLaunch(owner) {
          sim.shields.set(owner, 1);
          sim.events.push({ e: 'shield', slot: owner, on: true });
        },
      };
  }
}

type RQ = { x: number; y: number; z: number; w: number };

function mulR(a: RQ, b: RQ): RQ {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function rotateR(q: RQ, v: Vec3): Vec3 {
  const p = mulR(mulR(q, { x: v[0], y: v[1], z: v[2], w: 0 }), { x: -q.x, y: -q.y, z: -q.z, w: q.w });
  return [p.x, p.y, p.z];
}
