---
id: WRK-TASK-027
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-027 — Explosiones que rompen piedra: vaca y sandía

## Objective

Que la vaca deje un cráter redondo (14-18 bloques) y la sandía un hueco profundo en el punto exacto donde se pega (14-18 bloques, mejor contra torres).

## File Scope

- `client/src/game/sim/sim.ts` (`explode`: caída, oclusión y fractura)
- `client/src/game/sim/projectiles.ts` (vaca y sandía)

## Implementation Notes

- Vaca: radio de 3,6 a ~4,5 m y fuerza que fracture piedra hasta ~1,5 m del centro (hoy 28; la piedra pide 36). Más impulso para que los trozos vuelen.
- Sandía: la explosión nace **dentro** del bloque al que se pega y la oclusión no la frena ni en ese bloque ni en sus vecinos (carga dirigida hacia el castillo). Pepitas como metralla ligera.
- Ajustar la caída (`^1.4`) si hace falta para que el cráter tenga borde nítido.
- La burbuja sigue parando la onda de fuera.

## Acceptance Criteria

- [x] Vaca y sandía en 14-18 bloques y con piedra rota en el centro.
- [x] Como mucho 3 de 12 reyes con cada una.
- [x] Las demás municiones con explosión (gallina, agujero negro) medidas y anotadas.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Cambios:**
  - vaca: radio de 3,6 a 4,8 m y fuerza de 28 a 120;
  - sandía: radio de 3,6 a 4 m, fuerza de 34 a 130 y `pierce` de 2 m: `explode` acepta ese parámetro y los bloques a menos de esa distancia del centro no hacen de escudo para otros bloques (al rey sí lo siguen protegiendo; sin eso la sandía se pegaba al tejado de madera, 1,5 m por encima del rey, y lo mataba en 8 de 12);
  - rey: una explosión a más de 1,2 m le quita como mucho un 60 % (antes, `j / 40` sin tope).
- **Destrozo (12 disparos), antes → después:**
  - vaca: de 2,4 a 16,5 bloques, piedra de 0,8 a 7,6, reyes de 0 a 3 de 12;
  - sandía: de 2,8 a 15,0 bloques, piedra de 0,0 a 8,3, reyes de 0 a 2 de 12;
  - gallina 5,2 y agujero negro 16,9: sin cambios fuera del ruido;
  - media: de 8,4 a 11,0.
- **Equilibrio (8 partidas):**
  - normal: de 9,1 rondas y 165 s a 10,0 rondas y 174 s (una medición intermedia, sin el tope del rey, dio 8,1);
  - difícil: de 7,3 rondas y 139 s a 6,1-6,9 rondas y 115-128 s (dos mediciones). Sin el tope del rey bajaba a 4,6.
- La prueba de destrozo baila algo entre ejecuciones (la torsión de `explode` usa `Math.random`).
- E2E de física en local: 4 de 4.
